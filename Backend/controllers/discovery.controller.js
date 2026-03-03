/**
 * ========================================================================
 * DISCOVERY CONTROLLER — SearchDocument-First Architecture
 * ========================================================================
 *
 * CRITICAL RULE:
 *   ALL listing/search queries go through SearchDocument.
 *   VariantMaster is NEVER queried directly for listing or search.
 *   VariantMaster is only accessed for:
 *     1. PDP (single variant detail, keyed by variantId or productGroupId)
 *     2. Checkout (pricing + status verification inside a transaction)
 *
 * Why:
 *   - VariantMaster is the source-of-truth write model (complex schema, many hooks)
 *   - SearchDocument is the pre-computed read projection (flat, indexed, 50ms SLA)
 *   - Mixing them causes scatter-gather across shards for unscoped queries
 *
 * ========================================================================
 */

import SearchDocument from '../models/masters/SearchDocument.enterprise.js';
import { getDynamicFilters } from '../services/filterService.js';

// ── Get Dynamic Facets/Filters ─────────────────────────────────────────────

export const getExploreFilters = async (req, res) => {
    try {
        const { categoryId, productIds, category } = req.body;

        let additionalFilters = {};
        if (productIds) additionalFilters.productIds = productIds;

        const targetCategory = categoryId || category;
        const filters = await getDynamicFilters(targetCategory, additionalFilters);

        res.json({ success: true, data: filters });
    } catch (error) {
        console.error('Explore filters error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate filters' });
    }
};

// ── Smart Listing Search — through SearchDocument ONLY ─────────────────────

/**
 * Full-featured product search & listing.
 *
 * All queries go through SearchDocument (read projection layer).
 * VariantMaster is NOT touched in this flow.
 *
 * Query params:
 *   q         - free-text search
 *   category  - category slug/name filter
 *   brand     - brand slug/name filter
 *   minPrice  - price range lower bound
 *   maxPrice  - price range upper bound
 *   inStock   - 'true' to filter in-stock only
 *   color     - color attribute filter
 *   size      - size attribute filter
 *   sortBy    - 'relevance' | 'price_asc' | 'price_desc' | 'popularity' | 'newest'
 *   page      - page number (default: 1)
 *   limit     - page size (default: 24, max: 100)
 *   channel   - 'WEB' | 'APP' | 'B2B' | 'POS'
 *   region    - 'US' | 'EU' | 'APAC' | 'GLOBAL'
 */
export const searchProducts = async (req, res) => {
    try {
        const {
            q,
            category,
            brand,
            minPrice,
            maxPrice,
            inStock,
            color,
            size,
            material,
            sortBy = 'relevance',
            page = 1,
            limit = 24,
            channel,
            region,
        } = req.query;

        // Build attribute filters
        const attributes = {};
        if (color) attributes.color = color.toLowerCase();
        if (size) attributes.size = size.toLowerCase();
        if (material) attributes.material = material.toLowerCase();

        // Enforce max page size to prevent DDoS via giant pages
        const pageSize = Math.min(parseInt(limit, 10) || 24, 100);
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);

        // ✅ SearchDocument.searchWithFacets — zero VariantMaster reads
        const results = await SearchDocument.searchWithFacets(q, {
            text: q || null,
            category: category || null,
            brand: brand || null,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            inStockOnly: inStock === 'true',
            attributes,
            channel: channel || null,
            region: region || null,
            sortBy,
            page: pageNum,
            limit: pageSize,
        });

        res.json({
            success: true,
            source: 'SearchDocument',   // Audit: confirms we're using the projection layer
            parsedQuery: { q, category, brand, attributes, sortBy },
            ...results,
        });
    } catch (error) {
        console.error('[Discovery] Search error:', error);
        res.status(500).json({ success: false, message: 'Search failed' });
    }
};

// ── Browse by Category (Listing Page) ─────────────────────────────────────

/**
 * Category listing page — uses SearchDocument with pre-computed facets.
 * No direct VariantMaster query.
 */
export const browseCategory = async (req, res) => {
    try {
        const { categorySlug } = req.params;
        const { sortBy = 'popularity', page = 1, limit = 24, inStock, brand, color, size, minPrice, maxPrice } = req.query;

        const attributes = {};
        if (color) attributes.color = color.toLowerCase();
        if (size) attributes.size = size.toLowerCase();

        const results = await SearchDocument.searchWithFacets(null, {
            category: categorySlug.toUpperCase(),
            brand: brand || null,
            inStockOnly: inStock === 'true',
            attributes,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            sortBy,
            page: Math.max(parseInt(page, 10), 1),
            limit: Math.min(parseInt(limit, 10) || 24, 100),
        });

        res.json({
            success: true,
            source: 'SearchDocument',
            category: categorySlug,
            ...results,
        });
    } catch (error) {
        console.error('[Discovery] Browse category error:', error);
        res.status(500).json({ success: false, message: 'Browse failed' });
    }
};

// ── Similar Products ───────────────────────────────────────────────────────

/**
 * Fetch similar products by same category + brand.
 * Used in PDP "You may also like" section.
 */
export const getSimilarProducts = async (req, res) => {
    try {
        const { variantId } = req.params;

        // Fetch the source document from SearchDocument (not VariantMaster)
        const source = await SearchDocument.findOne({ variantId }).lean();
        if (!source) {
            return res.status(404).json({ success: false, message: 'Product not found in search index' });
        }

        const similar = await SearchDocument.find({
            category: source.category,
            isActive: true,
            inStock: true,
            variantId: { $ne: source.variantId },
        })
            .sort({ popularityScore: -1 })
            .limit(8)
            .lean();

        res.json({ success: true, source: 'SearchDocument', data: similar });
    } catch (error) {
        console.error('[Discovery] Similar products error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch similar products' });
    }
};
