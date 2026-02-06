import UnifiedVariant from '../models/UnifiedVariant.model.js';
import AttributeType from '../models/AttributeType.model.js';
import AttributeValue from '../models/AttributeValue.model.js';
import Product from '../models/Product/ProductSchema.js';
import mongoose from 'mongoose';

/**
 * Filter Service
 * Generates dynamic, context-aware filters based on actual product data
 */

export const getDynamicFilters = async (categoryId, additionalFilters = {}) => {
    try {
        // 1. Identify valid products (e.g. active, and belonging to category)
        // Assuming 'Product' model or UnifiedVariant linkage. 
        // Since UnifiedVariant has 'product', we filter variants directly if possible.
        // If filtering by Category, we usually need Product list first.
        // For this prototype, I'll assume we filter Variants directly if we had a join or if 'applicableCategories' is relevant.
        // But commonly: Get ProductIds in Category -> Match Variants.
        // Here, let's assume we filter UnifiedVariant by 'product' ID list passed in 'additionalFilters.productIds' if available,
        // or we might need a Lookup.

        // Simplification for Step 8: Aggregate ALL active variants (or filtered subset)
        const matchStage = {
            status: 'active',
            isDeleted: false
        };

        if (categoryId) {
            // Find products in this category
            const products = await Product.find({
                category: categoryId,
                status: 'active',
                isDeleted: false
            }).select('_id');

            const productIds = products.map(p => p._id);
            matchStage.product = { $in: productIds };
        }

        if (additionalFilters.productIds) {
            matchStage.product = { $in: additionalFilters.productIds.map(id => new mongoose.Types.ObjectId(id)) };
        }

        // 2. Aggregate to find used Attributes
        const pipeline = [
            { $match: matchStage },
            // Unwind attributes to process individual facets
            { $unwind: "$attributes" },
            {
                $group: {
                    _id: {
                        type: "$attributes.attributeType",
                        value: "$attributes.attributeValue"
                    },
                    count: { $sum: 1 }
                }
            },
            // Lookup Type Info (to check showInFilters)
            {
                $lookup: {
                    from: "attributetypes", // collection name (lowercase plural)
                    localField: "_id.type",
                    foreignField: "_id",
                    as: "typeInfo"
                }
            },
            { $unwind: "$typeInfo" },
            // Filter only showInFilters = true
            { $match: { "typeInfo.showInFilters": true } },
            // Lookup Value Info (for display name)
            {
                $lookup: {
                    from: "attributevalues",
                    localField: "_id.value",
                    foreignField: "_id",
                    as: "valueInfo"
                }
            },
            { $unwind: "$valueInfo" },
            // Group back by Attribute Type
            {
                $group: {
                    _id: "$_id.type",
                    attributeType: { $first: "$typeInfo" },
                    values: {
                        $push: {
                            _id: "$valueInfo._id",
                            name: "$valueInfo.name",
                            displayName: "$valueInfo.displayName",
                            visualData: "$valueInfo.visualData", // For swatch rendering in filters
                            count: "$count"
                        }
                    }
                }
            },
            // Sort by Type Display Order
            { $sort: { "attributeType.sortingConfig.displayOrder": 1, "attributeType.name": 1 } }
        ];

        const results = await UnifiedVariant.aggregate(pipeline);

        // 3. Format Response
        return results.map(group => ({
            attributeType: {
                _id: group.attributeType._id,
                name: group.attributeType.name,
                displayName: group.attributeType.displayName,
                filterDisplayType: group.attributeType.filterDisplayType,
                inputType: group.attributeType.inputType
            },
            values: group.values.sort((a, b) => b.count - a.count) // Sort values by popularity (count)
        }));

    } catch (error) {
        console.error('Filter generation error:', error);
        throw error;
    }
};
