import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
    // Product Reference
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },

    // Dynamic Attributes (Unified System)
    attributes: [{
        attributeType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AttributeType',
            required: true
        },
        attributeValue: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AttributeValue',
            required: true
        }
    }],

    // SKU & Identification
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true
    },

    barcode: String,

    // Pricing
    price: {
        type: Number,
        required: true,
        min: 0
    },

    compareAtPrice: Number,
    costPrice: Number,

    // Stock (if not using InventoryMaster)
    stock: {
        type: Number,
        default: 0,
        min: 0
    },

    // Images
    images: [{
        url: String,
        alt: String,
        isPrimary: Boolean
    }],

    // Weight & Dimensions
    weight: Number,
    weightUnit: {
        type: String,
        enum: ['kg', 'g', 'lb', 'oz'],
        default: 'kg'
    },

    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'm', 'in', 'ft'],
            default: 'cm'
        }
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    },

    isDeleted: {
        type: Boolean,
        default: false
    },

    deletedAt: Date,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound Indexes
variantSchema.index({ product: 1, isDeleted: 1 });
variantSchema.index({ product: 1, status: 1 });
variantSchema.index({ sku: 1, isDeleted: 1 });

// Ensure unique attribute combinations per product
// Index for searching variants by attributes
variantSchema.index({
    product: 1,
    'attributes.attributeType': 1,
    'attributes.attributeValue': 1
});

// A unique index for the combination of attributes should be handled by application logic
// or by storing a sorted string hash of attribute values.

// Virtual for display name
variantSchema.virtual('displayName').get(function () {
    return `${this.product?.name || 'Product'} - ${this.sku}`;
});

// Static methods
variantSchema.statics.findByProduct = function (productId) {
    return this.find({ product: productId, isDeleted: false })
        .populate('attributes.attributeType')
        .populate('attributes.attributeValue');
};

variantSchema.statics.findByAttribute = function (productId, attributeTypeId, attributeValueId) {
    return this.find({
        product: productId,
        'attributes.attributeType': attributeTypeId,
        'attributes.attributeValue': attributeValueId,
        isDeleted: false
    });
};

// Instance method to get attribute value by type
variantSchema.methods.getAttributeValue = function (attributeTypeName) {
    const attr = this.attributes.find(a =>
        a.attributeType?.name === attributeTypeName ||
        a.attributeType?.slug === attributeTypeName
    );
    return attr?.attributeValue;
};

const UnifiedVariant = mongoose.models.UnifiedVariant || mongoose.model('UnifiedVariant', variantSchema);
export default UnifiedVariant;
