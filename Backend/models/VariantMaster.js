import mongoose from 'mongoose';
import crypto from 'crypto';

const variantImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    altText: {
        type: String
    }
}, { _id: true });

const variantSizeSchema = new mongoose.Schema({
    sizeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SizeMaster',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    }
}, { _id: false });

const variantAttributeSchema = new mongoose.Schema({
    attributeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttributeMaster',
        required: true
    },
    valueId: {
        type: mongoose.Schema.Types.ObjectId
    },
    customValue: {
        type: String
    }
}, { _id: false });

const variantSchema = new mongoose.Schema({
    // Product Identity & Grouping
    productGroup: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    subcategory: {
        type: String,
        trim: true
    },

    // Variant Configuration
    sku: {
        type: String,
        required: true,
        unique: true,
        index: true,
        uppercase: true,
        trim: true
    },
    configHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    color: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ColorMaster'
    },
    sizes: [variantSizeSchema],
    attributes: [variantAttributeSchema],

    // Pricing
    price: {
        type: Number,
        required: true,
        min: 0
    },
    compareAtPrice: {
        type: Number,
        min: 0
    },
    costPrice: {
        type: Number,
        min: 0
    },

    // Physical Properties
    weight: {
        type: Number,
        min: 0
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'in', 'mm'],
            default: 'cm'
        }
    },

    // Content
    description: {
        type: String
    },
    specifications: {
        type: mongoose.Schema.Types.Mixed
    },

    // Images
    images: [variantImageSchema],

    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active',
        index: true
    }
}, {
    timestamps: true
});

// ========================================
// INDEXES FOR PERFORMANCE
// ========================================

// ========================================
// INDEXES FOR PERFORMANCE & INTEGRITY
// ========================================

// Compound index for product group queries & duplicate prevention
variantSchema.index({ productGroup: 1, configHash: 1 }, { unique: true });

// Compound index for category browsing
variantSchema.index({ category: 1, subcategory: 1, status: 1 });

// Compound index for brand filtering
variantSchema.index({ brand: 1, status: 1 });

// SKU should be unique system-wide
variantSchema.index({ sku: 1 }, { unique: true });

// Text search index
variantSchema.index({ productName: 'text', description: 'text' });

// ========================================
// STATIC METHODS
// ========================================

/**
 * Generate deterministic configuration hash
 * Prevents duplicate variant configurations
 */
variantSchema.statics.generateConfigHash = function (productGroup, sizeIds, colorId, attributeIds) {
    const sortedSizes = [...(sizeIds || [])].sort().join(',');
    const sortedAttrs = [...(attributeIds || [])].sort().join(',');
    const hashInput = `${productGroup}|${sortedSizes}|${colorId || ''}|${sortedAttrs}`;

    return crypto
        .createHash('sha256')
        .update(hashInput)
        .digest('hex')
        .substring(0, 32);
};

/**
 * Generate unique SKU
 */
variantSchema.statics.generateSKU = async function (brand, productGroup, sizeValues, colorName) {
    const brandPrefix = brand.substring(0, 3).toUpperCase();
    const groupSuffix = productGroup.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Create size part
    const sizePart = sizeValues.slice(0, 2).join('-').substring(0, 10).toUpperCase();

    // Create color part
    const colorPart = colorName ? colorName.substring(0, 3).toUpperCase() : 'STD';

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();

    let sku = `${brandPrefix}-${groupSuffix}-${sizePart}-${colorPart}-${randomSuffix}`;

    // Ensure uniqueness
    let counter = 1;
    while (await this.findOne({ sku })) {
        sku = `${brandPrefix}-${groupSuffix}-${sizePart}-${colorPart}-${randomSuffix}${counter}`;
        counter++;
    }

    return sku;
};

/**
 * Get variants by product group with stock
 */
variantSchema.statics.getByProductGroup = async function (productGroup, includeStock = false) {
    const query = this.find({ productGroup, status: 'active' })
        .populate('color')
        .populate('sizes.sizeId')
        .lean();

    const variants = await query;

    if (includeStock) {
        const VariantInventory = mongoose.model('VariantInventory');
        const variantIds = variants.map(v => v._id);

        const inventory = await VariantInventory.aggregate([
            { $match: { variant: { $in: variantIds } } },
            {
                $group: {
                    _id: '$variant',
                    totalStock: { $sum: { $subtract: ['$quantity', '$reservedQuantity'] } }
                }
            }
        ]);

        const stockMap = {};
        inventory.forEach(inv => {
            stockMap[inv._id.toString()] = inv.totalStock;
        });

        variants.forEach(v => {
            v.totalStock = stockMap[v._id.toString()] || 0;
            v.inStock = v.totalStock > 0;
        });
    }

    return variants;
};

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Get primary image
 */
variantSchema.methods.getPrimaryImage = function () {
    const primary = this.images.find(img => img.isPrimary);
    return primary || this.images[0] || null;
};

/**
 * Check if variant is available
 */
variantSchema.methods.isAvailable = async function () {
    if (this.status !== 'active') return false;

    const VariantInventory = mongoose.model('VariantInventory');
    const inventory = await VariantInventory.find({ variant: this._id });

    const totalAvailable = inventory.reduce((sum, inv) => {
        return sum + (inv.quantity - inv.reservedQuantity);
    }, 0);

    return totalAvailable > 0;
};

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save: Generate configHash if not provided
variantSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('sizes') || this.isModified('color') || this.isModified('attributes')) {
        const sizeIds = this.sizes.map(s => s.sizeId.toString());
        const colorId = this.color ? this.color.toString() : null;
        const attrIds = this.attributes.map(a => a.attributeId.toString());

        this.configHash = this.constructor.generateConfigHash(
            this.productGroup,
            sizeIds,
            colorId,
            attrIds
        );
    }

    // Ensure only one primary image
    if (this.images && this.images.length > 0) {
        const primaryCount = this.images.filter(img => img.isPrimary).length;
        if (primaryCount === 0) {
            this.images[0].isPrimary = true;
        } else if (primaryCount > 1) {
            let foundFirst = false;
            this.images.forEach(img => {
                if (img.isPrimary && !foundFirst) {
                    foundFirst = true;
                } else {
                    img.isPrimary = false;
                }
            });
        }
    }

    next();
});

// ========================================
// VIRTUALS
// ========================================

variantSchema.virtual('discountPercentage').get(function () {
    if (this.compareAtPrice && this.compareAtPrice > this.price) {
        return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
    }
    return 0;
});

variantSchema.set('toJSON', { virtuals: true });
variantSchema.set('toObject', { virtuals: true });

export default mongoose.models.VariantMaster || mongoose.model('VariantMaster', variantSchema);
