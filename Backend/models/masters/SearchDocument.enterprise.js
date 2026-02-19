import mongoose from 'mongoose';

/**
 * SEARCH DOCUMENT (PROJECTION LAYER)
 * Purpose: Flattened, denormalized search index for sub-50ms queries
 * Scale: 20M+ documents
 * Strategy: Event-driven sync, no wildcard indexes, faceted search ready
 */

const searchDocumentSchema = new mongoose.Schema({
    // ==================== IDENTITY ====================
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VariantMaster',
        required: true,
        unique: true,
        index: true
    },

    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true
    },

    // ==================== PRODUCT INFO ====================
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },

    productGroup: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },

    productName: {
        type: String,
        required: true,
        index: 'text'
    },

    brand: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },

    category: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },

    subcategory: {
        type: String,
        uppercase: true,
        index: true
    },

    // ==================== SEARCHABLE TEXT ====================
    title: {
        type: String,
        required: true,
        index: 'text'
    },

    description: {
        type: String,
        index: 'text'
    },

    searchableText: {
        type: String,
        description: "Pre-computed concatenated search text",
        index: 'text'
    },

    keywords: [{
        type: String,
        lowercase: true
    }],

    tags: [{
        type: String,
        lowercase: true,
        index: true
    }],

    // ==================== FLATTENED ATTRIBUTES ====================
    // Pre-flattened for faceted search (no $lookup required)
    attributes: {
        color: { type: String, index: true },
        colorFamily: { type: String, index: true },
        size: { type: String, index: true },
        sizeCategory: { type: String, index: true },
        material: { type: String, index: true },
        style: { type: String, index: true },
        fit: { type: String, index: true },
        pattern: { type: String, index: true },
        // Add more as needed
        custom: mongoose.Schema.Types.Mixed
    },

    // ==================== PRICING (INDEXED) ====================
    price: {
        type: Number,
        required: true,
        min: 0,
        index: true
    },

    compareAtPrice: {
        type: Number,
        min: 0,
        index: true
    },

    discountPercentage: {
        type: Number,
        default: 0,
        index: true
    },

    currency: {
        type: String,
        default: 'USD',
        uppercase: true
    },

    // ==================== INVENTORY FACETS ====================
    inStock: {
        type: Boolean,
        default: false,
        index: true
    },

    availableQuantity: {
        type: Number,
        default: 0,
        index: true
    },

    lowStock: {
        type: Boolean,
        default: false,
        index: true,
        description: "True if quantity < 10"
    },

    // ==================== LIFECYCLE & STATUS ====================
    lifecycleState: {
        type: String,
        enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'MATURE', 'CLEARANCE', 'DISCONTINUED', 'ARCHIVED'],
        default: 'DRAFT',
        index: true
    },

    isActive: {
        type: Boolean,
        default: false,
        index: true
    },

    // ==================== SEGMENTATION ====================
    availableChannels: {
        type: [String],
        enum: ['WEB', 'POS', 'B2B', 'APP', 'MARKETPLACE'],
        default: ['WEB'],
        index: true
    },

    availableRegions: {
        type: [String],
        enum: ['US', 'EU', 'APAC', 'GLOBAL'],
        default: ['GLOBAL'],
        index: true
    },

    // ==================== POPULARITY & RANKING ====================
    popularityScore: {
        type: Number,
        default: 0,
        index: true
    },

    viewCount: {
        type: Number,
        default: 0
    },

    purchaseCount: {
        type: Number,
        default: 0,
        index: true
    },

    conversionRate: {
        type: Number,
        default: 0
    },

    // ==================== DATES ====================
    launchDate: {
        type: Date,
        index: true
    },

    lastPurchaseAt: Date,

    // ==================== SYNC METADATA ====================
    lastSyncedAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    syncVersion: {
        type: Number,
        default: 1
    },

    syncStatus: {
        type: String,
        enum: ['SYNCED', 'PENDING', 'FAILED'],
        default: 'SYNCED',
        index: true
    }

}, {
    timestamps: true,
    collection: 'searchdocuments'
});

// ==================== COMPOUND INDEXES ====================

// Full-text search (MongoDB text index)
searchDocumentSchema.index(
    { productName: 'text', description: 'text', searchableText: 'text', keywords: 'text' },
    {
        name: 'idx_search_fulltext',
        weights: {
            productName: 10,
            searchableText: 5,
            description: 3,
            keywords: 2
        }
    }
);

// Category + Price Range (most common filter)
searchDocumentSchema.index(
    { category: 1, price: 1, isActive: 1 },
    { name: 'idx_search_category_price' }
);

// Brand + Category
searchDocumentSchema.index(
    { brand: 1, category: 1, isActive: 1 },
    { name: 'idx_search_brand_category' }
);

// Stock Availability
searchDocumentSchema.index(
    { inStock: 1, lifecycleState: 1, isActive: 1 },
    { name: 'idx_search_stock' }
);

// Popularity Sorting
searchDocumentSchema.index(
    { popularityScore: -1, isActive: 1 },
    { name: 'idx_search_popularity' }
);

// New Arrivals
searchDocumentSchema.index(
    { launchDate: -1, isActive: 1 },
    { name: 'idx_search_new_arrivals' }
);

// Clearance/Sale
searchDocumentSchema.index(
    { lifecycleState: 1, discountPercentage: -1, isActive: 1 },
    { name: 'idx_search_clearance' }
);

// Segmentation
searchDocumentSchema.index(
    { availableChannels: 1, availableRegions: 1, isActive: 1 },
    { name: 'idx_search_segmentation' }
);

// Attribute Facets (individual indexes for common filters)
searchDocumentSchema.index({ 'attributes.color': 1, isActive: 1 }, { name: 'idx_search_color' });
searchDocumentSchema.index({ 'attributes.size': 1, isActive: 1 }, { name: 'idx_search_size' });
searchDocumentSchema.index({ 'attributes.material': 1, isActive: 1 }, { name: 'idx_search_material' });

// ==================== STATIC METHODS ====================

/**
 * Build search document from variant
 */
searchDocumentSchema.statics.buildFromVariant = function (variant) {
    // Extract flattened attributes
    const attributes = {};

    variant.normalizedAttributes?.forEach(attr => {
        const typeSlug = attr.typeSlug.toLowerCase();
        const valueSlug = attr.valueSlug.toLowerCase();

        if (typeSlug === 'color') {
            attributes.color = valueSlug;
        } else if (typeSlug === 'size') {
            attributes.size = valueSlug;
        } else if (typeSlug === 'material') {
            attributes.material = valueSlug;
        } else if (typeSlug === 'style') {
            attributes.style = valueSlug;
        } else {
            attributes.custom = attributes.custom || {};
            attributes.custom[typeSlug] = valueSlug;
        }
    });

    // Build searchable text
    const searchableText = [
        variant.productName,
        variant.brand,
        variant.category,
        variant.sku,
        ...Object.values(attributes).filter(v => typeof v === 'string')
    ].join(' ');

    // Calculate discount
    const discountPercentage = variant.currentPrice?.compareAt
        ? Math.round(((variant.currentPrice.compareAt - variant.currentPrice.amount) / variant.currentPrice.compareAt) * 100)
        : 0;

    return {
        variantId: variant._id,
        sku: variant.sku,
        productId: variant.productId,
        productGroup: variant.productGroup,
        productName: variant.productName,
        brand: variant.brand,
        category: variant.category,
        subcategory: variant.subcategory,

        title: `${variant.productName} - ${variant.brand}`,
        description: variant.searchProjection?.description || '',
        searchableText,
        keywords: variant.searchProjection?.keywords || [],
        tags: variant.searchProjection?.tags || [],

        attributes,

        price: variant.currentPrice?.amount || 0,
        compareAtPrice: variant.currentPrice?.compareAt,
        discountPercentage,
        currency: variant.currentPrice?.currency || 'USD',

        inStock: variant.inventorySummary?.availableQuantity > 0,
        availableQuantity: variant.inventorySummary?.availableQuantity || 0,
        lowStock: variant.inventorySummary?.availableQuantity > 0 && variant.inventorySummary?.availableQuantity < 10,

        lifecycleState: variant.lifecycleState,
        isActive: variant.isActive,

        availableChannels: variant.availableChannels,
        availableRegions: variant.availableRegions,

        popularityScore: variant.analytics?.popularityScore || 0,
        viewCount: variant.analytics?.viewCount || 0,
        purchaseCount: variant.analytics?.purchaseCount || 0,
        conversionRate: variant.analytics?.conversionRate || 0,

        launchDate: variant.launchDate,
        lastPurchaseAt: variant.analytics?.lastPurchaseAt,

        lastSyncedAt: new Date(),
        syncVersion: (variant.version || 0) + 1,
        syncStatus: 'SYNCED'
    };
};

/**
 * Sync variant to search index
 */
searchDocumentSchema.statics.syncVariant = async function (variant) {
    const searchDoc = this.buildFromVariant(variant);

    return this.findOneAndUpdate(
        { variantId: variant._id },
        searchDoc,
        { upsert: true, new: true }
    );
};

/**
 * Batch sync variants
 */
searchDocumentSchema.statics.syncBatch = async function (variants) {
    const bulkOps = variants.map(variant => ({
        updateOne: {
            filter: { variantId: variant._id },
            update: this.buildFromVariant(variant),
            upsert: true
        }
    }));

    return this.bulkWrite(bulkOps);
};

/**
 * Search with facets
 */
searchDocumentSchema.statics.searchWithFacets = async function (query, options = {}) {
    const {
        text,
        category,
        brand,
        minPrice,
        maxPrice,
        inStockOnly,
        attributes = {},
        channel,
        region,
        sortBy = 'relevance',
        page = 1,
        limit = 24
    } = options;

    // Build filter
    const filter = {
        isActive: true,
        lifecycleState: { $in: ['ACTIVE', 'MATURE', 'CLEARANCE'] }
    };

    if (text) {
        filter.$text = { $search: text };
    }

    if (category) filter.category = category.toUpperCase();
    if (brand) filter.brand = brand.toUpperCase();
    if (minPrice) filter.price = { $gte: minPrice };
    if (maxPrice) filter.price = { ...filter.price, $lte: maxPrice };
    if (inStockOnly) filter.inStock = true;
    if (channel) filter.availableChannels = channel;
    if (region) filter.availableRegions = region;

    // Apply attribute filters
    Object.keys(attributes).forEach(key => {
        filter[`attributes.${key}`] = attributes[key];
    });

    // Build sort
    let sort = {};
    switch (sortBy) {
        case 'price_asc': sort = { price: 1 }; break;
        case 'price_desc': sort = { price: -1 }; break;
        case 'popularity': sort = { popularityScore: -1 }; break;
        case 'newest': sort = { launchDate: -1 }; break;
        case 'relevance':
        default:
            sort = text ? { score: { $meta: 'textScore' } } : { popularityScore: -1 };
    }

    // Execute search
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
        this.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        this.countDocuments(filter)
    ]);

    // Build facets
    const facets = await this._buildFacets(filter);

    return {
        results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        facets
    };
};

/**
 * Build facets for current filter
 * @private
 */
searchDocumentSchema.statics._buildFacets = async function (baseFilter) {
    const facets = {};

    // Category facet
    facets.categories = await this.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    // Brand facet
    facets.brands = await this.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    // Price range facet
    facets.priceRanges = await this.aggregate([
        { $match: baseFilter },
        {
            $bucket: {
                groupBy: '$price',
                boundaries: [0, 25, 50, 100, 200, 500, 1000, 10000],
                default: 'Other',
                output: { count: { $sum: 1 } }
            }
        }
    ]);

    // Color facet
    facets.colors = await this.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$attributes.color', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    // Size facet
    facets.sizes = await this.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$attributes.size', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    return facets;
};

export default mongoose.models.SearchDocument || mongoose.model('SearchDocument', searchDocumentSchema);
