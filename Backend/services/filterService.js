import VariantMaster from '../models/VariantMaster.js';
import mongoose from 'mongoose';

/**
 * Filter Service
 * Handles building complex MongoDB aggregation pipelines for filtering products
 */

export const getDynamicFilters = async (category, additionalFilters = {}) => {
    const matchStage = {
        status: 'active'
    };

    if (category) {
        matchStage.category = category;
    }

    if (additionalFilters.productIds) {
        matchStage.productGroup = { $in: additionalFilters.productIds };
    }

    // Aggregation Pipeline
    const pipeline = [
        { $match: matchStage },
        {
            $facet: {
                // 1. Brands
                brands: [
                    { $group: { _id: '$brand', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                // 2. Colors
                colors: [
                    { $match: { color: { $exists: true, $ne: null } } },
                    { $group: { _id: '$color', count: { $sum: 1 } } },
                    {
                        $lookup: {
                            from: 'colormasters',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'details'
                        }
                    },
                    { $unwind: { path: '$details', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 1,
                            count: 1,
                            name: '$details.name',
                            hexCode: '$details.hexCode'
                        }
                    }
                ],
                // 3. Sizes
                sizes: [
                    { $unwind: '$sizes' },
                    { $group: { _id: '$sizes.value', count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ],
                // 4. Price Range
                priceRange: [
                    {
                        $group: {
                            _id: null,
                            min: { $min: '$price' },
                            max: { $max: '$price' }
                        }
                    }
                ]
            }
        }
    ];

    const results = await VariantMaster.aggregate(pipeline);
    return results[0];
};

export const buildFilterPipeline = async (filters) => {
    // Placeholder for future advanced filtering logic
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.brand) query.brand = { $in: filters.brand };
    return query;
};
