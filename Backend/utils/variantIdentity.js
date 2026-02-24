/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIANT IDENTITY  ·  Shared canonical layer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This module is the SINGLE SOURCE OF TRUTH for:
 *
 *   • Canonical identity key format & construction  (SECTION 1)
 *   • Cardinality invariant validation              (SECTION 3)
 *   • System limits & guardrails                   (SECTION 9)
 *   • Lifecycle policy sentinels                   (SECTION 4)
 *
 * ═══ IDENTITY KEY FORMAT ══════════════════════════════════════════════════════
 *
 *   Segment types:
 *     COLOR:<colorId>              — exactly one, or absent
 *     SIZE:<category>:<sizeId>     — one per size category
 *     ATTR:<attributeTypeId>:<valueId>  — one per attribute axis
 *
 *   Ordering rules (ORDER_PRIORITY):
 *     1. COLOR segments first (priority 1)
 *     2. SIZE segments second (priority 2), sorted by category ASC
 *     3. ATTR segments third (priority 3), sorted by attributeTypeId ASC,
 *        then valueId ASC (within same type — should never happen after
 *        cardinality check, but is consistent)
 *
 *   ID normalization:
 *     • All ObjectId strings → trimmed, lowercased 24-char hex
 *     • Null/undefined axes → EXCLUDED (never produce NULL:... segments)
 *     • Size category → trimmed, lowercased
 *
 *   Delimiters:
 *     • Inter-segment: |  (pipe cannot appear in an ObjectId)
 *     • Intra-segment: :  (colon cannot appear in an ObjectId)
 *
 *   Final the canonical string is SHA-256-hashed to yield configHash.
 *   The raw string is never stored — only the hash.
 *
 * ═══ CARDINALITY INVARIANT ═══════════════════════════════════════════════════
 *
 *   A single variant may contain AT MOST ONE value per attribute type.
 *   Enforced by validateCardinality() before any DB write.
 *
 * ═══ LIMITS ═════════════════════════════════════════════════════════════════
 *
 *   MAX_AXES            = 10   (Color + Size + 8 attribute axes max)
 *   MAX_VALUES_PER_AXIS = 50
 *   MAX_COMBINATIONS    = 500
 *   MAX_IDENTITY_BYTES  = 1024 (raw canonical string)
 *
 * @module variantIdentity
 */

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM LIMITS  (SECTION 9)
// ─────────────────────────────────────────────────────────────────────────────

export const LIMITS = Object.freeze({
    MAX_AXES: 7,   // Color + Size + up to 5 attribute dimensions
    MAX_VALUES_PER_AXIS: 50,   // Fallback safety cap per individual axis
    MAX_COLORS: 10, // Enterprise Guard: Prevent crazy colorway counts
    MAX_SIZES: 20, // Enterprise Guard: Prevent sizing explosion
    MAX_COMBINATIONS: 5000,  // Cartesian product hard stop (per batch)
    MAX_IDENTITY_BYTES: 1024, // Raw canonical string byte limit
    MAX_ATTR_DIMENSIONS: 5,    // Enterprise Guard: Dynamic attribute axes only
    IDENTITY_VERSION: 1, // 6.2 Hash Algorithm Version sentinel
});

// ─────────────────────────────────────────────────────────────────────────────
// NAMESPACE ORDERING  (SECTION 1 — explicit priority, not ASCII)
// ─────────────────────────────────────────────────────────────────────────────

const ORDER_PRIORITY = { COLOR: 1, SIZE: 2, ATTR: 3 };

/**
 * Normalize an ObjectId-like value to a lowercase 24-char hex string.
 * Returns null if the value is not resolvable, so callers can exclude it.
 *
 * @param {string|Object|null|undefined} raw
 * @returns {string|null}
 */
export function normalizeId(raw) {
    if (!raw) return null;
    // Mongoose ObjectId / lean _id / populated object
    const str = (typeof raw === 'object' && raw._id)
        ? raw._id.toString()
        : raw.toString();
    const trimmed = str.trim().toLowerCase();
    // Basic guard: ObjectId is 24 hex chars; allow longer for custom IDs
    if (!trimmed || trimmed === '[object object]') return null;
    return trimmed;
}

/**
 * Build a sorted canonical identity segment list from a normalized variant.
 *
 * Accepts a plain object or VariantMaster doc with any combination of:
 *   { colorId, sizes: [{ category, sizeId }], attributeDimensions: [{ attributeId, valueId }] }
 *
 * Each returned segment is a plain string: "COLOR:abc", "SIZE:apparel:def", "ATTR:ghi:jkl"
 *
 * @param {{
 *   colorId?: any,
 *   sizes?: Array<{category: string, sizeId: any}>,
 *   attributeDimensions?: Array<{attributeId: any, valueId: any}>
 * }} variant
 * @returns {string[]} sorted segment strings
 */
export function buildSegments(variant) {
    const segments = [];

    // ── COLOR ─────────────────────────────────────────────────────────────────
    const colorId = normalizeId(variant.colorId);
    if (colorId) {
        segments.push({ priority: ORDER_PRIORITY.COLOR, sub: '', val: '', str: `COLOR:${colorId}` });
    }

    // ── SIZE ──────────────────────────────────────────────────────────────────
    if (Array.isArray(variant.sizes)) {
        for (const s of variant.sizes) {
            const sid = normalizeId(s.sizeId);
            const cat = (s.category ?? '').trim().toLowerCase();
            if (sid && cat) {
                segments.push({ priority: ORDER_PRIORITY.SIZE, sub: cat, val: sid, str: `SIZE:${cat}:${sid}` });
            }
        }
    }

    // ── ATTR ──────────────────────────────────────────────────────────────────
    if (Array.isArray(variant.attributeDimensions)) {
        for (const dim of variant.attributeDimensions) {
            const attrId = normalizeId(dim.attributeId);
            const valueId = normalizeId(dim.valueId);
            if (attrId && valueId) {
                segments.push({ priority: ORDER_PRIORITY.ATTR, sub: attrId, val: valueId, str: `ATTR:${attrId}:${valueId}` });
            }
            // null attributeId is acceptable (orphaned type), use 'unknown' sentinel
            // so the segment is still stable and not silently dropped
            if (!attrId && valueId) {
                segments.push({ priority: ORDER_PRIORITY.ATTR, sub: 'unknown', val: valueId, str: `ATTR:unknown:${valueId}` });
            }
        }
    }

    // ── SORT (ORDER_PRIORITY → sub-key → value) ───────────────────────────────
    segments.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.sub !== b.sub) return a.sub.localeCompare(b.sub);
        return a.val.localeCompare(b.val);
    });

    return segments.map(s => s.str);
}

/**
 * Build the canonical identity string for a variant.
 * This is the RAW pre-hash string — NEVER store this directly.
 *
 * @param {Object} variant — see buildSegments params
 * @returns {string}  e.g. "COLOR:abc123|SIZE:apparel:def456|ATTR:ghi789:jkl012"
 */
export function buildCanonicalString(variant) {
    const segs = buildSegments(variant);
    if (segs.length === 0) throw new Error('[variantIdentity] Cannot build canonical string: no valid dimensions');
    const raw = segs.join('|');
    if (Buffer.byteLength(raw, 'utf8') > LIMITS.MAX_IDENTITY_BYTES) {
        throw new Error(
            `[variantIdentity] Canonical string exceeds ${LIMITS.MAX_IDENTITY_BYTES} byte limit ` +
            `(${Buffer.byteLength(raw, 'utf8')} bytes). Reduce axis count or ID lengths.`
        );
    }
    return raw;
}

/**
 * Build the 64-char SHA-256 configHash from a variant's dimensional data.
 * Includes productGroupId to scope uniqueness within a product group.
 *
 * @param {string|ObjectId} productGroupId
 * @param {Object} variant
 * @returns {string} 64-char lowercase hex
 */
export function buildConfigHashV2(productGroupId, variant) {
    const pgId = normalizeId(productGroupId);
    if (!pgId) throw new Error('[variantIdentity] productGroupId is required for configHash');
    const canonical = buildCanonicalString(variant);
    return crypto.createHash('sha256').update(`${pgId}::${canonical}`).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// CARDINALITY INVARIANT VALIDATOR  (SECTION 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that attributeDimensions contains at most ONE value per attributeId.
 *
 * @param {Array<{attributeId: any, valueId: any}>} attributeDimensions
 * @throws {Object} { statusCode: 400, message }
 */
export function validateCardinality(attributeDimensions) {
    if (!Array.isArray(attributeDimensions) || attributeDimensions.length === 0) return;

    const seen = new Map(); // attributeId → first valueId seen
    for (const dim of attributeDimensions) {
        const attrId = normalizeId(dim.attributeId) ?? 'unknown';
        if (seen.has(attrId)) {
            const err = new Error(
                `[variantIdentity] Cardinality violation: attribute type "${attrId}" appears more than once ` +
                `(values: "${normalizeId(seen.get(attrId))}" and "${normalizeId(dim.valueId)}"). ` +
                `A variant may contain at most ONE value per attribute type.`
            );
            err.statusCode = 400;
            err.code = 'CARDINALITY_VIOLATION';
            throw err;
        }
        seen.set(attrId, dim.valueId);
    }
}

/**
 * Validate system limits on the incoming dimension payload.
 *
 * @param {{ baseDimensions, attributeDimensions }} payload
 * @throws {Object} { statusCode: 400, message }
 */
export function validateLimits(payload) {
    const { baseDimensions = {}, attributeDimensions = [] } = payload;

    const colorCount = (baseDimensions.color ?? []).length;
    const sizeCount = (baseDimensions.size ?? []).length;
    const attrAxes = attributeDimensions.length;
    const totalAxes = (colorCount > 0 ? 1 : 0) + (sizeCount > 0 ? 1 : 0) + attrAxes;

    if (attrAxes > LIMITS.MAX_ATTR_DIMENSIONS) {
        const err = new Error(
            `[variantIdentity] Too many attribute dimensions: ${attrAxes} (max ${LIMITS.MAX_ATTR_DIMENSIONS}).`
        );
        err.statusCode = 400; err.code = 'LIMIT_EXCEEDED';
        throw err;
    }

    if (totalAxes > LIMITS.MAX_AXES) {
        const err = new Error(
            `[variantIdentity] Total axes (${totalAxes}) exceeds MAX_AXES (${LIMITS.MAX_AXES}).`
        );
        err.statusCode = 400; err.code = 'LIMIT_EXCEEDED';
        throw err;
    }

    if (colorCount > LIMITS.MAX_COLORS) {
        const err = new Error(`[variantIdentity] Color axis has ${colorCount} values (max ${LIMITS.MAX_COLORS}).`);
        err.statusCode = 400; err.code = 'LIMIT_EXCEEDED';
        throw err;
    }
    if (sizeCount > LIMITS.MAX_SIZES) {
        const err = new Error(`[variantIdentity] Size axis has ${sizeCount} values (max ${LIMITS.MAX_SIZES}).`);
        err.statusCode = 400; err.code = 'LIMIT_EXCEEDED';
        throw err;
    }

    for (const dim of attributeDimensions) {
        const vc = (dim.values ?? []).length;
        if (vc > LIMITS.MAX_VALUES_PER_AXIS) {
            const err = new Error(
                `[variantIdentity] Attribute "${dim.attributeId}" has ${vc} values (max ${LIMITS.MAX_VALUES_PER_AXIS}).`
            );
            err.statusCode = 400; err.code = 'LIMIT_EXCEEDED';
            throw err;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE POLICY SENTINELS  (SECTION 4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adopted policy: Option C — Soft Delete & Historic Immutability
 *
 * Rules enforced at service layer:
 *   1. AttributeType / AttributeValue cannot be hard-deleted if referenced by any VariantMaster.
 *   2. Soft-deleted attributes remain valid for existing variants (configHash unchanged).
 *   3. New Cartesian generation MUST filter out soft-deleted values before reaching engine.
 *   4. Rename of attributeName: existing variants retain historic snapshot; no retroactive rename.
 *   5. UI renders orphaned (deleted) attribute types/values as [Archived Attribute] badge.
 */
export const LIFECYCLE_POLICY = Object.freeze({
    ALLOW_HARD_DELETE_ATTR_TYPE: false,
    ALLOW_HARD_DELETE_ATTR_VALUE: false,
    ORPHAN_DISPLAY_LABEL: '[Archived Attribute]',
    RENAME_RETROACTIVE: false,  // historic attributeName in attributeDimensions is frozen
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATION POLICY  (SECTION 7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fields that are IMMUTABLE after variant creation.
 * Backend middleware enforces this (also enforced in VariantMaster pre-save hook).
 */
export const IMMUTABLE_FIELDS = Object.freeze([
    'colorId',
    'sizes',
    'attributeValueIds',
    'attributeDimensions',
    'configHash',
    'productGroupId',
]);

/**
 * Fields that ARE mutable (explicitly whitelisted).
 */
export const MUTABLE_FIELDS = Object.freeze([
    'price',
    'compareAtPrice',
    'sku',
    'status',
    'imageGallery',
    'inventory',
]);
