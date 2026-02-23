/**
 * AttributeService
 * ─────────────────────────────────────────────────────────────────────────────
 * Business logic for the attribute tree endpoint.
 *
 * Design decisions:
 *  • Single aggregation pipeline (JOIN-based) — zero N+1 queries.
 *  • All filtering (soft-delete, status) happens inside MongoDB, not in JS.
 *  • Redis cache layer is provided as a ready-to-wire stub; swap the
 *    `cacheGet` / `cacheSet` helpers for your real ioredis client.
 *  • The response shape is DTObject-mapped in `_toAttributeDTO` so the
 *    controller never knows about internal field names.
 *
 * Performance characteristics (large catalogue):
 *  • Pipeline uses $lookup with pipeline-filtered foreign docs → avoids
 *    fetching deleted / inactive values.
 *  • Compound indexes on both CategoryAttribute and AttributeValue ensure
 *    index-only scans for the most common query pattern.
 *
 * @module AttributeService
 */

import mongoose from 'mongoose';
import CategoryAttribute from '../models/CategoryAttribute.model.js';
import AttributeType from '../models/AttributeType.model.js';
import AttributeValue from '../models/AttributeValue.model.js';
import Category from '../models/Category/CategorySchema.js';
import { NotFoundError, ValidationError } from '../utils/ApiError.js';

// ── REDIS CACHE STUB ───────────────────────────────────────────────────────────
// Replace these two helpers with your real ioredis client calls.
// TTL is in seconds.
const CACHE_TTL = 300; // 5 minutes

async function cacheGet(key) {
    // Example real implementation:
    // return redisClient.get(key).then(v => v ? JSON.parse(v) : null);
    return null; // Disabled — wire up your Redis client here.
}

async function cacheSet(key, data, ttl = CACHE_TTL) {
    // Example real implementation:
    // await redisClient.setex(key, ttl, JSON.stringify(data));
}

async function cacheInvalidate(key) {
    // await redisClient.del(key);
}

// ── HELPERS ────────────────────────────────────────────────────────────────────

/**
 * Maps a raw aggregation doc (AttributeType + joined values) to the public DTO.
 *
 * Public contract:
 * {
 *   id, name, type, isRequired, displayOrder, groupLabel,
 *   values: [{ id, value, displayName?, sortOrder? }]
 * }
 */
function _toAttributeDTO(doc) {
    return {
        id: doc._id.toString(),
        name: doc.displayName || doc.name,
        slug: doc.slug,
        type: doc.inputType || 'select',
        category: doc.category,
        isRequired: doc._junctionIsRequired ?? doc.validationRules?.isRequired ?? false,
        displayOrder: doc._junctionDisplayOrder ?? doc.sortingConfig?.displayOrder ?? 0,
        groupLabel: doc._junctionGroupLabel || null,
        showInFilters: doc.showInFilters ?? true,
        showInVariants: doc.showInVariants ?? true,
        values: (doc.values || []).map((v) => ({
            id: v._id.toString(),
            value: v.displayName || v.name,
            slug: v.slug,
            sortOrder: v.displayOrder ?? 0,
            // Pass through visual data if available (colour swatches, images)
            ...(v.visualData?.hexCode && { hexCode: v.visualData.hexCode }),
            ...(v.visualData?.swatchType &&
                v.visualData.swatchType !== 'none' && {
                swatchType: v.visualData.swatchType,
                swatchValue: v.visualData.swatchValue,
            }),
        })),
    };
}

// ── MAIN SERVICE ───────────────────────────────────────────────────────────────

/**
 * Validates `categoryId` is a non-empty string formatted as a Mongoose ObjectId.
 * Throws ValidationError (400) if invalid.
 */
function _validateCategoryId(categoryId) {
    if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
        throw new ValidationError('categoryId query parameter is required');
    }
    if (!mongoose.Types.ObjectId.isValid(categoryId.trim())) {
        throw new ValidationError(
            `categoryId "${categoryId}" is not a valid ObjectId format`
        );
    }
}

/**
 * getAttributesByCategory
 * ────────────────────────
 * Returns the full attribute tree scoped to a category:
 *
 *  {
 *    categoryId: string,
 *    categoryName: string,
 *    attributes: AttributeDTO[]
 *  }
 *
 * Strategy:
 *  1. Validate input.
 *  2. Check Redis cache — return early on HIT.
 *  3. Verify category exists (404 guard).
 *  4. Run single aggregation pipeline.
 *  5. Map + sort → cache → return.
 *
 * @param {string} categoryId - Raw Mongoose ObjectId string.
 * @returns {Promise<Object>} Response payload.
 */
export async function getAttributesByCategory(categoryId) {
    _validateCategoryId(categoryId);

    const catObjectId = new mongoose.Types.ObjectId(categoryId.trim());
    const cacheKey = `attr_tree:${categoryId}`;

    // ── 1. Cache HIT ────────────────────────────────────────────────────────────
    const cached = await cacheGet(cacheKey);
    if (cached) {
        return { ...cached, _source: 'cache' };
    }

    // ── 2. Verify category exists ───────────────────────────────────────────────
    const category = await Category.findOne({
        _id: catObjectId,
        isDeleted: false,
    })
        .select('_id name slug')
        .lean();

    if (!category) {
        throw new NotFoundError(`Category with id "${categoryId}" was not found`);
    }

    // ── 3. Single Aggregation Pipeline ─────────────────────────────────────────
    //
    //  Stage 1: Filter CategoryAttribute junction for this category
    //  Stage 2: $lookup into AttributeType (with isDeleted + status filter)
    //  Stage 3: $unwind AttributeType
    //  Stage 4: $lookup into AttributeValue (filtered: active, not deleted,
    //            scoped to this attributeType), sorted by displayOrder
    //  Stage 5: $sort by junction displayOrder
    //
    const pipeline = [
        // ① Start from the junction table — one doc per (category, attributeType)
        {
            $match: {
                categoryId: catObjectId,
                isDeleted: false,
            },
        },

        // ② Join AttributeType — only active, non-deleted records
        {
            $lookup: {
                from: 'attributetypes',
                let: { atId: '$attributeTypeId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$atId'] },
                            isDeleted: false,
                            status: { $in: ['active', 'draft'] },
                        },
                    },
                    {
                        $project: {
                            name: 1,
                            displayName: 1,
                            slug: 1,
                            code: 1,
                            category: 1,
                            inputType: 1,
                            showInFilters: 1,
                            showInVariants: 1,
                            'validationRules.isRequired': 1,
                            'sortingConfig.displayOrder': 1,
                        },
                    },
                ],
                as: 'attributeType',
            },
        },

        // ③ Drop junction rows where the AttributeType no longer exists
        { $unwind: { path: '$attributeType', preserveNullAndEmptyArrays: false } },

        // ④ Inline sort/isRequired from junction so they override global defaults
        {
            $addFields: {
                'attributeType._junctionIsRequired': '$isRequired',
                'attributeType._junctionDisplayOrder': '$displayOrder',
                'attributeType._junctionGroupLabel': '$groupLabel',
            },
        },

        // ⑤ Join AttributeValues for this attributeType — active, not deleted,
        //    sorted by displayOrder ascending
        {
            $lookup: {
                from: 'attributevalues',
                let: { atId: '$attributeType._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$attributeType', '$$atId'] },
                            isDeleted: false,
                            status: 'active',
                        },
                    },
                    { $sort: { displayOrder: 1, name: 1 } },
                    {
                        $project: {
                            name: 1,
                            displayName: 1,
                            slug: 1,
                            displayOrder: 1,
                            'visualData.hexCode': 1,
                            'visualData.swatchType': 1,
                            'visualData.swatchValue': 1,
                        },
                    },
                ],
                as: 'attributeType.values',
            },
        },

        // ⑥ Sort attributes by per-category displayOrder
        { $sort: { displayOrder: 1 } },

        // ⑦ Reshape output — only expose attributeType subtree
        {
            $replaceRoot: { newRoot: '$attributeType' },
        },
    ];

    const rawAttributes = await CategoryAttribute.aggregate(pipeline);

    // ── 4. Map to DTOs ──────────────────────────────────────────────────────────
    const attributes = rawAttributes.map(_toAttributeDTO);

    const payload = {
        categoryId: category._id.toString(),
        categoryName: category.name,
        categorySlug: category.slug,
        count: attributes.length,
        attributes,
    };

    // ── 5. Populate cache ────────────────────────────────────────────────────────
    await cacheSet(cacheKey, payload);

    return payload;
}

/**
 * linkAttributeToCategory
 * ────────────────────────
 * Creates or restores a CategoryAttribute junction record.
 * Used by the admin panel when assigning attributes to a category.
 *
 * @param {string} categoryId
 * @param {string} attributeTypeId
 * @param {object} options - { isRequired, displayOrder, groupLabel }
 */
export async function linkAttributeToCategory(
    categoryId,
    attributeTypeId,
    options = {}
) {
    const { isRequired = false, displayOrder = 0, groupLabel } = options;

    // Upsert — if a soft-deleted record exists, restore it
    const result = await CategoryAttribute.findOneAndUpdate(
        { categoryId, attributeTypeId },
        {
            $set: {
                isRequired,
                displayOrder,
                groupLabel,
                isDeleted: false,
                deletedAt: null,
            },
        },
        { upsert: true, new: true, runValidators: true }
    );

    // Invalidate cache for this category
    await cacheInvalidate(`attr_tree:${categoryId}`);

    return result;
}

/**
 * unlinkAttributeFromCategory
 * ────────────────────────────
 * Soft-deletes the CategoryAttribute junction record.
 *
 * @param {string} categoryId
 * @param {string} attributeTypeId
 */
export async function unlinkAttributeFromCategory(categoryId, attributeTypeId) {
    const result = await CategoryAttribute.findOneAndUpdate(
        { categoryId, attributeTypeId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true }
    );

    if (!result) {
        throw new NotFoundError(
            `No active link found between category "${categoryId}" and attribute "${attributeTypeId}"`
        );
    }

    await cacheInvalidate(`attr_tree:${categoryId}`);
    return result;
}
