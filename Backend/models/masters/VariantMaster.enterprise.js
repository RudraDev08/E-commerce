import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * ENTERPRISE VARIANT MASTER (DETERMINISTIC CORE)
 * Scope: Global variant registry with collision-proof configuration
 * Scale: 20M+ variants
 * Constraints: SHA-256 config hash, normalized snapshots, event-driven sync
 */

const normalizedAttributeSchema = new mongoose.Schema({
    typeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttributeType',
        required: true
    },
    valueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttributeValue',
        required: true
    },
    typeSlug: {
        type: String,
        required: true,
        lowercase: true
    },
    valueSlug: {
        type: String,
        required: true,
        lowercase: true
    },
    valueName: {
        type: String,
        required: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { _id: false });

const priceSnapshotSchema = new mongoose.Schema({
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    compareAt: { type: Number, min: 0 },
    cost: { type: Number, min: 0 },
    margin: { type: Number },
    marginPercent: { type: Number },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveUntil: Date
}, { _id: false });

const inventorySummarySchema = new mongoose.Schema({
    totalQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    availableQuantity: { type: Number, default: 0, min: 0 },

    locations: [{
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
        warehouseCode: String,
        quantity: { type: Number, default: 0, min: 0 },
        reserved: { type: Number, default: 0, min: 0 }
    }],

    lastSyncedAt: { type: Date, default: Date.now },
    syncVersion: { type: Number, default: 1 }
}, { _id: false });

const variantMasterSchema = new mongoose.Schema({
    // ==================== CANONICAL IDENTITY ====================
    canonicalId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        immutable: true,
        description: "Immutable global identifier"
    },

    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
        description: "Globally unique SKU (e.g., NKE-TSH-BLK-XL-001)"
    },

    barcode: {
        type: String,
        sparse: true,
        unique: true,
        trim: true,
        uppercase: true,
        description: "EAN-13, UPC-A, or GTIN-14"
    },

    // ==================== PRODUCT REFERENCE ====================
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
        index: true,
        description: "Product group identifier for variant clustering"
    },

    productName: {
        type: String,
        required: true,
        description: "Denormalized for search performance"
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

    // ==================== DETERMINISTIC CONFIGURATION ====================
    configHash: {
        type: String,
        required: true,
        unique: true,
        description: "SHA-256 hash of canonicalized attribute configuration"
    },

    configSignature: {
        type: String,
        required: true,
        description: "Human-readable config (e.g., 'COLOR:BLACK|SIZE:XL')"
    },

    // ==================== NORMALIZED ATTRIBUTE SNAPSHOT ====================
    normalizedAttributes: {
        type: [normalizedAttributeSchema],
        required: true,
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Variant must have at least one attribute'
        }
    },

    // ==================== PRICING ====================
    currentPrice: priceSnapshotSchema,

    priceHistory: [priceSnapshotSchema],

    minVariantPrice: {
        type: Number,
        index: true,
        description: "Cached min price across all channels/regions"
    },

    maxVariantPrice: {
        type: Number,
        index: true,
        description: "Cached max price across all channels/regions"
    },

    // ==================== INVENTORY SUMMARY ====================
    inventorySummary: inventorySummarySchema,

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

    // ==================== LIFECYCLE STATE MACHINE ====================
    lifecycleState: {
        type: String,
        enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'MATURE', 'CLEARANCE', 'DISCONTINUED', 'ARCHIVED'],
        default: 'DRAFT',
        required: true,
        index: true
    },

    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'ARCHIVED'],
        default: 'DRAFT',
        index: true
    },

    isActive: {
        type: Boolean,
        default: false,
        index: true
    },

    // ==================== DATES ====================
    launchDate: Date,
    discontinuedDate: Date,
    archivedDate: Date,

    // ==================== GOVERNANCE ====================
    isLocked: {
        type: Boolean,
        default: false,
        description: "Prevents automated modifications"
    },

    requiresApproval: {
        type: Boolean,
        default: false
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    approvedAt: Date,

    // ==================== SEARCH PROJECTION ====================
    searchProjection: {
        title: String,
        description: String,
        keywords: [String],
        tags: [String],
        searchableText: String,
        lastIndexedAt: Date
    },

    // ==================== ANALYTICS ====================
    analytics: {
        viewCount: { type: Number, default: 0 },
        purchaseCount: { type: Number, default: 0 },
        cartAddCount: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        popularityScore: { type: Number, default: 0, index: true },
        lastPurchaseAt: Date
    },

    // ==================== VERSIONING ====================
    version: {
        type: Number,
        default: 1,
        min: 1
    },

    schemaVersion: {
        type: String,
        default: '2.0',
        description: "Schema version for migration tracking"
    },

    // ==================== AUDIT ====================
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    auditLog: [{
        action: {
            type: String,
            enum: ['CREATED', 'UPDATED', 'PRICE_CHANGED', 'INVENTORY_SYNCED', 'STATUS_CHANGED', 'APPROVED', 'LOCKED']
        },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        changes: mongoose.Schema.Types.Mixed,
        metadata: mongoose.Schema.Types.Mixed
    }]

}, {
    timestamps: true,
    collection: 'variantmasters',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== COMPOUND INDEXES ====================
// Collision prevention (primary constraint)
variantMasterSchema.index({ configHash: 1 }, { unique: true, name: 'idx_variant_config_hash' });

// Product clustering
variantMasterSchema.index(
    { productGroup: 1, lifecycleState: 1, isActive: 1 },
    { name: 'idx_variant_product_group' }
);

// Price range filtering
variantMasterSchema.index(
    { category: 1, 'currentPrice.amount': 1, lifecycleState: 1 },
    { name: 'idx_variant_price_range' }
);

// Inventory faceting
variantMasterSchema.index(
    { 'inventorySummary.availableQuantity': 1, lifecycleState: 1 },
    { name: 'idx_variant_stock' }
);

// Segmentation filtering
variantMasterSchema.index(
    { availableChannels: 1, availableRegions: 1, lifecycleState: 1 },
    { name: 'idx_variant_segmentation' }
);

// Attribute value lookups
variantMasterSchema.index(
    { 'normalizedAttributes.valueId': 1 },
    { name: 'idx_variant_attributes' }
);

// Popularity sorting
variantMasterSchema.index(
    { 'analytics.popularityScore': -1, lifecycleState: 1 },
    { name: 'idx_variant_popularity' }
);

// ==================== VIRTUALS ====================
variantMasterSchema.virtual('isInStock').get(function () {
    return this.inventorySummary?.availableQuantity > 0;
});

variantMasterSchema.virtual('discountPercentage').get(function () {
    if (this.currentPrice?.compareAt && this.currentPrice.compareAt > this.currentPrice.amount) {
        return Math.round(((this.currentPrice.compareAt - this.currentPrice.amount) / this.currentPrice.compareAt) * 100);
    }
    return 0;
});

variantMasterSchema.virtual('canDelete').get(function () {
    return this.lifecycleState === 'ARCHIVED' &&
        this.inventorySummary?.totalQuantity === 0 &&
        this.analytics?.purchaseCount === 0;
});

// ==================== STATIC METHODS ====================
/**
 * Generate deterministic configuration hash
 * @param {ObjectId} productId - Product reference
 * @param {Array<ObjectId>} attributeValueIds - Sorted attribute value IDs
 * @returns {string} SHA-256 hash
 */
variantMasterSchema.statics.generateConfigHash = function (productId, attributeValueIds) {
    if (!productId) throw new Error('Product ID required for hash generation');
    if (!attributeValueIds || attributeValueIds.length === 0) {
        throw new Error('At least one attribute value required');
    }

    // 1. Canonicalize: Sort attribute IDs deterministically
    const sortedIds = [...attributeValueIds]
        .map(id => id.toString())
        .sort()
        .join('|');

    // 2. Combine with product identity
    const rawString = `${productId.toString()}:${sortedIds}`;

    // 3. Generate SHA-256 hash
    return crypto.createHash('sha256').update(rawString).digest('hex');
};

/**
 * Generate human-readable configuration signature
 */
variantMasterSchema.statics.generateConfigSignature = function (normalizedAttributes) {
    return normalizedAttributes
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(attr => `${attr.typeSlug.toUpperCase()}:${attr.valueSlug.toUpperCase()}`)
        .join('|');
};

/**
 * Validate lifecycle state transition
 */
variantMasterSchema.statics.validateTransition = function (currentState, newState) {
    const allowedTransitions = {
        'DRAFT': ['PENDING_APPROVAL', 'ACTIVE', 'ARCHIVED'],
        'PENDING_APPROVAL': ['ACTIVE', 'DRAFT', 'ARCHIVED'],
        'ACTIVE': ['MATURE', 'CLEARANCE', 'DISCONTINUED', 'ARCHIVED'],
        'MATURE': ['CLEARANCE', 'DISCONTINUED', 'ARCHIVED'],
        'CLEARANCE': ['DISCONTINUED', 'ARCHIVED'],
        'DISCONTINUED': ['ARCHIVED'],
        'ARCHIVED': []
    };

    return allowedTransitions[currentState]?.includes(newState) || false;
};

/**
 * Find variants by product group with filters
 */
variantMasterSchema.statics.findByProductGroup = function (productGroup, filters = {}) {
    const query = {
        productGroup,
        lifecycleState: { $in: ['ACTIVE', 'MATURE', 'CLEARANCE'] },
        isActive: true
    };

    if (filters.minPrice) query['currentPrice.amount'] = { $gte: filters.minPrice };
    if (filters.maxPrice) query['currentPrice.amount'] = { ...query['currentPrice.amount'], $lte: filters.maxPrice };
    if (filters.inStockOnly) query['inventorySummary.availableQuantity'] = { $gt: 0 };
    if (filters.channel) query.availableChannels = filters.channel;
    if (filters.region) query.availableRegions = filters.region;

    return this.find(query).sort({ 'analytics.popularityScore': -1 });
};

// ==================== MIDDLEWARE ====================
variantMasterSchema.pre('save', async function () {
    // 1. Generate canonical ID
    if (this.isNew && !this.canonicalId) {
        this.canonicalId = `VAR-${this.sku}`;
    }

    // 2. Ensure config hash consistency
    if (this.isModified('normalizedAttributes') || this.isModified('productId')) {
        const valueIds = this.normalizedAttributes.map(a => a.valueId);
        this.configHash = this.constructor.generateConfigHash(this.productId, valueIds);
        this.configSignature = this.constructor.generateConfigSignature(this.normalizedAttributes);
    }

    // 3. Calculate inventory availability
    if (this.inventorySummary) {
        this.inventorySummary.availableQuantity =
            this.inventorySummary.totalQuantity - this.inventorySummary.reservedQuantity;
    }

    // 4. Calculate price margins
    if (this.currentPrice && this.currentPrice.cost) {
        this.currentPrice.margin = this.currentPrice.amount - this.currentPrice.cost;
        this.currentPrice.marginPercent =
            ((this.currentPrice.margin / this.currentPrice.amount) * 100).toFixed(2);
    }

    // 5. Update min/max price cache
    if (this.currentPrice) {
        this.minVariantPrice = this.currentPrice.amount;
        this.maxVariantPrice = this.currentPrice.compareAt || this.currentPrice.amount;
    }

    // 6. Lifecycle validation
    if (this.isModified('lifecycleState')) {
        const oldState = this._original?.lifecycleState || 'DRAFT';
        if (!this.constructor.validateTransition(oldState, this.lifecycleState)) {
            throw new Error(`Invalid lifecycle transition: ${oldState} → ${this.lifecycleState}`);
        }
    }

    // 7. Lock enforcement
    if (this.isLocked && !this.isNew && this.isModified()) {
        const allowedFields = [
            'updatedBy', 'isLocked', 'auditLog', 'inventorySummary',
            'analytics', 'searchProjection.lastIndexedAt'
        ];
        const modifiedFields = this.modifiedPaths().filter(p =>
            !allowedFields.some(allowed => p.startsWith(allowed))
        );
        if (modifiedFields.length > 0) {
            throw new Error(`Cannot modify locked variant. Modified fields: ${modifiedFields.join(', ')}`);
        }
    }

    // 8. Auto-activate if approved
    if (this.isModified('approvedBy') && this.approvedBy && this.lifecycleState === 'PENDING_APPROVAL') {
        this.lifecycleState = 'ACTIVE';
        this.isActive = true;
    }
});

// Prevent deletion if has sales history
variantMasterSchema.pre('remove', async function (next) {
    if (this.analytics?.purchaseCount > 0) {
        throw new Error(`Cannot delete variant with ${this.analytics.purchaseCount} purchases. Archive instead.`);
    }
    if (this.inventorySummary?.totalQuantity > 0) {
        throw new Error('Cannot delete variant with inventory. Move stock first.');
    }
    next();
});

export default mongoose.models.VariantMaster || mongoose.model('VariantMaster', variantMasterSchema);
