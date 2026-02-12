import { getDynamicFilters } from '../services/filterService.js';
import { parseSearchQuery } from '../services/searchParser.service.js';
import VariantMaster from '../models/VariantMaster.js';

// Get Dynamic Facets/Filters
export const getExploreFilters = async (req, res) => {
    try {
        const { categoryId, productIds, category } = req.body; // or query params

        let additionalFilters = {};
        if (productIds) {
            additionalFilters.productIds = productIds;
        }

        // Handle category from either categoryId or category field
        const targetCategory = categoryId || category;

        const filters = await getDynamicFilters(targetCategory, additionalFilters);

        res.json({
            success: true,
            data: filters
        });
    } catch (error) {
        console.error('Explore filters error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate filters'
        });
    }
};

// Smart Search
export const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ success: false, message: 'Query required' });
        }

        // 1. Parse Query
        const parsed = await parseSearchQuery(q);

        // 2. Build Database Query
        // Match variants that have ALL the attribute filters
        const matchConditions = {
            status: 'active'
        };

        // Add Attribute Filters
        // mappedFilters: { color: [id1], size: [id2] }
        // UnifiedVariant: attributes array [{attributeType: ..., attributeValue: ...}]
        // This requires complex $and logic for "Matches Color Red AND Matches Size XL"

        const andConditions = [];

        // Text Search (if unmapped tokens exist)
        // This depends on the Product model having text index, or UnifiedVariant SKUs
        if (parsed.text) {
            // For prototype/demo, we search in SKU or delegate to Product search
            // Here just regex on SKU for simplicity
            andConditions.push({
                sku: { $regex: parsed.text, $options: 'i' }
            });
        }

        // Attribute Filters
        Object.keys(parsed.filters).forEach(typeName => {
            const valueIds = parsed.filters[typeName];
            // Condition: attributes elemMatch (value in valueIds)
            // But we don't assume typeName maps to Type ID easily here without Lookup.
            // Wait, parseSearchQuery returns ID for values.
            // We need to match 'attributes.attributeValue' IN valueIds.
            // AND do this for EACH type found.

            andConditions.push({
                attributes: {
                    $elemMatch: {
                        attributeValue: { $in: valueIds }
                    }
                }
            });
        });

        if (andConditions.length > 0) {
            matchConditions.$and = andConditions;
        }

        // 3. Execute Search
        const results = await VariantMaster.find(matchConditions)
            .populate('product', 'name slug images') // Assuming Product linkage
            .limit(50);

        res.json({
            success: true,
            parsedQuery: parsed,
            resultsCount: results.length,
            data: results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
};
