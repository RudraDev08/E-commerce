/**
 * inventorySnapshot.cron.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Nightly cron job: 0 0 * * * (midnight every day)
 *
 * For every active InventoryMaster record, captures a closing-balance snapshot
 * into the InventorySnapshot collection.
 *
 * This allows balance queries to use O(recent) ledger scans instead of
 * recomputing from the full ledger history on every read.
 *
 * Registration: import this file once in src/server.js after DB connection.
 */

import cron from 'node-cron';
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import InventorySnapshot from '../models/inventory/InventorySnapshot.model.js';
import InventoryLedger from '../models/inventory/InventoryLedger.model.js';
import logger from '../config/logger.js';

/**
 * Core snapshot logic — can be called manually for testing.
 */
export const runInventorySnapshot = async () => {
    const label = '[InventorySnapshot]';
    const startTime = Date.now();
    logger.info(`${label} Starting nightly inventory snapshot job...`);

    let snapshotCount = 0;
    let errorCount = 0;

    try {
        // Fetch all non-deleted inventory records
        const inventories = await InventoryMaster.find({ isDeleted: false })
            .select('variantId productId sku totalStock reservedStock availableStock')
            .lean();

        logger.info(`${label} Processing ${inventories.length} inventory records.`);

        const today = new Date();
        const periodKey = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'

        // Process in batches to avoid memory pressure
        const BATCH_SIZE = 200;
        for (let i = 0; i < inventories.length; i += BATCH_SIZE) {
            const batch = inventories.slice(i, i + BATCH_SIZE);

            await Promise.allSettled(batch.map(async (master) => {
                try {
                    // Fetch the latest ledger entry id for this variant (for reconciliation anchor)
                    const latestLedgerEntry = await InventoryLedger
                        .findOne({ variantId: master.variantId })
                        .sort({ createdAt: -1 })
                        .select('_id')
                        .lean();

                    const closingBalance = {
                        totalStock: master.totalStock ?? 0,
                        reservedStock: master.reservedStock ?? 0,
                        availableStock: master.availableStock ?? 0
                    };

                    await InventorySnapshot.findOneAndUpdate(
                        { variantId: master.variantId, periodKey },
                        {
                            $set: {
                                variantId: master.variantId,
                                productId: master.productId,
                                sku: master.sku,
                                periodKey,
                                snapshotDate: today,
                                closingBalance,
                                lastLedgerEntryId: latestLedgerEntry?._id ?? null,
                                createdBy: 'CRON'
                            }
                        },
                        { upsert: true, new: true }
                    );

                    snapshotCount++;
                } catch (err) {
                    errorCount++;
                    logger.error(`${label} Failed snapshot for variantId=${master.variantId}: ${err.message}`);
                }
            }));
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`${label} Completed. Snapshots: ${snapshotCount}, Errors: ${errorCount}, Duration: ${duration}s`);
    } catch (err) {
        logger.error(`${label} Job failed: ${err.message}`, err);
    }
};

/**
 * Schedule: midnight every night (0 0 * * *)
 * Timezone: system default — set TZ env var for explicit timezone control.
 */
export const scheduleInventorySnapshotJob = () => {
    cron.schedule('0 0 * * *', async () => {
        logger.info('[InventorySnapshot] Cron triggered at midnight.');
        await runInventorySnapshot();
    }, {
        timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata'
    });

    logger.info('[InventorySnapshot] Nightly snapshot cron registered: 0 0 * * *');
};
