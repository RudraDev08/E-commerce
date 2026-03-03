/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 5 — INVENTORY INTEGRITY SCANNER (Daily Cron Job)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Scheduled to run at 02:00 AM server time every day.
 * Detects: negative stock, drift, missing inventory, orphan inventory.
 * Emits health metrics + console alerts (wire up to Slack/PagerDuty as needed).
 *
 * Registration: Call initInventoryScanner() once from Backend/src/app.js
 *               after all models are registered.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';

// ── Internal metric counters ──────────────────────────────────────────────────
const metrics = {
    lastRunAt: null,
    negativeStockCount: 0,
    missingInventoryCount: 0,
    orphanInventoryCount: 0,
    driftCount: 0,
    totalVariantsChecked: 0,
    totalInventoryRecords: 0,
};

/**
 * Export current health metrics for use by a /health or /metrics endpoint.
 */
export const getInventoryScannerMetrics = () => ({ ...metrics });

/**
 * Run a full integrity scan against VariantMaster and InventoryMaster.
 * This is the single-run function — called by the cron scheduler below.
 */
export async function runInventoryIntegrityScan() {
    const InventoryMaster = mongoose.models.InventoryMaster;
    const VariantMaster = mongoose.models.VariantMaster;

    if (!InventoryMaster || !VariantMaster) {
        console.error('[InventoryScanner] Models not registered. Skipping scan.');
        return;
    }

    console.log('[InventoryScanner] Starting integrity scan...');
    metrics.lastRunAt = new Date().toISOString();

    // Reset counters
    metrics.negativeStockCount = 0;
    metrics.missingInventoryCount = 0;
    metrics.orphanInventoryCount = 0;
    metrics.driftCount = 0;

    // ── 1. Negative availableStock ────────────────────────────────────────────
    const negativeRecords = await InventoryMaster.find(
        { availableStock: { $lt: 0 }, isDeleted: { $ne: true } },
        'variantId availableStock totalStock reservedStock'
    ).lean();

    metrics.negativeStockCount = negativeRecords.length;
    if (negativeRecords.length > 0) {
        console.error(`[InventoryScanner] ⚠ ALERT: ${negativeRecords.length} records with negative availableStock!`);
        negativeRecords.forEach(r =>
            console.error(`   variantId=${r.variantId} available=${r.availableStock} total=${r.totalStock} reserved=${r.reservedStock}`)
        );
        // Auto-repair: reset each to max(0, totalStock - reservedStock)
        for (const r of negativeRecords) {
            const corrected = Math.max(0, (r.totalStock || 0) - (r.reservedStock || 0));
            await InventoryMaster.updateOne({ _id: r._id }, { $set: { availableStock: corrected } });
        }
        console.log(`[InventoryScanner] Auto-repaired ${negativeRecords.length} negative stock records.`);
    }

    // ── 2. Drift check: reservedStock > totalStock ────────────────────────────
    const driftRecords = await InventoryMaster.find({
        $expr: { $gt: ['$reservedStock', '$totalStock'] },
        isDeleted: { $ne: true }
    }, 'variantId totalStock reservedStock').lean();

    metrics.driftCount = driftRecords.length;
    if (driftRecords.length > 0) {
        console.warn(`[InventoryScanner] ⚠ DRIFT: ${driftRecords.length} records where reservedStock > totalStock.`);
        for (const r of driftRecords) {
            console.warn(`   variantId=${r.variantId} total=${r.totalStock} reserved=${r.reservedStock}`);
            // CAP reservedStock at totalStock — never zero (would discard real reservations)
            const cappedReserved = r.totalStock || 0;
            await InventoryMaster.updateOne(
                { _id: r._id },
                { $set: { reservedStock: cappedReserved, availableStock: 0 } }
            );
        }
        console.log(`[InventoryScanner] Capped reservedStock in ${driftRecords.length} drift records.`);
    }


    // ── 3. Missing inventory for active variants ──────────────────────────────
    const activeVariants = await VariantMaster.find(
        { status: { $in: ['ACTIVE', 'OUT_OF_STOCK'] } },
        '_id sku productGroupId'
    ).lean();

    metrics.totalVariantsChecked = activeVariants.length;

    for (const v of activeVariants) {
        const hasInventory = await InventoryMaster.exists({ variantId: v._id, isDeleted: { $ne: true } });
        if (!hasInventory) {
            console.warn(`[InventoryScanner] ⚠ MISSING INVENTORY for variant ${v._id}. Auto-creating...`);
            // Fetch default warehouse for the new record
            const Warehouse = mongoose.models.Warehouse;
            let whId = null;
            let whLoc = 'Default';
            if (Warehouse) {
                const wh = await Warehouse.findOne({ isDefault: true }).lean();
                if (wh) {
                    whId = wh._id;
                    whLoc = wh.name;
                }
            }

            await InventoryMaster.create({
                variantId: v._id,
                productId: v.productGroupId,
                sku: v.sku,
                totalStock: 0,
                reservedStock: 0,
                availableStock: 0,
                status: 'OUT_OF_STOCK',
                lowStockThreshold: 5,
                warehouseId: whId,
                warehouseLocation: whLoc,
                isDeleted: false,
            });
            metrics.missingInventoryCount++;
        }
    }

    // ── 4. Orphan inventory (inventory with no matching variant) ─────────────
    const validVariantIds = new Set(activeVariants.map(v => v._id.toString()));
    const allInventoryRecords = await InventoryMaster.find(
        { isDeleted: { $ne: true } },
        'variantId'
    ).lean();

    metrics.totalInventoryRecords = allInventoryRecords.length;

    for (const inv of allInventoryRecords) {
        if (!validVariantIds.has(inv.variantId?.toString())) {
            // Check if the variant is archived (not just missing)
            const isArchived = await VariantMaster.exists({ _id: inv.variantId, status: 'ARCHIVED' });
            if (!isArchived) {
                console.warn(`[InventoryScanner] ⚠ ORPHAN inventory ${inv._id} — no matching variant found.`);
                await InventoryMaster.updateOne({ _id: inv._id }, { $set: { isDeleted: true, status: 'DISCONTINUED' } });
                metrics.orphanInventoryCount++;
            }
        }
    }

    // ── 5. Drift between variant count and inventory count ────────────────────
    const activeVariantCount = activeVariants.length;
    const activeInventoryCount = await InventoryMaster.countDocuments({ isDeleted: { $ne: true } });

    if (activeVariantCount !== activeInventoryCount) {
        console.warn(
            `[InventoryScanner] ⚠ COUNT DRIFT: Active variants=${activeVariantCount}, ` +
            `Active inventory records=${activeInventoryCount}. Difference=${Math.abs(activeVariantCount - activeInventoryCount)}`
        );
    }

    // ── Final summary ─────────────────────────────────────────────────────────
    console.log('[InventoryScanner] ─── SCAN COMPLETE ────────────────────────');
    console.log(`  Negative stock records:    ${metrics.negativeStockCount}`);
    console.log(`  Drift records:             ${metrics.driftCount}`);
    console.log(`  Missing inventory created: ${metrics.missingInventoryCount}`);
    console.log(`  Orphan records archived:   ${metrics.orphanInventoryCount}`);
    console.log(`  Total variants checked:    ${metrics.totalVariantsChecked}`);
    console.log(`  Total inventory records:   ${metrics.totalInventoryRecords}`);
    console.log('[InventoryScanner] ───────────────────────────────────────────');
}

/**
 * Initialize the cron-based scanner.
 * Call once from app.js after DB connection is established.
 */
export function initInventoryScanner() {
    // Dynamic import to avoid requiring node-cron as a hard dependency
    import('node-cron').then(({ default: cron }) => {
        // Run daily at 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            try {
                await runInventoryIntegrityScan();
            } catch (err) {
                console.error('[InventoryScanner] Scan failed with error:', err.message);
            }
        });
        console.log('[InventoryScanner] Daily scanner registered at 02:00 AM.');
    }).catch(() => {
        console.warn('[InventoryScanner] node-cron not installed. Scanner will not run automatically.');
        console.warn('                   Install with: npm install node-cron');
    });
}
