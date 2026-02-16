import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
    // ==================== IDENTITY ====================
    value: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        description: "Standardized technical value (e.g., 'XL', '42', '10.5')"
    },

    displayName: {
        type: String,
        required: true,
        trim: true,
        description: "User-facing label (e.g., 'Extra Large')"
    },

    // ==================== SCOPE ====================
    category: {
        type: String,
        required: true,
        enum: ['clothing', 'shoes', 'accessories', 'storage', 'ram', 'weight', 'volume', 'dimension', 'kids'],
        index: true
    },

    gender: {
        type: String,
        enum: ['men', 'women', 'unisex', 'boys', 'girls', 'infant'],
        default: 'unisex',
        index: true
    },

    region: {
        type: String,
        enum: ['US', 'UK', 'EU', 'JP', 'GLOBAL'],
        default: 'GLOBAL',
        description: "Regional sizing standard (e.g., UK vs US shoe sizes)",
        index: true
    },

    // ==================== MEASUREMENT ====================
    measurements: {
        unit: {
            type: String,
            enum: ['cm', 'in', 'mm', 'g', 'kg', 'lb', 'oz', 'ml', 'l', 'none'],
            default: 'none'
        },
        min: Number,
        max: Number,
        equivalentCm: Number
    },

    // ==================== LOGIC & SORTING ====================
    sortOrder: {
        type: Number,
        default: 0,
        index: true
    },

    normalizedValue: {
        type: Number,
        description: "Numeric value for sorting comparison (e.g., XS=1, S=2, XL=5)"
    },

    // ==================== LIFECYCLE & GOVERNANCE ====================
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    isDeprecated: {
        type: Boolean,
        default: false,
        index: true
    },

    replacedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SizeMaster',
        description: "Pointer to new size if this one is deprecated"
    },

    deprecationNote: String,

    // ==================== AUDIT ====================
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================
// Compound Uniqueness: No duplicate 'XL' for 'Men's Clothing' in 'US'
sizeSchema.index({ category: 1, gender: 1, region: 1, value: 1 }, { unique: true });

// Lookup Performance
sizeSchema.index({ category: 1, gender: 1, isActive: 1, sortOrder: 1 });

// Deprecation Safety
sizeSchema.index({ isDeprecated: 1, replacedBy: 1 });

// ==================== MIDDLEWARE ====================
sizeSchema.pre('save', function (next) {
    // Auto-normalization helper (simple example)
    if (!this.normalizedValue && typeof this.value === 'number') {
        this.normalizedValue = this.value;
    }
    next();
});

export default mongoose.models.SizeMaster || mongoose.model('SizeMaster', sizeSchema);
