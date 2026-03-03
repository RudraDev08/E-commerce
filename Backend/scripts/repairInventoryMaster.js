/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 3 — INVENTORY MASTER RESURRECTION SCRIPT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 *
 * What it does:
 *   1. For every active VariantMaster → ensure InventoryMaster exists (ensureForVariant).
 *   2. Recalculate availableStock for every record (enforce invariant).
 *   3. Reset reservedStock when it would exceed totalStock (drift repair).
 *   4. Remove orphan InventoryMaster records (no matching VariantMaster).
 *   5. Report all drift events found.
 *
 * MUST RUN:
 *   - During a maintenance window (pause new cart reservations).
 *   - After Phase 1 attribute role migration completes.
 *   - With majority writeConcern active (default in Atlas; set below for local).
 *
 * Run:  node --experimental-vm-modules Backend/scripts/repairInventoryMaster.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import VariantMaster from '../models/masters/VariantMaster.enterprise.js';

async function main() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) throw new Error('MONGODB_URI not set in environment');

    await mongoose.connect(uri, { writeConcern: { w: 'majority' } });
    console.log('[InventoryRepair] Connected to MongoDB');

    // ── STEP 1: Rebuild missing InventoryMaster records ──────────────────────
    console.log('[InventoryRepair] STEP 1: Rebuilding missing inventory records...');
    const activeVariants = await VariantMaster.find({
        status: { $in: ['ACTIVE', 'OUT_OF_STOCK', 'DRAFT'] }
    }, '_id status productGroupId').lean();

    let created = 0;
    let alreadyExisted = 0;

    for (const variant of activeVariants) {
        const existing = await InventoryMaster.findOne({ variantId: variant._id });
        if (!existing) {
            await InventoryMaster.create({
                variantId: variant._id,
                totalStock: 0,
                reservedStock: 0,
                availableStock: 0,
                status: 'OUT_OF_STOCK',
                lowStockThreshold: 5,
                isDeleted: false,
            });
            console.log(`  + Created inventory for variant ${variant._id}`);
            created++;
        } else {
            alreadyExisted++;
        }
    }
    console.log(`  Done: ${created} created, ${alreadyExisted} already existed.\n`);

    // ── STEP 2: Recalculate availableStock + repair drift ────────────────────
    console.log('[InventoryRepair] STEP 2: Recalculating availableStock for all records...');
    const allInventory = await InventoryMaster.find({});
    let fixed = 0;
    let driftFixed = 0;

    for (const inv of allInventory) {
        let reservedStock = inv.reservedStock || 0;
        const totalStock = inv.totalStock || 0;

        // Drift: CAP reservedStock at totalStock — never zero it.
        // Zeroing discards real cart/reservation holds and risks over-selling.
        if (reservedStock > totalStock) {
            console.warn(
                `  ⚠ DRIFT CAP on variantId=${inv.variantId}: ` +
                `reservedStock(${reservedStock}) > totalStock(${totalStock}). ` +
                `Capping reservedStock to totalStock.`
            );
            reservedStock = totalStock;  // CAP — not zero
            driftFixed++;
        }

        const expectedAvailable = Math.max(0, totalStock - reservedStock);
        let expectedStatus = 'OUT_OF_STOCK';
        if (expectedAvailable > 0 && expectedAvailable <= (inv.lowStockThreshold || 5)) {
            expectedStatus = 'LOW_STOCK';
        } else if (expectedAvailable > 0) {
            expectedStatus = 'IN_STOCK';
        }

        // Only write if something changed
        if (
            inv.availableStock !== expectedAvailable ||
            inv.status !== expectedStatus ||
            inv.reservedStock !== reservedStock
        ) {
            await InventoryMaster.updateOne(
                { _id: inv._id },
                { $set: { availableStock: expectedAvailable, status: expectedStatus, reservedStock } }
            );
            fixed++;
        }
    }
    console.log(`  Done: ${fixed} records corrected, ${driftFixed} drift events repaired.\n`);

    // ── STEP 3: Remove orphan InventoryMaster records ────────────────────────
    console.log('[InventoryRepair] STEP 3: Removing orphan inventory records...');
    const validVariantIds = new Set(activeVariants.map(v => v._id.toString()));

    // Also include ARCHIVED variants to preserve history
    const archivedVariants = await VariantMaster.find({ status: 'ARCHIVED' }, '_id').lean();
    archivedVariants.forEach(v => validVariantIds.add(v._id.toString()));

    const inventoryRecords = await InventoryMaster.find({}, 'variantId').lean();
    let removed = 0;

    for (const inv of inventoryRecords) {
        if (!validVariantIds.has(inv.variantId?.toString())) {
            await InventoryMaster.deleteOne({ _id: inv._id });
            console.log(`  - Removed orphan inventory ${inv._id} (variantId: ${inv.variantId})`);
            removed++;
        }
    }
    console.log(`  Done: ${removed} orphan records removed.\n`);

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    console.log('[InventoryRepair] ─── FINAL SUMMARY ──────────────────────────');
    console.log(`  Active variants processed:  ${activeVariants.length}`);
    console.log(`  Inventory records created:  ${created}`);
    console.log(`  Records corrected:          ${fixed}`);
    console.log(`  Drift events repaired:      ${driftFixed}`);
    console.log(`  Orphan records removed:     ${removed}`);
    console.log('[InventoryRepair] ─────────────────────────────────────────────\n');

    await mongoose.disconnect();
    console.log('[InventoryRepair] Done. Connection closed.');
}

main().catch(err => {
    console.error('[InventoryRepair] FATAL:', err);
    process.exit(1);
});
