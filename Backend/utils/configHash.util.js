import crypto from 'crypto';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIG HASH UTILITY  ·  v3.0
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * V3 BREAKING CHANGE FROM v2:
 *   Old: hashed raw MongoDB ObjectIds (breaks on DB migrations).
 *   New: hashes attributeValue.internalKey strings (e.g. VAL_RED, VAL_256GB).
 *        internalKey is immutable by schema and survives migrations / exports.
 *        Falls back to slug → _id only if internalKey is absent (legacy compat).
 *
 * DESIGN INVARIANTS (v3):
 *   1. productGroupId always required — scopes uniqueness to a product group.
 *   2. All attribute keys are sorted — insertion order never creates duplicates.
 *   3. colorId/sizes still accepted for backward compat, resolved via internalKey.
 *   4. Missing optional dimensions produce no slot — empty payload = empty variant.
 *
 * EXPORTS:
 *   buildVariantIdentity({ productGroupId, colorId?, sizes?, attributeValueIds? })
 *   sortAttributeValueIds(ids)  — order-stable sort utility, exported for reuse
 *   resolveStableKey(raw)       — resolves internalKey > slug > id for any ref
 */

/**
 * Resolve a stable, migration-safe key from any AttributeValue-like object or string.
 * Priority: internalKey > slug > _id > raw string.
 *
 * @param {string|Object|null|undefined} raw
 * @returns {string|null}
 */
export function resolveStableKey(raw) {
    if (!raw) return null;
    if (typeof raw === 'object') {
        if (raw.internalKey) return String(raw.internalKey).trim().toUpperCase();
        if (raw.slug) return String(raw.slug).trim().toLowerCase();
        if (raw._id) return raw._id.toString();
        if (raw.id) return String(raw.id).trim();
    }
    const str = String(raw).trim();
    if (!str || str === '[object Object]') return null;
    return str;
}

/**
 * Sort an array of AttributeValue references deterministically.
 * Uses resolveStableKey so sort is on internalKey, not insertion order.
 *
 * @param {Array<string|Object>} ids
 * @returns {string[]} sorted stable key strings
 */
export function sortAttributeValueIds(ids = []) {
    return [...ids]
        .filter(Boolean)
        .map(id => resolveStableKey(id))
        .filter(Boolean)
        .sort();
}

/**
 * Build a deterministic SHA-256 configHash for a variant combination.
 *
 * @param {Object}                     params
 * @param {string|ObjectId}            params.productGroupId    — REQUIRED
 * @param {string|Object}              [params.colorId]         — optional; uses internalKey if populated
 * @param {Array<{category,sizeId}>}   [params.sizes]           — optional legacy array
 * @param {Array<string|Object>}       [params.attributeValueIds] — optional; uses internalKey if populated
 * @returns {string} 64-char hex SHA-256 hash
 */
export function buildVariantIdentity({
    productGroupId,
    colorId,
    sizes,
    attributeValueIds
}) {
    const identityParts = [];

    // 1️⃣ Product Group (scoped uniqueness — raw id, this never changes)
    if (!productGroupId) {
        throw new Error('productGroupId required for identity hash');
    }
    identityParts.push(`pg:${productGroupId.toString()}`);

    // 2️⃣ Color — resolve to internalKey when populated
    if (colorId) {
        const colorKey = resolveStableKey(colorId);
        if (colorKey) identityParts.push(`color:${colorKey}`);
    }

    // 3️⃣ Sizes (backward-compat legacy field) — resolved to internalKey/slug when populated
    if (Array.isArray(sizes) && sizes.length > 0) {
        const normalizedSizes = sizes
            .map(s => resolveStableKey(s.sizeId))
            .filter(Boolean)
            .sort();
        for (const sKey of normalizedSizes) {
            identityParts.push(`size:${sKey}`);
        }
    }

    // 4️⃣ Attribute Values — CRITICAL: use internalKey for migration-safe hashing
    if (Array.isArray(attributeValueIds) && attributeValueIds.length > 0) {
        const sortedKeys = sortAttributeValueIds(attributeValueIds);
        for (const key of sortedKeys) {
            identityParts.push(`attr:${key}`);
        }
    }

    // 5️⃣ Final deterministic canonical string
    const identityString = identityParts.join('|');

    // 6️⃣ SHA-256 hash
    return crypto
        .createHash('sha256')
        .update(identityString)
        .digest('hex');
}

// ── BACKWARD-COMPATIBLE ALIAS ──────────────────────────────
export const generateConfigHash = buildVariantIdentity;
export default buildVariantIdentity;
