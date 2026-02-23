import cron from 'node-cron';
import mongoose from 'mongoose';
import InventoryReservation from '../models/InventoryReservation.model.js';
import VariantInventory from '../models/VariantInventory.js';
import InventoryLedger from '../models/inventory/InventoryLedger.model.js';
import logger from '../config/logger.js';

/**
 * PRODUCTION RESERVATION TTL WORKER
 * Cleans up abandoned carts/reservations to free up logically locked inventory.
 * Safely guards against overlapping executions and malformed records.
 */

let isWorkerRunning = false;
let isCronRegistered = false;

export const cleanupExpiredReservations = async () => {
    // 1. Singleton Guard - Prevent overlapping executions
    if (isWorkerRunning) {
        logger.warn('Reservation cleanup already in progress, skipping overlapping run.');
        return;
    }
    isWorkerRunning = true;

    try {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

        // 2. Find reservations older than 30 mins that are still active
        const expiredReservations = await InventoryReservation.find({
            status: 'active',
            createdAt: { $lt: thirtyMinsAgo }
        }).lean();

        if (!expiredReservations.length) return;

        logger.info(`Found ${expiredReservations.length} expired reservations for cleanup.`);

        for (const reservation of expiredReservations) {
            const session = await mongoose.startSession();
            try {
                session.startTransaction();

                // 3. Mark reservation as expired atomically
                // Strict guard: ensures we only touch 'active' reservations (Idempotent)
                const updatedRes = await InventoryReservation.findOneAndUpdate(
                    { _id: reservation._id, status: 'active' },
                    { $set: { status: 'expired' } },
                    { session, new: true }
                );

                if (!updatedRes) {
                    await session.abortTransaction();
                    session.endSession();
                    continue; // Already processed by another worker
                }

                // Defensive Check: Missing or malformed items array
                if (!Array.isArray(reservation.items) || reservation.items.length === 0) {
                    await session.commitTransaction();
                    session.endSession();
                    continue;
                }

                // 4. For each item, release the reserved quantity safely
                for (const item of reservation.items) {
                    const variantId = item.variantId;
                    const qty = item.qty;

                    if (!variantId || !qty || qty <= 0) continue; // Skip corrupted sub-documents safely

                    // Atomic release: Enforce reservedQuantity is strictly >= qty being released
                    const updatedInventory = await VariantInventory.findOneAndUpdate(
                        {
                            variant: variantId,
                            reservedQuantity: { $gte: qty } // Cannot drop below zero
                        },
                        {
                            $inc: { reservedQuantity: -qty }
                        },
                        { session, new: true }
                    );

                    if (updatedInventory) {
                        // 4. Log the release in InventoryLedger
                        await InventoryLedger.create([{
                            variantId,
                            warehouseId: updatedInventory.warehouse,
                            transactionType: 'RESERVATION_EXPIRED',
                            quantity: qty,
                            referenceId: reservation._id.toString(),
                            referenceModel: 'InventoryReservation',
                            notes: `System auto-release of ${qty} reserved units (Reservation expired)`,
                            timestamp: new Date()
                        }], { session });
                    } else {
                        logger.warn(`Failed to release ${qty} reserved stock for variant ${variantId} on reservation ${reservation._id}`);
                    }
                }

                await session.commitTransaction();
            } catch (err) {
                logger.error(`Error processing reservation ${reservation._id} cleanup: ${err.message}`);
                await session.abortTransaction();
            } finally {
                session.endSession();
            }
        }
    } catch (error) {
        logger.error(`Reservation cleanup worker failed: ${error.message}`);
    } finally {
        isWorkerRunning = false; // Release lock always
    }
};

// Start cron job (Run every 5 minutes)
export const startReservationWorker = () => {
    // Process-level Duplicate Registration Guard
    if (isCronRegistered) {
        logger.warn('Reservation TTL Worker already registered in this process.');
        return;
    }

    logger.info('Starting Inventory Reservation TTL Worker (Registered)...');

    // Suggestion for multi-Node setup: use a DB-level lock (e.g. redis-lock or mongoose-lock)
    // to strictly enforce only 1 job runs globally across a horizontal cluster.

    cron.schedule('*/5 * * * *', cleanupExpiredReservations);
    isCronRegistered = true;
};
