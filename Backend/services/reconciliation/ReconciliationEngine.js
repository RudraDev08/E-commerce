import mongoose from 'mongoose';
import logger from '../../config/logger.js';
import MetricsService from '../MetricsService.js';

export const runReconciliation = async () => {
    try {
        const VM = mongoose.models.VariantMaster;
        const IM = mongoose.models.InventoryMaster;
        if (!VM || !IM) return;

        // 1. Find variants that are ACTIVE but have no inventory
        const variants = await VM.find({ status: { $ne: 'ARCHIVED' } }).lean();

        let driftCount = 0;

        for (const variant of variants) {
            const inv = await IM.findOne({ variantId: variant._id });

            // Missing entirely
            if (!inv) {
                driftCount++;
                continue;
            }

            // Mismatched Math
            const expectedAvailable = Math.max(0, inv.totalStock - inv.reservedStock);
            if (inv.availableStock !== expectedAvailable || inv.reservedStock > inv.totalStock) {

                await IM.updateOne(
                    { _id: inv._id },
                    {
                        $set: {
                            reservedStock: Math.min(inv.totalStock, inv.reservedStock),
                            availableStock: expectedAvailable
                        }
                    }
                );

                logger.warn('INVENTORY_DRIFT_FIXED', { variantId: variant._id });
                driftCount++;
            }
        }

        // Setup global threshold triggering
        if (driftCount > 0) {
            MetricsService.trackStockDrift('SYSTEM', driftCount);

            // In a real system you'd set checkoutFrozen = true globally here if the threshold is massive
            if (driftCount >= 20) {
                global.systemState.checkoutFrozen = true;
                logger.error('CRITICAL: Massive stock drift detected. Checkout frozen.', { drift: driftCount });
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
