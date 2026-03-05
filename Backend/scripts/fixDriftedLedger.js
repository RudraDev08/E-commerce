/**
 * fixDriftedLedger.js
 * ─────────────────────────────────────────────────────────────────────────
 * One-shot backfill: for each InventoryMaster where the ledger cannot
 * account for the current totalStock, insert a synthetic STOCK_IN
 * entry equal to the gap.  After this runs the reconciler will agree and
 * stop emitting INVENTORY_DRIFT_FIXED / stock_drift_total warnings.
 *
 * Usage:
 *   node --experimental-vm-modules Backend/scripts/fixDriftedLedger.js
 *   (or add a "fixDrift" npm script and run: npm run fixDrift)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import InventoryLedger from '../models/inventory/InventoryLedger.model.js';

async function main() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce';
    await mongoose.connect(uri);
    console.log('✅  Connected to MongoDB:', uri);

    const inventories = await InventoryMaster.find({ isDeleted: { $ne: true } }).lean();
    console.log(`🔍  Checking ${inventories.length} inventory records…`);

    let fixed = 0;
    let clean = 0;

    for (const inv of inventories) {
        // Recompute the same formula the reconciler uses
        const stats = await InventoryLedger.aggregate([
            {
                $match: {
                    variantId: inv.variantId,
                    transactionType: {
                        $in: ['STOCK_IN', 'RETURN_RESTORE', 'ORDER_CANCEL', 'OPENING_STOCK',
                            'STOCK_OUT', 'ORDER_DEDUCT', 'ADJUSTMENT']
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIn: { $sum: { $cond: [{ $in: ['$transactionType', ['STOCK_IN', 'RETURN_RESTORE', 'ORDER_CANCEL', 'OPENING_STOCK']] }, '$quantity', 0] } },
                    totalSold: { $sum: { $cond: [{ $in: ['$transactionType', ['STOCK_OUT', 'ORDER_DEDUCT']] }, { $abs: '$quantity' }, 0] } },
                    adjustmentNet: { $sum: { $cond: [{ $eq: ['$transactionType', 'ADJUSTMENT'] }, '$quantity', 0] } }
                }
            }
        ]);

        const totalIn = (stats[0]?.totalIn || 0) + Math.max(0, stats[0]?.adjustmentNet || 0);
        const adjustOut = Math.abs(Math.min(0, stats[0]?.adjustmentNet || 0));
        const totalSold = (stats[0]?.totalSold || 0) + adjustOut;
        const reserved = inv.reservedStock || 0;

        const ledgerTotal = totalIn - totalSold;       // what the ledger says totalStock should be
        const masterTotal = inv.totalStock;

        const gap = masterTotal - ledgerTotal;

        if (gap === 0) {
            clean++;
            continue;
        }

        // Insert a synthetic STOCK_IN (or STOCK_OUT for negative gap) to bridge the gap.
        // NOTE: InventoryLedger.transactionType enum does not include 'OPENING_STOCK';
        // use STOCK_IN / STOCK_OUT which are valid enum values.
        const backfillType = gap > 0 ? 'STOCK_IN' : 'STOCK_OUT';
        const backfillReason = gap > 0 ? 'STOCK_RECEIVED' : 'MANUAL_CORRECTION';
        const backfillQty = Math.abs(gap);

        await InventoryLedger.create({
            variantId: inv.variantId,
            productId: inv.productId || new mongoose.Types.ObjectId(),   // fallback dummy
            sku: inv.sku || 'UNKNOWN',
            transactionType: backfillType,
            quantity: backfillQty,
            stockBefore: { total: ledgerTotal, reserved, available: Math.max(0, ledgerTotal - reserved) },
            stockAfter: { total: masterTotal, reserved, available: Math.max(0, masterTotal - reserved) },
            reason: backfillReason,
            notes: `Backfill: gap of ${gap} units between InventoryMaster and ledger — created by fixDriftedLedger.js`,
            performedBy: 'SYSTEM',
            performedByRole: 'SYSTEM',
            referenceType: 'SYSTEM'
        });

        console.log(`  ✔  variantId=${inv.variantId}  sku=${inv.sku || 'N/A'}  gap=${gap}  → ${backfillType} x${backfillQty}`);
        fixed++;
    }

    console.log(`\n📊  Done.  Fixed: ${fixed}  Already-clean: ${clean}`);
    await mongoose.disconnect();
    console.log('👋  Disconnected');
}

main().catch(err => {
    console.error('❌  Script failed:', err);
    process.exit(1);
});
