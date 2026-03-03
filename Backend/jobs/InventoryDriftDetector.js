import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import logger from '../config/logger.js';

/**
 * INVENTORY DRIFT DETECTOR
 * Phase 3: Hardware for Flash-Sale Scale
 * 
 * Specifically checks for internal invariant violations:
 *   availableStock != totalStock - reservedStock
 *   totalStock < reservedStock
 */
export class InventoryDriftDetector {
    static async run() {
        logger.info('[DRIFT_DETECTOR] Starting Inventory consistency check...');

        let processed = 0;
        let drifts = 0;
        let repairs = 0;

        const cursor = InventoryMaster.find({ isDeleted: false }).lean().cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            processed++;

            const expectedAvailable = doc.totalStock - doc.reservedStock;
            let needsRepair = false;
            const updateFields = {};

            // Check Invariant 1: Internal math
            if (doc.availableStock !== expectedAvailable) {
                logger.warn(`[DRIFT_DETECTOR] Invariant violation on ${doc.variantId}: availableStock (${doc.availableStock}) != expected (${expectedAvailable})`);
                updateFields.availableStock = expectedAvailable;
                needsRepair = true;
            }

            // Check Invariant 2: Negative availability (corruption check)
            if (expectedAvailable < 0) {
                logger.error(`[DRIFT_DETECTOR] Corruption detected on ${doc.variantId}: totalStock (${doc.totalStock}) < reservedStock (${doc.reservedStock})`);
                // Repair strategy: set totalStock = reservedStock to stop the bleed
                updateFields.totalStock = doc.reservedStock;
                updateFields.availableStock = 0;
                needsRepair = true;
            }

            if (needsRepair) {
                drifts++;
                try {
                    await InventoryMaster.updateOne({ _id: doc._id }, { $set: updateFields });
                    repairs++;
                } catch (err) {
                    logger.error(`[DRIFT_DETECTOR] Repair failed for ${doc._id}: ${err.message}`);
                }
            }
        }

        logger.info('[DRIFT_DETECTOR] Completed.', { processed, drifts, repairs });
        return { processed, drifts, repairs };
    }
}

export default InventoryDriftDetector;
