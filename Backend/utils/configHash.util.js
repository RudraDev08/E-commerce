import crypto from 'crypto';

/**
 * Generate a deterministic SHA-256 configHash for a variant combination.
 * Uniqueness is guaranteed by: productGroupId + sizeId + colorId + sorted attributeValueIds.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.productGroupId
 * @param {string|ObjectId} params.sizeId
 * @param {string|ObjectId} params.colorId
 * @param {Array<string|ObjectId>} params.attributeValueIds  - order does NOT matter; sorted internally
 * @returns {string} 64-char hex SHA-256 hash
 */
export function generateConfigHash({ productGroupId, sizeId, colorId, attributeValueIds = [] }) {
    if (!productGroupId) throw new Error('configHash: productGroupId is required');
    if (!sizeId) throw new Error('configHash: sizeId is required');
    if (!colorId) throw new Error('configHash: colorId is required');

    // Sort attribute value IDs so order of selection never creates a duplicate
    const sortedAttrs = [...attributeValueIds]
        .map(id => id.toString())
        .sort()
        .join('|');

    const raw = [
        productGroupId.toString(),
        sizeId.toString(),
        colorId.toString(),
        sortedAttrs,
    ].join(':');

    return crypto.createHash('sha256').update(raw).digest('hex');
}
