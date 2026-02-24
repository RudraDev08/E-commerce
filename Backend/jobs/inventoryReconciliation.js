import mongoose from 'mongoose';
import InventoryLedger from '../models/inventory/InventoryLedger.model.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import InventoryDriftLog from '../models/inventory/InventoryDriftLog.js';
import cron from 'node-cron';

/**
 * INVENTORY RECONCILIATION JOB
 * ─────────────────────────────────────────────────────────────────────────────
 * Nightly drift detection layer.
 * Recalculates total stock from ledger entries and compares against master.
 */

export const reconcileInventory = async () => {
    console.log('[Job] Starting Inventory Reconciliation...');
    const startTime = Date.now();

    try {
        // 1. Get all variants from InventoryMaster
        const inventories = await InventoryMaster.find({}).lean();
        console.log(`[Job] Found ${inventories.length} inventory records to reconcile.`);

        const drifts = [];

        for (const master of inventories) {
            // ✅ Step 2 — Recalculate from Ledger
            const result = await InventoryLedger.aggregate([
                { $match: { variantId: master.variantId } },
                {
                    $group: {
                        _id: '$variantId',
                        // We need to sum quantities based on transaction logic
                        // In this system, 'quantity' in Ledger is the delta applied.
                        total: { $sum: '$quantity' }
                    }
                }
            ]);

            const actualStockFromLedger = result.length > 0 ? result[0].total : 0;
            const expectedStock = master.totalStock;

            // ✅ Step 3 — Compare Against Master
            if (actualStockFromLedger !== expectedStock) {
                const drift = expectedStock - actualStockFromLedger;
                console.warn(`[Drift Detected] SKU: ${master.sku}, Expected: ${expectedStock}, ledgerSum: ${actualStockFromLedger}, Drift: ${drift}`);

                drifts.push({
                    variantId: master.variantId,
                    sku: master.sku,
                    expectedStock,
                    actualStockFromLedger,
                    drift,
                    severity: Math.abs(drift) > 50 ? 'HIGH' : 'MEDIUM',
                    status: 'OPEN',
                    notes: `System detected mismatch between Master and Ledger sum. Difference: ${drift} units.`
                });
            }
        }

        // ✅ Step 4 — Store Drift Report
        if (drifts.length > 0) {
            await InventoryDriftLog.insertMany(drifts);
            console.log(`[Job] Reconciliation complete. Recorded ${drifts.length} drifts.`);
        } else {
            console.log('[Job] Reconciliation complete. No drifts detected.');
        }

    } catch (error) {
        console.error('[Job] Reconciliation Failed:', error);
    } finally {
        const duration = (Date.now() - startTime) / 1000;
        console.log(`[Job] Total time: ${duration}s`);
    }
};

// ✅ Step 1 — Nightly Cron Job (2 AM)
// turbo
cron.schedule('0 2 * * *', () => {
    reconcileInventory();
});
