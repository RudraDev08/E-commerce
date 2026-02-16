import mongoose from 'mongoose';

/**
 * ENTERPRISE SIZE MASTER
 * Scope: Global size registry with regional variants
 * Scale: 10k-50k size definitions
 * Constraints: Compound uniqueness, deprecation safety, conversion tables
 */

const sizeConversionSchema = new mongoose.Schema({
    region: { type: String, enum: ['US', 'UK', 'EU', 'JP', 'AU', 'CN'], required: true },
    value: { type: String, required: true, trim: true },
    numericEquivalent: Number
}, { _id: false });

const sizeMasterSchema = new mongoose.Schema({
    // ==================== CANONICAL IDENTITY ====================
    canonicalId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        immutable: true,
        description: "Immutable global identifier (e.g., SIZE-CLO-MEN-US-XL)"
    },

    // ==================== SCOPING ====================
    category: {
        type: String,
        required: true,
        enum: ['CLOTHING', 'FOOTWEAR', 'ACCESSORIES', 'STORAGE', 'RAM', 'DISPLAY', 'DIMENSION'],
        index: true
    },

    gender: {
        type: String,
        required: true,
        enum: ['MEN', 'WOMEN', 'UNISEX', 'BOYS', 'GIRLS', 'INFANT'],
        default: 'UNISEX',
        index: true
    },

    primaryRegion: {
        type: String,
        required: true,
        enum: ['US', 'UK', 'EU', 'JP', 'AU', 'CN', 'GLOBAL'],
        default: 'GLOBAL',
        description: "Primary sizing standard"
    },

    // ==================== VALUES ====================
    value: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        description: "Technical value (e.g., 'XL', '42', '10.5')"
    },

    displayName: {
        type: String,
        required: true,
        trim: true,
        description: "User-facing label (e.g., 'Extra Large', 'Size 42')"
    },

    // ==================== NORMALIZATION & SORTING ====================
    normalizedRank: {
        type: Number,
        required: true,
        index: true,
        description: "Deterministic sort order (XS=10, S=20, M=30, L=40, XL=50)"
    },

    numericValue: {
        type: Number,
        sparse: true,
        description: "Numeric equivalent for numeric sizes (e.g., 42, 10.5)"
    },

    sortOrder: {
        type: Number,
        default: 0,
        index: true
    },

    // ==================== MEASUREMENTS ====================
    measurements: {
        unit: {
            type: String,
            enum: ['CM', 'IN', 'MM', 'G', 'KG', 'LB', 'OZ', 'ML', 'L', 'GB', 'TB', 'NONE'],
            default: 'NONE'
        },
        min: Number,
        max: Number,
        typical: Number,
        equivalentCm: Number,
        equivalentInch: Number
    },

    // ==================== REGIONAL CONVERSIONS ====================
    conversions: [sizeConversionSchema],

    // ==================== LIFECYCLE STATE MACHINE ====================
    lifecycleState: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'],
        default: 'DRAFT',
        required: true,
        index: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    // ==================== DEPRECATION ====================
    deprecatedAt: Date,
    deprecationReason: String,

    replacedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SizeMaster',
        sparse: true,
        description: "Pointer to replacement size"
    },

    // ==================== GOVERNANCE ====================
    isLocked: {
        type: Boolean,
        default: false,
        description: "Prevents modification by automated processes"
    },

    usageCount: {
        type: Number,
        default: 0,
        min: 0,
        description: "Number of active variants using this size (event-driven)"
    },

    // ==================== AUDIT ====================
    version: {
        type: Number,
        default: 1,
        min: 1
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    auditLog: [{
        action: { type: String, enum: ['CREATED', 'UPDATED', 'DEPRECATED', 'LOCKED', 'UNLOCKED'] },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        changes: mongoose.Schema.Types.Mixed
    }]

}, {
    timestamps: true,
    collection: 'sizemasters',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== COMPOUND INDEXES ====================
// Uniqueness: No duplicate "XL" for "Men's Clothing" in "US" region
sizeMasterSchema.index(
    { category: 1, gender: 1, primaryRegion: 1, value: 1 },
    { unique: true, name: 'idx_size_uniqueness' }
);

// Lookup Performance
sizeMasterSchema.index(
    { category: 1, gender: 1, lifecycleState: 1, normalizedRank: 1 },
    { name: 'idx_size_lookup' }
);

// Active Sizes Only
sizeMasterSchema.index(
    { lifecycleState: 1, isActive: 1, category: 1 },
    { name: 'idx_size_active' }
);

// Deprecation Chain
sizeMasterSchema.index(
    { replacedBy: 1 },
    { sparse: true, name: 'idx_size_replacement' }
);

// ==================== VIRTUALS ====================
sizeMasterSchema.virtual('isDeprecated').get(function () {
    return this.lifecycleState === 'DEPRECATED';
});

sizeMasterSchema.virtual('canDelete').get(function () {
    return this.usageCount === 0 && this.lifecycleState === 'ARCHIVED';
});

// ==================== STATIC METHODS ====================
sizeMasterSchema.statics.findActiveByCategory = function (category, gender = 'UNISEX') {
    return this.find({
        category,
        gender: { $in: [gender, 'UNISEX'] },
        lifecycleState: 'ACTIVE',
        isActive: true
    }).sort({ normalizedRank: 1 });
};

sizeMasterSchema.statics.validateTransition = function (currentState, newState) {
    const allowedTransitions = {
        'DRAFT': ['ACTIVE', 'ARCHIVED'],
        'ACTIVE': ['DEPRECATED', 'ARCHIVED'],
        'DEPRECATED': ['ARCHIVED'],
        'ARCHIVED': [] // Terminal state
    };

    return allowedTransitions[currentState]?.includes(newState) || false;
};

// ==================== MIDDLEWARE ====================
sizeMasterSchema.pre('save', async function (next) {
    // Generate canonical ID on creation
    if (this.isNew && !this.canonicalId) {
        this.canonicalId = `SIZE-${this.category}-${this.gender}-${this.primaryRegion}-${this.value}`;
    }

    // Lifecycle validation
    if (this.isModified('lifecycleState')) {
        const oldState = this._original?.lifecycleState || 'DRAFT';
        if (!this.constructor.validateTransition(oldState, this.lifecycleState)) {
            throw new Error(`Invalid lifecycle transition: ${oldState} → ${this.lifecycleState}`);
        }
    }

    // Lock enforcement
    if (this.isLocked && !this.isNew && this.isModified()) {
        const allowedFields = ['updatedBy', 'isLocked', 'auditLog'];
        const modifiedFields = this.modifiedPaths().filter(p => !allowedFields.includes(p));
        if (modifiedFields.length > 0) {
            throw new Error(`Cannot modify locked size. Modified fields: ${modifiedFields.join(', ')}`);
        }
    }

    next();
});

// Prevent deletion if in use
sizeMasterSchema.pre('remove', async function (next) {
    if (this.usageCount > 0) {
        throw new Error(`Cannot delete size with ${this.usageCount} active references. Deprecate instead.`);
    }
    next();
});

export default mongoose.models.SizeMaster || mongoose.model('SizeMaster', sizeMasterSchema);
