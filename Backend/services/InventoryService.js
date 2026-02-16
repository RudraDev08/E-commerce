// ============================================================================
// InventoryService - Production-Hardened (No $expr, Shard-Safe)
// ============================================================================
// CRITICAL FIXES:
// 1. Replaced $expr with computed availableStock field (indexable)
// 2. Added reservation abuse protection (max 5 per user)
// 3. Force primary reads for inventory operations
// 4. Duplicate reservation prevention
// ============================================================================

import mongoose from 'mongoose';
import Redis from 'ioredis';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import InventoryReservation from '../models/InventoryReservation.model.js';
import logger from '../config/logger.js';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const RESERVATION_RATE_LIMIT_KEY = 'reservation_rate_limit';
const MAX_RESERVATIONS_PER_USER = 5;
const RATE_LIMIT_WINDOW = 60; // seconds

class InventoryService {

    /**
     * Create Atomic Reservation (Flash-Sale Safe, Abuse-Protected)
     * @param {ObjectId} userId - Customer ID
     * @param {Array} items - [{ variantId, qty }]
     * @param {Number} expiryMinutes - TTL in minutes
     * @returns {Promise<InventoryReservation>}
     */
    static async createReservation(userId, items, expiryMinutes = 15) {
        // 1. Rate Limiting Check (Redis-based)
        const rateLimitKey = `${RESERVATION_RATE_LIMIT_KEY}:${userId}`;
        const requestCount = await redis.incr(rateLimitKey);

        if (requestCount === 1) {
            await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
        }

        if (requestCount > 10) {
            throw new Error('RATE_LIMIT_EXCEEDED: Too many reservation attempts');
        }

        // 2. Check Active Reservation Count (Abuse Protection)
        const activeCount = await InventoryReservation.countDocuments({
            userId,
            status: 'active',
            expiresAt: { $gt: new Date() }
        });

        if (activeCount >= MAX_RESERVATIONS_PER_USER) {
            throw new Error(`MAX_RESERVATIONS_EXCEEDED: User has ${activeCount} active reservations`);
        }

        // 3. Check for Duplicate Reservations
        const variantIds = items.map(i => i.variantId);
        const existingReservation = await InventoryReservation.findOne({
            userId,
            'items.variantId': { $in: variantIds },
            status: 'active',
            expiresAt: { $gt: new Date() }
        });

        if (existingReservation) {
            throw new Error('DUPLICATE_RESERVATION: Variant already reserved by this user');
        }

        // 4. Start Transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const reservationItems = [];

            for (const item of items) {
                const { variantId, qty } = item;

                if (qty <= 0) {
                    throw new Error(`INVALID_QUANTITY: ${qty} for variant ${variantId}`);
                }

                // CRITICAL FIX: Use availableStock field (indexable, shard-safe)
                const result = await InventoryMaster.findOneAndUpdate(
                    {
                        variantId,
                        isDeleted: false,
                        availableStock: { $gte: qty }  // ✅ CAN USE INDEX
                    },
                    {
                        $inc: {
                            reservedStock: qty,
                            availableStock: -qty  // Keep in sync
                        }
                    },
                    {
                        new: true,
                        session,
                        readPreference: 'primary'  // ✅ FORCE PRIMARY READ
                    }
                );

                if (!result) {
                    throw new Error(`INSUFFICIENT_STOCK: Variant ${variantId} (requested: ${qty})`);
                }

                reservationItems.push({ variantId, qty });

                logger.debug('Stock Reserved', {
                    variantId,
                    qty,
                    totalStock: result.totalStock,
                    reservedStock: result.reservedStock,
                    availableStock: result.availableStock
                });
            }

            // Create reservation record
            const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
            const reservation = await InventoryReservation.create([{
                userId,
                items: reservationItems,
                expiresAt,
                status: 'active'
            }], { session });

            await session.commitTransaction();

            logger.info('Reservation Created', {
                reservationId: reservation[0]._id,
                userId,
                itemCount: reservationItems.length,
                expiresAt
            });

            return reservation[0];

        } catch (error) {
            await session.abortTransaction();

            logger.error('Reservation Failed', {
                userId,
                items,
                error: error.message
            });

            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Convert Reservation to Purchase
     */
    static async convertReservationToPurchase(reservationId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const reservation = await InventoryReservation.findById(reservationId)
                .session(session)
                .setOptions({ readPreference: 'primary' });

            if (!reservation) {
                throw new Error(`RESERVATION_NOT_FOUND: ${reservationId}`);
            }

            if (reservation.status !== 'active') {
                throw new Error(`RESERVATION_INVALID: Status is ${reservation.status}`);
            }

            if (reservation.expiresAt < new Date()) {
                throw new Error('RESERVATION_EXPIRED');
            }

            // Decrement totalStock, reservedStock, and availableStock atomically
            for (const item of reservation.items) {
                const result = await InventoryMaster.findOneAndUpdate(
                    {
                        variantId: item.variantId,
                        totalStock: { $gte: item.qty },
                        reservedStock: { $gte: item.qty }
                    },
                    {
                        $inc: {
                            totalStock: -item.qty,
                            reservedStock: -item.qty
                            // availableStock stays same (already decremented during reservation)
                        }
                    },
                    {
                        new: true,
                        session,
                        readPreference: 'primary'
                    }
                );

                if (!result) {
                    throw new Error(`PURCHASE_FAILED: Variant ${item.variantId}`);
                }

                logger.debug('Purchase Completed', {
                    variantId: item.variantId,
                    qty: item.qty,
                    remainingStock: result.totalStock,
                    availableStock: result.availableStock
                });
            }

            reservation.status = 'converted';
            await reservation.save({ session });

            await session.commitTransaction();

            logger.info('Reservation Converted to Purchase', {
                reservationId,
                userId: reservation.userId
            });

            return reservation;

        } catch (error) {
            await session.abortTransaction();

            logger.error('Purchase Conversion Failed', {
                reservationId,
                error: error.message
            });

            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Release Expired Reservations (Background Job)
     */
    static async releaseExpiredReservations() {
        try {
            const expired = await InventoryReservation.find({
                status: 'active',
                expiresAt: { $lt: new Date() }
            }).limit(1000);

            if (expired.length === 0) {
                return { released: 0 };
            }

            let releasedCount = 0;

            for (const reservation of expired) {
                const session = await mongoose.startSession();
                session.startTransaction();

                try {
                    // Release reserved stock
                    for (const item of reservation.items) {
                        await InventoryMaster.findOneAndUpdate(
                            { variantId: item.variantId },
                            {
                                $inc: {
                                    reservedStock: -item.qty,
                                    availableStock: item.qty  // Restore availability
                                }
                            },
                            {
                                session,
                                readPreference: 'primary'
                            }
                        );
                    }

                    reservation.status = 'expired';
                    await reservation.save({ session });

                    await session.commitTransaction();
                    releasedCount++;

                } catch (err) {
                    await session.abortTransaction();
                    logger.error('Failed to Release Reservation', {
                        reservationId: reservation._id,
                        error: err.message
                    });
                } finally {
                    session.endSession();
                }
            }

            logger.info('Expired Reservations Released', { count: releasedCount });

            return { released: releasedCount };

        } catch (error) {
            logger.error('Release Expired Reservations Failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Cancel Reservation
     */
    static async cancelReservation(reservationId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const reservation = await InventoryReservation.findById(reservationId)
                .session(session)
                .setOptions({ readPreference: 'primary' });

            if (!reservation || reservation.status !== 'active') {
                throw new Error('RESERVATION_NOT_ACTIVE');
            }

            // Release reserved stock
            for (const item of reservation.items) {
                await InventoryMaster.findOneAndUpdate(
                    { variantId: item.variantId },
                    {
                        $inc: {
                            reservedStock: -item.qty,
                            availableStock: item.qty
                        }
                    },
                    {
                        session,
                        readPreference: 'primary'
                    }
                );
            }

            reservation.status = 'cancelled';
            await reservation.save({ session });

            await session.commitTransaction();

            logger.info('Reservation Cancelled', { reservationId });

        } catch (error) {
            await session.abortTransaction();
            logger.error('Reservation Cancellation Failed', {
                reservationId,
                error: error.message
            });
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get Available Stock
     */
    static async getAvailableStock(variantId) {
        const inv = await InventoryMaster.findOne({
            variantId,
            isDeleted: false
        })
            .select('availableStock')
            .setOptions({ readPreference: 'primary' })
            .lean();

        return inv?.availableStock || 0;
    }

    /**
     * Atomic Stock Increment (Restocking)
     */
    static async incrementStock(variantId, qty) {
        if (qty <= 0) {
            throw new Error('INVALID_QUANTITY');
        }

        const result = await InventoryMaster.findOneAndUpdate(
            { variantId, isDeleted: false },
            {
                $inc: {
                    totalStock: qty,
                    availableStock: qty  // Increase available as well
                }
            },
            {
                new: true,
                readPreference: 'primary'
            }
        );

        if (!result) {
            throw new Error(`INVENTORY_NOT_FOUND: ${variantId}`);
        }

        logger.info('Stock Incremented', {
            variantId,
            qty,
            newTotal: result.totalStock,
            newAvailable: result.availableStock
        });

        return result;
    }

    /**
     * Direct Purchase (No Reservation)
     */
    static async directPurchase(variantId, qty) {
        if (qty <= 0) {
            throw new Error('INVALID_QUANTITY');
        }

        const result = await InventoryMaster.findOneAndUpdate(
            {
                variantId,
                availableStock: { $gte: qty },  // Use availableStock
                isDeleted: false
            },
            {
                $inc: {
                    totalStock: -qty,
                    availableStock: -qty
                }
            },
            {
                new: true,
                readPreference: 'primary'
            }
        );

        if (!result) {
            throw new Error(`INSUFFICIENT_STOCK: ${variantId}`);
        }

        logger.info('Direct Purchase', {
            variantId,
            qty,
            remainingStock: result.totalStock,
            availableStock: result.availableStock
        });

        return result;
    }
}

export default InventoryService;
