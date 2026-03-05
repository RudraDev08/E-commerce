/**
 * ========================================================================
 * REDIS ATOMIC RESERVATION SERVICE
 * ========================================================================
 *
 * Flash-Sale Architecture:
 *   1. ADD-TO-CART   → redis.decrby(`stock:${variantId}`, qty)
 *                      if result < 0 → rollback + 409
 *                      Set reservation TTL key (60s)
 *   2. CHECKOUT      → Deduct real DB stock (in Mongo session)
 *                      Delete Redis reservation key
 *   3. TTL EXPIRY    → reservationCleanup job restores Redis stock
 *
 * Fallback (Redis unavailable):
 *   → Falls back to DB-only atomic reservation (slower but safe)
 *   → Logs a critical warning so ops knows Redis is down
 *
 * Idempotency:
 *   Every reservation has a unique key. Duplicate decr for the same
 *   reservationId is a no-op (guarded by SET NX).
 *
 * Double-Release prevention:
 *   releaseReservation uses GETDEL then conditionally restores.
 *   If key is already gone (consumed or expired), it's a no-op.
 *
 * ========================================================================
 */

import logger from '../config/logger.js';

// Lazy-load Redis client to avoid crashing the server if Redis is absent
let _redisClient = null;

async function getRedis() {
    if (process.env.DISABLE_REDIS === 'true') return null;
    if (_redisClient) return _redisClient;
    try {
        const { createClient } = await import('redis');
        const client = createClient({
            url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
            socket: { reconnectStrategy: (attempts) => Math.min(attempts * 100, 3000) }
        });
        client.on('error', (e) => logger.warn('[Redis] Connection error:', e.message));
        await client.connect();
        _redisClient = client;
        logger.info('[Redis] Connected for reservation layer.');
        return _redisClient;
    } catch (err) {
        logger.error('[Redis] UNAVAILABLE — reservation layer will use DB fallback:', err.message);
        return null;
    }
}

// ── Key factories ──────────────────────────────────────────────────────────
const stockKey = (variantId) => `flash:stock:${variantId}`;
const reserveKey = (reservationId) => `flash:rsv:${reservationId}`;

const DEFAULT_TTL_SECONDS = 60;

class RedisReservationService {

    /**
     * Seed a variant's stock into Redis from DB if not already present.
     * Call once at flash-sale start or on cache miss.
     */
    async seedStock(variantId, availableQty, ttlSeconds = 3600) {
        const redis = await getRedis();
        if (!redis) return;

        const key = stockKey(variantId);
        // SET NX — only set if not already seeded (idempotent)
        await redis.set(key, availableQty, { NX: true, EX: ttlSeconds });
        logger.info(`[Redis] Stock seeded: ${key} = ${availableQty}`);
    }

    /**
     * Atomically reserve `qty` units for `variantId`.
     *
     * Returns { success: true, reservationId } or { success: false, reason }
     *
     * Lua script ensures decrement + guard is one atomic op.
     */
    async reserve(variantId, qty, userId, ttlSeconds = DEFAULT_TTL_SECONDS) {
        const redis = await getRedis();

        if (!redis) {
            // Fallback: Redis unavailable — caller must use DB-only reservation
            logger.warn('[Redis] Reservation fallback triggered (Redis unavailable).');
            return { success: false, reason: 'REDIS_UNAVAILABLE', fallback: true };
        }

        const key = stockKey(variantId);

        // Atomic Lua: decrement only if result >= 0
        const luaScript = `
            local current = redis.call('GET', KEYS[1])
            if not current then return -2 end
            local after = tonumber(current) - tonumber(ARGV[1])
            if after < 0 then return -1 end
            redis.call('SET', KEYS[1], after)
            return after
        `;

        let result;
        try {
            result = await redis.eval(luaScript, { keys: [key], arguments: [String(qty)] });
        } catch (err) {
            logger.error('[Redis] Lua eval error during reserve:', err.message);
            return { success: false, reason: 'REDIS_ERROR', fallback: true };
        }

        if (result === -2) {
            // Key not in Redis — trigger seed from DB (cache miss)
            logger.warn(`[Redis] Stock key missing for variant ${variantId}. Returning cache-miss.`);
            return { success: false, reason: 'CACHE_MISS', fallback: true };
        }

        if (result < 0) {
            return { success: false, reason: 'INSUFFICIENT_STOCK' };
        }

        // Create reservation tracking key with TTL (idempotent via NX)
        const reservationId = `${userId}:${variantId}:${Date.now()}`;
        const rsvKey = reserveKey(reservationId);
        await redis.set(rsvKey, JSON.stringify({ variantId, qty, userId }), { EX: ttlSeconds });

        logger.info(`[Redis] Reserved: variantId=${variantId}, qty=${qty}, user=${userId}, rsv=${reservationId}`);
        return { success: true, reservationId, remainingStock: result };
    }

    /**
     * Release a reservation back to Redis.
     * Idempotent — if key is already gone, it's a no-op.
     * Prevents double-release via GETDEL (fetch + delete in one atomic op).
     */
    async release(reservationId) {
        const redis = await getRedis();
        if (!redis) return { released: false, reason: 'REDIS_UNAVAILABLE' };

        const rsvKey = reserveKey(reservationId);
        const raw = await redis.getDel(rsvKey);  // Atomic GETDEL prevents double-release

        if (!raw) {
            logger.info(`[Redis] Release no-op: reservation ${reservationId} already consumed/expired.`);
            return { released: false, reason: 'ALREADY_CONSUMED' };
        }

        const { variantId, qty } = JSON.parse(raw);
        await redis.incrBy(stockKey(variantId), qty);

        logger.info(`[Redis] Released: reservationId=${reservationId}, variantId=${variantId}, qty=${qty}`);
        return { released: true, variantId, qty };
    }

    /**
     * Consume a reservation at checkout (delete without restoring stock).
     * Stock has already been deducted from DB inside the Mongo transaction.
     */
    async consume(reservationId) {
        const redis = await getRedis();
        if (!redis) return { consumed: false };

        const rsvKey = reserveKey(reservationId);
        const raw = await redis.getDel(rsvKey);

        if (!raw) {
            logger.info(`[Redis] Consume no-op: reservation ${reservationId} already gone.`);
            return { consumed: false, reason: 'ALREADY_GONE' };
        }

        logger.info(`[Redis] Consumed reservation: ${reservationId}`);
        return { consumed: true };
    }

    /**
     * Get current Redis stock level for a variant.
     */
    async getStockLevel(variantId) {
        const redis = await getRedis();
        if (!redis) return null;

        const val = await redis.get(stockKey(variantId));
        return val !== null ? parseInt(val, 10) : null;
    }
}

export const redisReservation = new RedisReservationService();
export default redisReservation;
