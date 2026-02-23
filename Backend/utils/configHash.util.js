import crypto from 'crypto';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIG HASH UTILITY  ·  v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Generates a deterministic SHA-256 configHash that uniquely identifies a
 * variant combination within a product group.
 *
 * DESIGN INVARIANTS:
 *   1. `productGroupId` is always required — scopes uniqueness.
 *   2. All IDs are sorted before hashing — order of selection never creates duplicates.
 *   3. The hash covers: productGroupId + sorted sizeIds + colorId + sorted attrValueIds.
 *   4. Missing optional dimensions (color, sizes, attrs) produce an empty-string slot
 *      so two different combos can never collide through omission.
 *
 * BREAKING CHANGE FROM v1:
 *   Old signature required `sizeId` and `colorId` (threw if missing).
 *   New signature makes them optional — supports attribute-only, color-only,
 *   and size-only variants without forced coupling.
 *
 * EXPORTS
 *   - generateConfigHash({ productGroupId, sizeId?, sizeIds?, colorId?, attributeValueIds? })
 *   - sortAttributeValueIds(ids)   — stable sort utility, exported for reuse
 */

/**
 * Sort an array of ObjectId strings deterministically.
 * Safe to call with populated objects (extracts ._id) or plain strings.
 *
 * @param {Array<string|{_id: string}|any>} ids
 * @returns {string[]} sorted array of plain id strings
 */
export function sortAttributeValueIds(ids = []) {
    return [...ids]
        .filter(Boolean)
        .map(id => (id && typeof id === 'object' && id._id ? id._id.toString() : id.toString()))
        .sort();
}

/**
 * Generate a deterministic SHA-256 configHash for a variant combination.
 *
 * @param {Object}                          params
 * @param {string|ObjectId}                 params.productGroupId  — REQUIRED
 * @param {string|ObjectId}                 [params.colorId]       — optional single color ref
 * @param {string|ObjectId}                 [params.sizeId]        — optional single size ref (legacy)
 * @param {Array<string|ObjectId>}          [params.sizeIds]       — optional array of size refs (multi-size)
 * @param {Array<{category,sizeId}>}        [params.sizes]         — optional VariantMaster sizes array
 * @param {Array<string|ObjectId>}          [params.attributeValueIds] — optional, order-independent
 * @returns {string} 64-char hex SHA-256 hash
 */
export function generateConfigHash({
    productGroupId,
    colorId,
    sizeId,
    sizeIds,
    sizes,
    attributeValueIds = [],
}) {
    if (!productGroupId) throw new Error('configHash: productGroupId is required');

    // ── 1. Resolve size IDs from any of the three representations ─────────────
    //    Priority: explicit sizeIds[] > sizes[{sizeId}] array > legacy sizeId scalar
    let resolvedSizeIds = [];
    if (Array.isArray(sizeIds) && sizeIds.length > 0) {
        resolvedSizeIds = sizeIds.map(id => id.toString());
    } else if (Array.isArray(sizes) && sizes.length > 0) {
        resolvedSizeIds = sizes
            .map(s => (s.sizeId ? s.sizeId.toString() : null))
            .filter(Boolean);
    } else if (sizeId) {
        resolvedSizeIds = [sizeId.toString()];
    }
    resolvedSizeIds.sort(); // deterministic order

    // ── 2. Sort attribute value IDs ────────────────────────────────────────────
    const sortedAttrs = sortAttributeValueIds(attributeValueIds);

    // ── 3. Build the canonical hash input ─────────────────────────────────────
    //    Empty slots become empty strings so the separator character '|' is always
    //    present, preventing two different combos from producing identical raw inputs.
    const raw = [
        productGroupId.toString(),
        resolvedSizeIds.join(','),        // '' if no sizes
        colorId ? colorId.toString() : '', // '' if no color
        sortedAttrs.join('|'),            // '' if no attributes
    ].join('::');

    return crypto.createHash('sha256').update(raw).digest('hex');
}

// ── BACKWARD-COMPATIBLE DEFAULT EXPORT ────────────────────────────────────────
export default generateConfigHash;
