import mongoose from 'mongoose';
import Counter from '../../models/Counter.js';

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
        required: false, // Handled by middleware/generator
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
        enum: ['MEN', 'WOMEN', 'UNISEX', 'BOYS', 'GIRLS', 'INFANT', 'KIDS'],
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
        action: {
            type: String,
            enum: ['CREATED', 'UPDATED', 'LIFECYCLE_CHANGED', 'LOCKED', 'UNLOCKED', 'ARCHIVED']
        },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        changes: mongoose.Schema.Types.Mixed
    }]

}, {
    timestamps: true,
    collection: 'sizes',
    optimisticConcurrency: true, // v6+ Feature: Prevents lost updates
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== COMPOUND INDEXES ====================
// Uniqueness: No duplicate "XL" for "Men's Clothing" in "US" region
sizeMasterSchema.index(
    { category: 1, gender: 1, primaryRegion: 1, value: 1 },
    {
        unique: true,
        name: 'idx_size_uniqueness',
        partialFilterExpression: { lifecycleState: { $ne: 'ARCHIVED' } }
    }
);

// Consolidated Text Index (Replaces Regex Search for Scale)
sizeMasterSchema.index(
    {
        value: 'text',
        displayName: 'text',
        canonicalId: 'text'
    },
    {
        name: 'SizeMasterTextIndex',
        weights: {
            value: 10,
            displayName: 5,
            canonicalId: 8
        }
    }
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
    // Matches controller rule: ARCHIVED or DRAFT with zero usage
    return this.usageCount === 0 && ['ARCHIVED', 'DRAFT'].includes(this.lifecycleState);
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

// SINGLE SOURCE OF TRUTH — mirrored in frontend VALID_TRANSITIONS constant
const VALID_TRANSITIONS = {
    DRAFT: ['ACTIVE', 'ARCHIVED'],
    ACTIVE: ['DEPRECATED', 'ARCHIVED', 'DRAFT'],
    DEPRECATED: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
    ARCHIVED: ['DRAFT', 'ACTIVE']  // Allow restoration
};

sizeMasterSchema.statics.validateTransition = function (currentState, newState) {
    if (currentState === newState) return false; // No-op transitions are not valid
    return VALID_TRANSITIONS[currentState]?.includes(newState) || false;
};

// Expose the map so controllers can read allowed transitions per state
sizeMasterSchema.statics.VALID_TRANSITIONS = VALID_TRANSITIONS;

// ATOMIC ID GENERATION
sizeMasterSchema.statics.generateCanonicalId = async function () {
    const counter = await Counter.findByIdAndUpdate(
        'size_master',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `SZ_${String(counter.seq).padStart(4, '0')}`;
};

// USAGE TRACKING (Transactional Safety)
sizeMasterSchema.statics.incrementUsage = async function (sizeId) {
    return this.findByIdAndUpdate(sizeId, { $inc: { usageCount: 1 } });
};

sizeMasterSchema.statics.decrementUsage = async function (sizeId) {
    // $max guard prevents usageCount from going below 0 (avoids negative drift)
    return this.findByIdAndUpdate(sizeId, [
        { $set: { usageCount: { $max: [{ $subtract: ['$usageCount', 1] }, 0] } } }
    ]);
};


// ==================== MIDDLEWARE ====================
// Generate canonical ID BEFORE validation runs (single declaration)
sizeMasterSchema.pre('validate', async function () {
    if (this.isModified('lifecycleState')) {
        this.isActive = this.lifecycleState === 'ACTIVE';
    }

    if (this.isNew && !this.canonicalId) {
        try {
            this.canonicalId = await this.constructor.generateCanonicalId();
        } catch (err) {
            throw new Error(`canonicalId generation failed: ${err.message}`);
        }
    }
});

sizeMasterSchema.pre('save', async function () {
    // 1. Lifecycle Transition Validation — fetch actual DB state to prevent illegal transitions
    if (this.isModified('lifecycleState') && !this.isNew) {
        const current = await this.constructor
            .findById(this._id)
            .select('lifecycleState')
            .lean();
        if (current) {
            const isValid = (VALID_TRANSITIONS[current.lifecycleState] || []).includes(this.lifecycleState);
            if (!isValid) {
                throw new Error(
                    `Invalid lifecycle transition: "${current.lifecycleState}" → "${this.lifecycleState}". ` +
                    `Allowed: [${(VALID_TRANSITIONS[current.lifecycleState] || []).join(', ') || 'none'}]`
                );
            }
        }
    }

    // 2. Lock Enforcement — only usageCount and auditLog allowed on locked docs
    if (this.isLocked && !this.isNew && this.isModified()) {
        const allowedFields = ['updatedBy', 'isLocked', 'auditLog', 'updatedAt', 'usageCount'];
        const modifiedFields = this.modifiedPaths().filter(p => !allowedFields.includes(p));
        if (modifiedFields.length > 0) {
            throw new Error(`Cannot modify locked size. Attempted fields: ${modifiedFields.join(', ')}`);
        }
    }
});

// Prevent deletion if in use OR if Active
sizeMasterSchema.pre('deleteOne', { document: true, query: false }, async function () {
    if (this.usageCount > 0) {
        throw new Error(`Cannot delete size with ${this.usageCount} active references. Deprecate instead.`);
    }

    // STRICT: Only allow deletion of ARCHIVED or DRAFT
    if (!['ARCHIVED', 'DRAFT'].includes(this.lifecycleState)) {
        throw new Error('Only ARCHIVED or DRAFT sizes can be deleted.');
    }
});

// SINGLETON EXPORT
export default mongoose.models.SizeMaster || mongoose.model('SizeMaster', sizeMasterSchema);
