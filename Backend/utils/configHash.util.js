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
export function buildVariantIdentity({
    productGroupId,
    colorId,
    sizes,
    attributeValueIds
}) {

    const identityParts = [];

    // 1️⃣ Product Group (Scoped uniqueness)
    if (!productGroupId) {
        throw new Error("productGroupId required for identity hash");
    }

    identityParts.push(`pg:${productGroupId.toString()}`);

    // 2️⃣ Color
    if (colorId) {
        identityParts.push(`color:${colorId.toString()}`);
    }

    // 3️⃣ Sizes (handle array safely)
    if (Array.isArray(sizes) && sizes.length > 0) {
        const normalizedSizes = sizes
            .map(s => s.sizeId.toString())
            .sort();

        for (const sizeId of normalizedSizes) {
            identityParts.push(`size:${sizeId}`);
        }
    }

    // 4️⃣ Attributes (sorted for determinism)
    if (Array.isArray(attributeValueIds) && attributeValueIds.length > 0) {
        const sortedAttrs = attributeValueIds
            .map(id => id.toString())
            .sort();

        for (const attrId of sortedAttrs) {
            identityParts.push(`attr:${attrId}`);
        }
    }

    // 5️⃣ Final deterministic string
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
