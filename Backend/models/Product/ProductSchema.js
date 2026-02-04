import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  // ====================================================================
  // 1. CORE IDENTITY
  // ====================================================================
  name: {
    type: String,
    required: [true, "Product Name is required"],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
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
    required: [true, "SKU is required"],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },

  productCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    index: true
    // Auto-generated: PROD-YYYY-NNNNNN
  },

  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
    // UPC / EAN / ISBN
  },

  hsnCode: {
    type: String,
    trim: true,
    index: true
    // HSN / SAC Code for GST
  },

  // ====================================================================
  // 2. RELATIONSHIPS
  // ====================================================================
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, "Category is required"],
    index: true
  },

  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
    // Multi-select categories
  }],

  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, "Brand is required"],
    index: true
  },

  manufacturer: {
    type: String,
    trim: true
    // Can be different from brand
  },

  productType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductType",
    default: null
  },

  // ====================================================================
  // 3. DESCRIPTIONS
  // ====================================================================
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters'],
    trim: true,
    default: ""
    // For listing pages, search results
  },

  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
    default: ""
    // Long description for PDP (supports HTML)
  },

  keyFeatures: [{
    type: String,
    maxlength: [200, 'Feature cannot exceed 200 characters']
    // Bullet points
  }],

  technicalSpecifications: [{
    key: { type: String, required: true },
    value: { type: String, required: true },
    group: { type: String, default: "General" },
    unit: { type: String },
    searchable: { type: Boolean, default: true }
  }],

  // ====================================================================
  // 4. PRICING (Reference Only)
  // ====================================================================
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
    // Selling Price / Default Price
  },

  basePrice: {
    type: Number,
    default: 0,
    min: 0
    // MRP / Compare At Price
  },

  costPrice: {
    type: Number,
    min: 0,
    default: 0
    // For margin calculation
  },

  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
    // Discount percentage
  },

  discountPrice: {
    type: Number,
    default: 0,
    min: 0
    // Final price after discount
  },

  dateStart: { type: Date },
  dateEnd: { type: Date },

  taxClass: {
    type: String,
    default: "standard",
    enum: ['standard', 'reduced', 'zero', 'exempt']
  },

  tax: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
    // GST percentage
  },

  // ====================================================================
  // 5. MEDIA (ENHANCED)
  // ====================================================================
  featuredImage: {
    url: { type: String, default: "" },
    alt: { type: String, default: "" },
    title: { type: String, default: "" }
    // Primary product image
  },

  // Legacy support (will be migrated to featuredImage)
  image: {
    type: String,
    default: ""
  },

  gallery: [{
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    title: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 }
  }],

  videos: [{
    url: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    title: { type: String, default: "" },
    platform: {
      type: String,
      enum: ['youtube', 'vimeo', 'custom'],
      default: 'youtube'
    }
  }],

  // ====================================================================
  // 6. PHYSICAL ATTRIBUTES
  // ====================================================================
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { type: String, enum: ['cm', 'inch', 'm'], default: 'cm' }
  },

  weight: {
    value: { type: Number, min: 0 },
    unit: { type: String, enum: ['kg', 'g', 'lb'], default: 'kg' }
  },

  material: [{
    type: String,
    trim: true
  }],

  // ====================================================================
  // 7. SEO (ENHANCED)
  // ====================================================================
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title should not exceed 60 characters'],
      default: ""
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description should not exceed 160 characters'],
      default: ""
    },
    metaKeywords: [{
      type: String,
      trim: true
    }],
    canonicalUrl: {
      type: String,
      trim: true,
      default: ""
    },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterCard: {
      type: String,
      enum: ['summary', 'summary_large_image'],
      default: 'summary_large_image'
    }
  },

  // Legacy SEO fields (for backward compatibility)
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  metaKeywords: { type: String, default: "" },
  seoUrl: { type: String, default: "" },

  searchKeywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // ====================================================================
  // 8. MARKETING & VISIBILITY
  // ====================================================================
  badges: [{
    type: String,
    enum: ['new', 'sale', 'bestseller', 'featured', 'limited', 'exclusive', 'trending']
  }],

  featured: {
    type: Boolean,
    default: false,
    index: true
  },

  isFeatured: {
    type: Boolean,
    default: false,
    index: true
    // Alias for featured
  },

  displayPriority: {
    type: Number,
    default: 0,
    min: 0
    // Higher = shown first
  },

  visibility: {
    website: { type: Boolean, default: true },
    mobileApp: { type: Boolean, default: true },
    pos: { type: Boolean, default: false },
    marketplace: { type: Boolean, default: false }
  },

  // ====================================================================
  // 9. PUBLISHING & LIFECYCLE
  // ====================================================================
  publishStatus: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft',
    index: true
  },

  publishDate: {
    type: Date,
    index: true
  },

  unpublishDate: {
    type: Date
  },

  // ====================================================================
  // 10. VARIANT CONFIGURATION
  // ====================================================================
  hasVariants: {
    type: Boolean,
    default: true,
    index: true
  },

  variantType: {
    type: String,
    enum: ['SINGLE_COLOR', 'COLORWAY', 'CUSTOM'],
    default: 'SINGLE_COLOR'
  },

  // Legacy fields (kept for compatibility)
  minStock: { type: Number, default: 5 },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'pre_order'],
    default: 'in_stock'
  },

  // ====================================================================
  // 11. CLASSIFICATION
  // ====================================================================
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  department: {
    type: String,
    enum: ['mens', 'womens', 'kids', 'unisex', 'home', 'electronics', 'other']
  },

  // ====================================================================
  // 12. DYNAMIC ATTRIBUTES
  // ====================================================================
  attributes: [{
    key: { type: String, required: true },
    value: { type: String, required: true },
    group: { type: String, default: "Specifications" },
    searchable: { type: Boolean, default: true }
  }],

  // ====================================================================
  // 13. SYSTEM & STATUS
  // ====================================================================
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived', 'discontinued'],
    default: 'draft',
    index: true
  },

  // ====================================================================
  // 14. SOFT DELETE & AUDIT
  // ====================================================================
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

  createdBy: {
    type: String,
    default: "admin"
    // TODO: Change to ObjectId ref User
  },

  updatedBy: {
    type: String,
    default: "admin"
    // TODO: Change to ObjectId ref User
  },

  // ====================================================================
  // 15. VERSIONING
  // ====================================================================
  version: {
    type: Number,
    default: 1,
    min: 1
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ====================================================================
// INDEXES
// ====================================================================
productSchema.index({ slug: 1, isDeleted: 1 });
productSchema.index({ productCode: 1, isDeleted: 1 });
productSchema.index({ barcode: 1, isDeleted: 1 });
productSchema.index({ brand: 1, category: 1, status: 1 });
productSchema.index({ status: 1, publishStatus: 1, isDeleted: 1 });
productSchema.index({ featured: 1, displayPriority: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });

// Text index for search
productSchema.index({
  name: 'text',
  shortDescription: 'text',
  description: 'text',
  'seo.metaTitle': 'text',
  'seo.metaDescription': 'text'
});

// ====================================================================
// VIRTUALS
// ====================================================================
productSchema.virtual('variants', {
  ref: 'Variant',
  localField: '_id',
  foreignField: 'productId'
});

productSchema.virtual('variantCount', {
  ref: 'Variant',
  localField: '_id',
  foreignField: 'productId',
  count: true
});

// ====================================================================
// MIDDLEWARE
// ====================================================================
productSchema.pre('save', async function () {
  // Auto-generate slug
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });

    // Ensure uniqueness
    const existing = await this.constructor.findOne({
      slug: this.slug,
      _id: { $ne: this._id }
    });

    if (existing) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }

  // Auto-generate product code if not provided
  if (!this.productCode && this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.productCode = `PROD-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate discount price
  if (this.discount > 0 && this.basePrice > 0) {
    this.discountPrice = this.basePrice * (1 - this.discount / 100);
  } else {
    this.discountPrice = this.price;
  }

  // Sync legacy image field with featuredImage
  if (this.isModified('image') && this.image && !this.featuredImage.url) {
    this.featuredImage.url = this.image;
  }

  // Sync legacy SEO fields with seo object
  if (this.isModified('metaTitle') && this.metaTitle && !this.seo.metaTitle) {
    this.seo.metaTitle = this.metaTitle;
  }
  if (this.isModified('metaDescription') && this.metaDescription && !this.seo.metaDescription) {
    this.seo.metaDescription = this.metaDescription;
  }

  // Sync featured fields
  if (this.isModified('featured')) {
    this.isFeatured = this.featured;
  }

  // Increment version on update
  if (!this.isNew) {
    this.version += 1;
  }
});

// ====================================================================
// STATIC METHODS
// ====================================================================
productSchema.statics.findActive = function () {
  return this.find({
    status: 'active',
    publishStatus: 'published',
    isDeleted: false
  });
};

productSchema.statics.findByCategory = function (categoryId) {
  return this.find({
    $or: [
      { category: categoryId },
      { subCategories: categoryId }
    ],
    status: 'active',
    isDeleted: false
  });
};

productSchema.statics.findByBrand = function (brandId) {
  return this.find({
    brand: brandId,
    status: 'active',
    isDeleted: false
  });
};

productSchema.statics.search = function (query) {
  return this.find({
    $text: { $search: query },
    status: 'active',
    publishStatus: 'published',
    isDeleted: false
  }).sort({ score: { $meta: 'textScore' } });
};

// ====================================================================
// INSTANCE METHODS
// ====================================================================
productSchema.methods.softDelete = function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'archived';
  return this.save();
};

productSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

productSchema.methods.publish = function () {
  this.publishStatus = 'published';
  this.publishDate = new Date();
  this.status = 'active';
  return this.save();
};

productSchema.methods.unpublish = function () {
  this.publishStatus = 'draft';
  this.unpublishDate = new Date();
  return this.save();
};

export default mongoose.model('Product', productSchema);