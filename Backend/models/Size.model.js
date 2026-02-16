import mongoose from 'mongoose';
import slugify from 'slugify';

// Sub-schemas for structured data
const measurementSchema = new mongoose.Schema({
    chest: { type: Number }, // in cm
    waist: { type: Number },
    hip: { type: Number },
    length: { type: Number },
    shoulder: { type: Number },
    inseam: { type: Number },
    // Footwear specific
    footLength: { type: Number },
    footWidth: { type: Number }
}, { _id: false });

const conversionSchema = new mongoose.Schema({
    uk: { type: String },
    us: { type: String },
    eu: { type: String },
    jp: { type: String },
    cm: { type: Number } // for shoes
}, { _id: false });

const sizeChartMetadataSchema = new mongoose.Schema({
    recommendedHeight: { min: Number, max: Number }, // in cm
    recommendedWeight: { min: Number, max: Number }, // in kg
    fitNotes: { type: String }, // "Runs small", "True to size", "Relaxed fit"
    ageGroup: { type: String, enum: ['infant', 'toddler', 'kids', 'teen', 'adult'] }
}, { _id: false });

const sizeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Size name is required'],
            trim: true,
            uppercase: true, // XL, not xl
            maxlength: [50, 'Size name cannot exceed 50 characters']
        },
        slug: {
            type: String,
            required: [true, 'Size slug is required'],
            unique: true,
            lowercase: true,
            index: true
        },
        code: {
            type: String,
            required: [true, 'Size code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            maxlength: [50, 'Size code cannot exceed 50 characters'],
            index: true
        },
        value: {
            type: String,
            trim: true,
            maxlength: [50, 'Size value cannot exceed 50 characters']
        },

        // Full name for display (e.g., "Extra Large", "Size 32")
        fullName: {
            type: String,
            trim: true
        },

        abbreviation: {
            type: String, // "XL", "32"
            trim: true,
            uppercase: true
        },

        // Size category type
        category: {
            type: String,
            required: true,
            enum: [
                'clothing_alpha',      // XS, S, M, L, XL, XXL, XXXL
                'clothing_numeric',    // 28, 30, 32, 34, 36, 38, 40, 42
                'shoe_uk',
                'shoe_us',
                'shoe_eu',
                'ring',
                'belt',
                'generic',            // Small, Medium, Large
                'custom',             // One Size, Free Size
                'bra',
                'glove',
                'hat',
                'electronics'         // For RAM/Storage variants
            ],
            default: 'generic',
            index: true
        },

        // Size group (e.g., "Men's Clothing", "Women's Footwear")
        sizeGroup: {
            type: String,
            trim: true
        },

        // Gender/demographic
        gender: {
            type: String,
            enum: ['men', 'women', 'unisex', 'boys', 'girls', 'kids', 'toddler', 'infant'],
            default: 'unisex'
        },

        // Display order for sorting
        displayOrder: {
            type: Number,
            default: 0
        },

        // Measurements for clothing/footwear
        measurements: measurementSchema,

        // International size conversions
        internationalConversions: conversionSchema,

        // Size chart metadata
        sizeChartMetadata: sizeChartMetadataSchema,

        // Electronics-specific fields removed as part of unified attribute refactor

        applicableCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }],
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
            index: true
        },
        priority: {
            type: Number,
            default: 0,
            min: 0
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        // Soft delete
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        // Audit fields
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);


// Indexes for performance
sizeSchema.index({ code: 1, isDeleted: 1 });
sizeSchema.index({ status: 1, isDeleted: 1 });
sizeSchema.index({ priority: 1 });
sizeSchema.index({ category: 1, displayOrder: 1 });
sizeSchema.index({ sizeGroup: 1, gender: 1 });
sizeSchema.index({ category: 1, sizeGroup: 1, gender: 1 });

// Virtual for product count
sizeSchema.virtual('productCount', {
    ref: 'Variant',
    localField: '_id',
    foreignField: 'size',
    count: true
});

// Virtual for full display name
sizeSchema.virtual('displayName').get(function () {
    return this.fullName || this.name;
});

// Pre-save: auto-generate abbreviation if not provided
sizeSchema.pre('save', async function () {
    if (!this.abbreviation) {
        this.abbreviation = this.name;
    }
});

// Static method to find active sizes
sizeSchema.statics.findActive = function () {
    return this.find({ status: 'active', isDeleted: false }).sort({ priority: 1, displayOrder: 1, name: 1 });
};

// Static method to find by category
sizeSchema.statics.findByCategory = function (categoryId) {
    return this.find({
        applicableCategories: categoryId,
        status: 'active',
        isDeleted: false
    }).sort({ priority: 1, displayOrder: 1, name: 1 });
};

// Static method to find by size category (clothing_alpha, shoe_uk, etc.)
sizeSchema.statics.findBySizeCategory = function (sizeCategory, filters = {}) {
    const query = {
        category: sizeCategory,
        status: 'active',
        isDeleted: false
    };

    if (filters.sizeGroup) query.sizeGroup = filters.sizeGroup;
    if (filters.gender) query.gender = filters.gender;

    return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Static method to get all size groups
sizeSchema.statics.getSizeGroups = function () {
    return this.distinct('sizeGroup', { isDeleted: false });
};

// Static method for size conversion
sizeSchema.statics.convertSize = async function (fromSize, fromSystem, toSystem) {
    const size = await this.findOne({
        name: fromSize.toUpperCase(),
        category: `shoe_${fromSystem.toLowerCase()}`,
        isDeleted: false
    }).lean();

    if (!size || !size.internationalConversions) {
        return null;
    }

    return size.internationalConversions[toSystem.toLowerCase()] || null;
};


// Instance method to soft delete
sizeSchema.methods.softDelete = function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    // Rename slug and code to allow reuse
    const timestamp = new Date().getTime();
    this.slug = `${this.slug}-deleted-${timestamp}`;
    this.code = `${this.code}-DEL-${timestamp.toString().slice(-4)}`; // Keep code sort of short
    return this.save();
};

// Instance method to restore
sizeSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

const Size = mongoose.model('Size', sizeSchema);

export default Size;
