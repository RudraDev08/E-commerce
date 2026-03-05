import mongoose from 'mongoose';
import logger from '../../config/logger.js';
import MetricsService from '../MetricsService.js';

export const runReconciliation = async () => {
    try {
        const VM = mongoose.models.VariantMaster;
        const IM = mongoose.models.InventoryMaster;
        const IL = mongoose.models.InventoryLedger;
        if (!VM || !IM || !IL) return;

        const inventories = await IM.find({ isDeleted: { $ne: true } }).lean();
        let driftCount = 0;

        // STEP 2.2: Reconciliation Math
        // expected = (Total Stock In) - (Total Sold) - (Current Reserved)
        // masterStock here refers to total physical units ever introduced

        for (const inv of inventories) {
            const stats = await IL.aggregate([
                { $match: { variantId: inv.variantId, transactionType: { $in: ['STOCK_IN', 'RETURN_RESTORE', 'ORDER_CANCEL', 'OPENING_STOCK', 'STOCK_OUT', 'ORDER_DEDUCT', 'ADJUSTMENT'] } } },
                {
                    $group: {
                        _id: null,
                        // Standard inflows
                        totalIn: {
                            $sum: { $cond: [{ $in: ['$transactionType', ['STOCK_IN', 'RETURN_RESTORE', 'ORDER_CANCEL', 'OPENING_STOCK']] }, '$quantity', 0] }
                        },
                        // Standard outflows
                        totalSold: {
                            $sum: { $cond: [{ $in: ['$transactionType', ['STOCK_OUT', 'ORDER_DEDUCT']] }, { $abs: '$quantity' }, 0] }
                        },
                        // ADJUSTMENT: positive quantity = stock added, negative = stock removed
                        // Net adjustment so reconciler sees the full picture including pre-fix entries
                        adjustmentNet: {
                            $sum: { $cond: [{ $eq: ['$transactionType', 'ADJUSTMENT'] }, '$quantity', 0] }
                        }
                    }
                }
            ]);

            const masterStock = (stats[0]?.totalIn || 0) + Math.max(0, stats[0]?.adjustmentNet || 0);
            const adjustmentOut = Math.abs(Math.min(0, stats[0]?.adjustmentNet || 0));
            const sold = (stats[0]?.totalSold || 0) + adjustmentOut;
            const reserved = inv.reservedStock || 0;

            // STEP 5: Formula
            const expectedStock = masterStock - sold - reserved;
            const expectedTotalStock = masterStock - sold;

            if (inv.totalStock !== expectedTotalStock || inv.availableStock !== expectedStock) {
                driftCount++;

                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    await IM.updateOne(
                        { _id: inv._id },
                        {
                            $set: {
                                totalStock: expectedTotalStock,
                                availableStock: Math.max(0, expectedStock),
                                reservedStock: reserved,
                                lastUpdated: new Date()
                            }
                        },
                        { session }
                    );

                    await session.commitTransaction();

                    logger.warn('INVENTORY_DRIFT_FIXED', {
                        variantId: inv.variantId,
                        sku: inv.sku,
                        actualTotal: inv.totalStock,
                        expectedTotal: expectedTotalStock,
                        actualAvailable: inv.availableStock,
                        expectedAvailable: expectedStock
                    });
                } catch (e) {
                    await session.abortTransaction();
                    logger.error(`Reconciliation failed for ${inv.variantId}`, e);
                } finally {
                    session.endSession();
                }
            }
        }

        if (driftCount > 0) {
            MetricsService.trackStockDrift('SYSTEM', driftCount);

            if (driftCount >= 10) {
                global.systemState = global.systemState || {};
                global.systemState.checkoutFrozen = true;
                global.systemState.reason = 'Critical stock drift >= 10';

                try {
                    const SystemState = mongoose.models.SystemState;
                    if (SystemState) {
                        await SystemState.findOneAndUpdate(
                            {},
                            { checkoutFrozen: true, reason: 'Critical stock drift >= 10', triggeredAt: new Date() },
                            { upsert: true }
                        );
                    }

                    const AlertLog = mongoose.models.AlertLog;
                    if (AlertLog) {
                        const activeAlert = await AlertLog.findOne({ metric: 'stock_drift_total', isActive: true });
                        if (!activeAlert) {
                            await AlertLog.create({
                                metric: 'stock_drift_total',
                                value: driftCount,
                                severity: 'CRITICAL',
                                threshold: 10,
                                triggeredBy: 'RECONCILIATION_ENGINE'
                            });
                        }
                    }
                } catch (e) {
                    logger.error('Failed to persist drift freeze state', e);
                }

                logger.error('CRITICAL: Stock drift detected. Checkout FROZEN for safety.');
            }
        }

    } catch (err) {
        logger.error('Reconciliation Job Failed', err);
    }
};

// Start a 5-minute polling tick
export const startReconciliationDaemon = () => {
    setInterval(runReconciliation, 300000); // 5 min
};
