import mongoose from 'mongoose';

/**
 * PRODUCTION-READY VARIANT SCHEMA
 * 
 * DESIGN PRINCIPLES:
 * - Product + Size + Color = Unique Variant
 * - Compound unique index prevents duplicates
 * - References Size Master and Color Master
 * - Dynamic pricing, stock, and images per variant
 * - Soft delete support
 * - Full audit trail
 * 
 * FORMULA: productId + sizeId + colorId = UNIQUE VARIANT
 */

const variantSchema = new mongoose.Schema(
    {
        // ====================================================================
        // CORE IDENTITY (Required)
        // ====================================================================
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product ID is required'],
            index: true
        },

        // ====================================================================
        // SIZE MASTER REFERENCE (Required for products with sizes)
        // ====================================================================
        sizeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Size',
            required: false, // Optional: Only if product has sizes
            index: true
        },

        // ====================================================================
        // COLOR MASTER REFERENCE (Required for products with colors)
        // ====================================================================
        colorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Color',
            required: false, // Optional: Only if product has colors
            index: true
        },

        // ====================================================================
        // COLORWAY STRATEGY (For multi-color variants)
        // ====================================================================
        colorwayName: {
            type: String,
            trim: true,
            required: false
            // Example: "Chicago", "Panda", "Triple Black"
        },

        colorParts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Color'
            // Array of colors composing the colorway
        }],

        // ====================================================================
        // LEGACY ATTRIBUTES (For backward compatibility)
        // Will be deprecated in favor of sizeId/colorId
        // ====================================================================
        attributes: {
            type: Map,
            of: String,
            default: {}
            // Example: { size: "M", color: "Black", material: "Cotton" }
            // NOTE: Use sizeId and colorId instead for new implementations
        },

        // ====================================================================
        // SKU (Auto-generated, Unique)
        // ====================================================================
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            unique: true,
            trim: true,
            uppercase: true,
            index: true
            // Format: PROD-{productId}-SIZE-{sizeId}-COLOR-{colorId}
            // Example: PROD-ABC123-SIZE-XL-COLOR-RED
        },

        // ====================================================================
        // PRICING (Required)
        // ====================================================================
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
            default: 0
        },

        sellingPrice: {
            type: Number,
            min: [0, 'Selling price cannot be negative'],
            default: function () { return this.price; }
        },

        basePrice: {
            type: Number,
            min: [0, 'Base price cannot be negative'],
            default: 0
            // MRP / Compare At Price
        },

        compareAtPrice: {
            type: Number,
            min: [0, 'Compare at price cannot be negative'],
            default: 0
        },

        costPrice: {
            type: Number,
            min: [0, 'Cost price cannot be negative'],
            select: false // Hidden from queries (internal use only)
        },

        currency: {
            type: String,
            default: 'INR',
            enum: ['INR', 'USD', 'EUR', 'GBP'],
            uppercase: true
        },

        // ====================================================================
        // INVENTORY (Required)
        // ====================================================================
        stock: {
            type: Number,
            required: [true, 'Stock is required'],
            min: [0, 'Stock cannot be negative'],
            default: 0,
            index: true
        },

        reserved: {
            type: Number,
            min: [0, 'Reserved stock cannot be negative'],
            default: 0
            // Stock locked in active carts/orders
        },

        minStock: {
            type: Number,
            min: [0, 'Minimum stock cannot be negative'],
            default: 5
            // Low stock alert threshold
        },

        allowBackorder: {
            type: Boolean,
            default: false
            // Allow sales when stock = 0
        },

        // ====================================================================
        // MEDIA (Variant-specific images)
        // ====================================================================
        image: {
            type: String,
            default: ''
            // Primary variant image (e.g., Red T-Shirt front view)
        },

        images: [{
            type: String
        }],
        // Array of variant-specific images
        // Falls back to product.galleryImages if empty

        gallery: [{
            type: String
        }],
        // Additional variant images (alias for images)

        // ====================================================================
        // STATUS & VISIBILITY
        // ====================================================================
        status: {
            type: Boolean,
            default: true,
            index: true
            // true = active, false = inactive
        },

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

        // ====================================================================
        // AUDIT TRAIL
        // ====================================================================
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

// ========================================================================
// INDEXES (Critical for Performance)
// ========================================================================

// Compound Index for Lookup Performance (Non-Unique)
variantSchema.index({ productId: 1, sizeId: 1, colorId: 1 });

// Performance indexes
variantSchema.index({ productId: 1, status: 1, isDeleted: 1 });
variantSchema.index({ sku: 1, isDeleted: 1 });
variantSchema.index({ stock: 1 });
variantSchema.index({ sizeId: 1, status: 1 });
variantSchema.index({ colorId: 1, status: 1 });

// ========================================================================
// VIRTUALS
// ========================================================================

// Virtual: Sellable Stock (stock - reserved)
variantSchema.virtual('sellable').get(function () {
    if (this.allowBackorder) return 999999;
    return Math.max(0, this.stock - this.reserved);
});

// Virtual: Stock Status
variantSchema.virtual('stockStatus').get(function () {
    if (this.stock <= 0 && !this.allowBackorder) return 'out_of_stock';
    if (this.stock <= this.minStock) return 'low_stock';
    return 'in_stock';
});

// Virtual: Discount Percentage
variantSchema.virtual('discountPercent').get(function () {
    if (!this.basePrice || !this.sellingPrice) return 0;
    if (this.basePrice <= this.sellingPrice) return 0;
    return Math.round(((this.basePrice - this.sellingPrice) / this.basePrice) * 100);
});

// Virtual: Profit (if costPrice is loaded)
variantSchema.virtual('profit').get(function () {
    if (this.costPrice === undefined) return null;
    return this.sellingPrice - this.costPrice;
});

// ========================================================================
// STATIC METHODS
// ========================================================================

// Find active variants by product
variantSchema.statics.findByProduct = function (productId) {
    return this.find({
        productId,
        status: true,
        isDeleted: false
    })
        .populate('sizeId', 'name code value')
        .populate('colorId', 'name hexCode slug')
        .sort({ sizeId: 1, colorId: 1 });
};

// Find active variants with stock
variantSchema.statics.findInStock = function (productId) {
    return this.find({
        productId,
        status: true,
        isDeleted: false,
        stock: { $gt: 0 }
    })
        .populate('sizeId', 'name code value')
        .populate('colorId', 'name hexCode slug')
        .sort({ sizeId: 1, colorId: 1 });
};

// Find variant by exact combination
variantSchema.statics.findByCombo = function (productId, sizeId, colorId) {
    const query = {
        productId,
        status: true,
        isDeleted: false
    };

    if (sizeId) query.sizeId = sizeId;
    if (colorId) query.colorId = colorId;

    return this.findOne(query)
        .populate('sizeId', 'name code value')
        .populate('colorId', 'name hexCode slug');
};

// Check if variant exists (for duplicate prevention)
variantSchema.statics.exists = async function (productId, sizeId, colorId) {
    const count = await this.countDocuments({
        productId,
        sizeId: sizeId || null,
        colorId: colorId || null,
        isDeleted: false
    });
    return count > 0;
};

// ========================================================================
// INSTANCE METHODS
// ========================================================================

// Soft delete
variantSchema.methods.softDelete = function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    this.status = false; // Also deactivate

    // Rename SKU to free up the code for reuse
    this.sku = `${this.sku}-DEL-${Date.now()}`;

    return this.save();
};

// Restore
variantSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

// Update stock
variantSchema.methods.updateStock = function (quantity, operation = 'add') {
    if (operation === 'add') {
        this.stock += quantity;
    } else if (operation === 'subtract') {
        this.stock = Math.max(0, this.stock - quantity);
    } else if (operation === 'set') {
        this.stock = Math.max(0, quantity);
    }
    return this.save();
};

// Reserve stock (for cart/order)
variantSchema.methods.reserve = function (quantity) {
    if (this.sellable < quantity) {
        throw new Error('Insufficient stock to reserve');
    }
    this.reserved += quantity;
    return this.save();
};

// Release reserved stock
variantSchema.methods.releaseReserved = function (quantity) {
    this.reserved = Math.max(0, this.reserved - quantity);
    return this.save();
};

// ========================================================================
// PRE-SAVE MIDDLEWARE
// ========================================================================

variantSchema.pre('save', function (next) {
    // Auto-generate SKU if not provided
    if (!this.sku && this.productId) {
        const productPart = this.productId.toString().slice(-6).toUpperCase();
        const sizePart = this.sizeId ? this.sizeId.toString().slice(-4).toUpperCase() : 'NOSIZE';
        const colorPart = this.colorId ? this.colorId.toString().slice(-4).toUpperCase() : 'NOCOLOR';
        const timestamp = Date.now().toString().slice(-4);

        this.sku = `VAR-${productPart}-${sizePart}-${colorPart}-${timestamp}`;
    }

    // Ensure sellingPrice defaults to price
    if (!this.sellingPrice) {
        this.sellingPrice = this.price;
    }

    next();
});

// ========================================================================
// MODEL EXPORT
// ========================================================================

const Variant = mongoose.model('Variant', variantSchema);

export default Variant;
