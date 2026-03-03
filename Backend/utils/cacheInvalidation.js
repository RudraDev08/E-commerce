/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 8 — SCOPED CACHE INVALIDATION UTILITY
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * NEVER use redis-cli FLUSHDB.
 * Only invalidate keys scoped to the affected product group or variant.
 *
 * Key namespaces managed here:
 *   variantMatrix:{productGroupId}  — PDP variant configurator payload
 *   productGroup:{productGroupId}   — Product group + attribute type list
 *
 * IDENTITY_VERSION bump forces frontend clients to detect configHash engine
 * changes and reset their selectedAttributes state automatically.
 *
 * Usage:
 *   import { invalidateVariantCache } from '../utils/cacheInvalidation.js';
 *   await invalidateVariantCache(productGroupId);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { LIMITS } from './variantIdentity.js';

// ── Key builders ──────────────────────────────────────────────────────────────

/**
 * All cache key builders in ONE place.
 * If you change a key format, change it here only.
 */
export const CacheKeys = {
    variantMatrix: (productGroupId) => `variantMatrix:${productGroupId}`,
    productGroup: (productGroupId) => `productGroup:${productGroupId}`,
    identityVersion: () => `system:identityVersion`,
};

/**
 * Invalidate all cache keys for a specific product group.
 * Scoped — never flushes unrelated data.
 *
 * @param {string}                  productGroupId
 * @param {import('ioredis').Redis}  [redisClient]    — optional; no-op if absent
 */
export async function invalidateVariantCache(productGroupId, redisClient) {
    if (!productGroupId) return;

    const keysToDelete = [
        CacheKeys.variantMatrix(productGroupId),
        CacheKeys.productGroup(productGroupId),
    ];

    if (!redisClient) {
        console.warn('[CacheInvalidation] No Redis client provided. In-process cache only.');
        return;
    }

    try {
        // Use pipeline for atomic multi-delete (no FLUSHDB)
        const pipe = redisClient.pipeline();
        keysToDelete.forEach(key => pipe.del(key));
        await pipe.exec();

        console.log(`[CacheInvalidation] Invalidated ${keysToDelete.length} keys for productGroup=${productGroupId}`);
    } catch (err) {
        console.error(`[CacheInvalidation] Redis error:`, err.message);
        // Non-fatal — stale cache is acceptable, not a crash-worthy event
    }
}

/**
 * Broadcast the current IDENTITY_VERSION to Redis.
 * Frontend clients compare this value on load;
 * a mismatch triggers an auto-refetch and selectedAttributes reset.
 *
 * @param {import('ioredis').Redis} [redisClient]
 */
export async function broadcastIdentityVersion(redisClient) {
    const version = LIMITS.IDENTITY_VERSION;
    if (!redisClient) return;

    try {
        // Set with 30-day TTL — clients refetch the version on cold start
        await redisClient.set(
            CacheKeys.identityVersion(),
            String(version),
            'EX', 60 * 60 * 24 * 30
        );
        console.log(`[CacheInvalidation] IDENTITY_VERSION=${version} broadcast to Redis.`);
    } catch (err) {
        console.error(`[CacheInvalidation] Could not broadcast IDENTITY_VERSION:`, err.message);
    }
}

/**
 * Full post-migration cache flush:
 * Run after Phase 1 (attribute role migration) + Phase 3 (inventory repair).
 *
 * Scans for variantMatrix:* and productGroup:* patterns using SCAN
 * (never FLUSHDB / KEYS which blocks Redis).
 *
 * @param {import('ioredis').Redis} redisClient
 */
export async function postMigrationCacheFlush(redisClient) {
    if (!redisClient) {
        console.warn('[CacheInvalidation] No Redis client — skipping post-migration flush.');
        return;
    }

    const patterns = ['variantMatrix:*', 'productGroup:*'];
    let totalDeleted = 0;

    for (const pattern of patterns) {
        let cursor = '0';
        do {
            // SCAN is non-blocking, safe for production
            const [nextCursor, keys] = await redisClient.scan(
                cursor, 'MATCH', pattern, 'COUNT', 100
            );
            cursor = nextCursor;

            if (keys.length > 0) {
                await redisClient.del(...keys);
                totalDeleted += keys.length;
            }
        } while (cursor !== '0');
    }

    console.log(`[CacheInvalidation] Post-migration flush complete. Deleted ${totalDeleted} scoped keys.`);
    await broadcastIdentityVersion(redisClient);
}
