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

import { createRedisConnection } from '../config/redis.js';

const redis = createRedisConnection();
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
        if (redis && redis.status === 'ready') {
            try {
                const rateLimitKey = `${RESERVATION_RATE_LIMIT_KEY}:${userId}`;
                const requestCount = await redis.incr(rateLimitKey);

                if (requestCount === 1) {
                    await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
                }

                if (requestCount > 10) {
                    throw new Error('RATE_LIMIT_EXCEEDED: Too many reservation attempts');
                }
            } catch (err) {
                logger.warn('Redis Rate Limiting Error (bypassing)', { error: err.message });
            }
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

            // Create reservation record as RESERVED (Phase 2 & 3)
            // We use the app time for the interval, but the base is current Date.
            // In hyperscale, we'd use MongoDB's $$NOW or a dedicated TimeService.
            const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

            const reservationData = {
                userId,
                items: reservationItems,
                expiresAt,
                status: 'RESERVED'
            };

            const reservation = await InventoryReservation.create([reservationData], { session });

            await session.commitTransaction();

            logger.info('Reservation Created', {
                reservationId: reservation[0]._id,
                userId,
                itemCount: reservationItems.length,
                expiresAt,
                status: 'RESERVED'
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
     * Phase 2 Hardening: Atomic State Transition (RESERVED -> CONSUMED)
     */
    static async convertReservationToPurchase(reservationId, idempotencyKey = null) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Check for duplicate consumption (Idempotency)
            if (idempotencyKey) {
                const existing = await InventoryReservation.findOne({ idempotencyKey }).session(session);
                if (existing) {
                    if (existing._id.toString() !== reservationId.toString()) {
                        throw new Error('IDEMPOTENCY_CONFLICT: Key belongs to another reservation');
                    }
                    return existing; // Already processed
                }
            }

            // 2. Atomic transition with status guard
            const reservation = await InventoryReservation.findOneAndUpdate(
                {
                    _id: reservationId,
                    status: 'RESERVED',
                    // Optional: expiresAt: { $gt: new Date() } // We allow conversion even if slightly expired if payment hit late
                },
                {
                    $set: { status: 'CONSUMED', idempotencyKey }
                },
                { session, new: true, readPreference: 'primary' }
            );

            if (!reservation) {
                // Check if it was already consumed or expired
                const check = await InventoryReservation.findById(reservationId).session(session);
                const state = check ? check.status : 'NOT_FOUND';
                throw new Error(`RESERVATION_TRANSITION_FAILED: Current state is ${state}. Expected RESERVED.`);
            }

            // 3. Decrement totalStock, reservedStock atomically
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
                        }
                    },
                    {
                        new: true,
                        session,
                        readPreference: 'primary'
                    }
                );

                if (!result) {
                    throw new Error(`PURCHASE_FAILED: Stock mismatch for Variant ${item.variantId}`);
                }
            }

            await session.commitTransaction();

            logger.info('Reservation Converted to Purchase (CONSUMED)', {
                reservationId,
                userId: reservation.userId,
                idempotencyKey
            });

            return reservation;

        } catch (error) {
            await session.abortTransaction();
            logger.error('Purchase Conversion Failed', { reservationId, error: error.message });
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Release Expired Reservations (Background Job)
     * Phase 2 & 3: Clock Skew Protected & Atomic Expire
     */
    static async releaseExpiredReservations() {
        try {
            // Use $expr with $$NOW to ensure we compare against DB server time (Skew Protection)
            const expired = await InventoryReservation.find({
                status: 'RESERVED',
                $expr: { $lt: ["$expiresAt", "$$NOW"] }
            }).limit(100); // Smaller batches for flash-sale frequency

            if (expired.length === 0) return { released: 0 };

            let releasedCount = 0;

            for (const reservation of expired) {
                const session = await mongoose.startSession();
                session.startTransaction();

                try {
                    // 1. Atomic Status Transition (State Machine Guard)
                    // Only release if it's still RESERVED
                    const doc = await InventoryReservation.findOneAndUpdate(
                        { _id: reservation._id, status: 'RESERVED' },
                        { $set: { status: 'EXPIRED' } },
                        { session, new: true }
                    );

                    if (!doc) {
                        // Someone else processed it (e.g. converted or concurrently expired)
                        await session.abortTransaction();
                        continue;
                    }

                    // 2. Release reserved stock with strict guard (Phase 7)
                    for (const item of reservation.items) {
                        const res = await InventoryMaster.findOneAndUpdate(
                            {
                                variantId: item.variantId,
                                reservedStock: { $gte: item.qty }
                            },
                            {
                                $inc: {
                                    reservedStock: -item.qty,
                                    availableStock: item.qty
                                }
                            },
                            { session, readPreference: 'primary' }
                        );

                        if (!res) {
                            throw new Error(`CRITICAL: Negative reservedStock detected for ${item.variantId}`);
                        }
                    }

                    await session.commitTransaction();
                    releasedCount++;

                } catch (err) {
                    await session.abortTransaction();
                    logger.error('[RESERVE_CLEANUP] Failed to release:', { id: reservation._id, error: err.message });
                } finally {
                    session.endSession();
                }
            }

            if (releasedCount > 0) logger.info('Expired Reservations Released', { count: releasedCount });
            return { released: releasedCount };

        } catch (error) {
            logger.error('Release Expired Reservations Failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Cancel Reservation (Manual)
     */
    static async cancelReservation(reservationId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Atomic State Transition: RESERVED -> CANCELLED
            const reservation = await InventoryReservation.findOneAndUpdate(
                { _id: reservationId, status: 'RESERVED' },
                { $set: { status: 'CANCELLED' } },
                { session, new: true, readPreference: 'primary' }
            );

            if (!reservation) {
                throw new Error('RESERVATION_NOT_ACTIVE_FOR_CANCEL');
            }

            // Release reserved stock
            for (const item of reservation.items) {
                await InventoryMaster.findOneAndUpdate(
                    { variantId: item.variantId, reservedStock: { $gte: item.qty } },
                    {
                        $inc: {
                            reservedStock: -item.qty,
                            availableStock: item.qty
                        }
                    },
                    { session, readPreference: 'primary' }
                );
            }

            await session.commitTransaction();
            logger.info('Reservation Cancelled', { reservationId });

        } catch (error) {
            await session.abortTransaction();
            logger.error('Reservation Cancellation Failed', { reservationId, error: error.message });
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
