import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        index: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true
    },
    sku: {
        type: String,
        unique: true,
        required: [true, 'SKU is required'],
        uppercase: true,
        trim: true,
        index: true
    },
    description: {
        type: String
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required'],
        index: true
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId, // Or String depending on implementation
        ref: 'Category'
    }],
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: [true, 'Brand is required'],
        index: true
    },
    productType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductType'
    },

    // Pricing
    price: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountPrice: { type: Number, default: 0 },
    tax: { type: Number, default: 18 },

    // Configuration
    hasVariants: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false }, // Duplicate for compatibility
    displayPriority: { type: Number, default: 0 },
    version: { type: Number, default: 1 },

    // Details (Arrays/Objects)
    keyFeatures: [String],
    technicalSpecifications: [{ label: String, value: String }],
    badges: [String],
    tags: [String],
    searchKeywords: [String],
    material: [String],
    attributes: [mongoose.Schema.Types.Mixed], // Flexible attributes

    // Media
    image: { type: String }, // Primary image
    featuredImage: { type: String },
    gallery: [{
        url: String,
        alt: String,
        sortOrder: { type: Number, default: 0 }
    }],
    videos: [{
        url: String,
        provider: String, // youtube, vimeo
        thumbnail: String
    }],

    // SEO
    seo: {
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String],
        canonicalUrl: String
    },

    // Dimensions & Weight
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: { type: String, default: 'cm' }
    },
    weight: {
        value: Number,
        unit: { type: String, default: 'kg' }
    },

    // Status & Visibility
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft', 'archived', 'discontinued'],
        default: 'draft',
        index: true
    },
    publishStatus: {
        type: String,
        enum: ['draft', 'published', 'scheduled', 'archived'],
        default: 'draft',
        index: true
    },
    publishDate: Date,
    visibility: {
        customer: { type: Boolean, default: true },
        admin: { type: Boolean, default: true },
        api: { type: Boolean, default: true }
    },

    // Audit
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: String,
    createdBy: String, // 'admin' or userId
    updatedBy: String

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware: Auto-generate slug
productSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// Virtual: Variant Count
productSchema.virtual('variantCount', {
    ref: 'Variant',
    localField: '_id',
    foreignField: 'product',
    count: true
});

// Instance Methods
productSchema.methods.softDelete = async function (performedBy = 'SYSTEM') {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = performedBy;
    this.status = 'archived';
    return this.save();
};

productSchema.methods.publish = async function () {
    this.publishStatus = 'published';
    this.publishDate = new Date();
    // If status was draft, maybe move to active?
    if (this.status === 'draft') this.status = 'active';
    return this.save();
};

productSchema.methods.unpublish = async function () {
    this.publishStatus = 'draft';
    // this.publishDate = null; // Maybe keep history?
    return this.save();
};

productSchema.methods.duplicate = async function () {
    const obj = this.toObject();
    delete obj._id;
    delete obj.id;
    delete obj.createdAt;
    delete obj.updatedAt;
    delete obj.slug; // Regenerate
    delete obj.sku;  // Must be unique
    delete obj.__v;

    // Modify name/sku
    obj.name = `${obj.name} (Copy)`;
    obj.sku = `${obj.sku}-COPY-${Date.now()}`;
    obj.publishStatus = 'draft';
    obj.status = 'draft';

    return new this.constructor(obj);
};

const Product = mongoose.model('Product', productSchema);

export default Product;
