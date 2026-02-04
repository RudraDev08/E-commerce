# 🏗️ Production-Grade E-commerce Product Management System
## Complete Architecture & Implementation Guide

**Version:** 2.0  
**Date:** February 4, 2026  
**Architecture Type:** Marketplace-Ready, Scalable, SEO-Optimized  
**Separation of Concerns:** ✅ Strict (Inventory Completely Separate)

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Module 1: Product Master](#module-1-product-master)
4. [Module 2: Variant Master](#module-2-variant-master)
5. [Module 3: Size Master](#module-3-size-master)
6. [Module 4: Color Master](#module-4-color-master)
7. [Module 5: Category Master](#module-5-category-master)
8. [Module 6: Brand Master](#module-6-brand-master)
9. [Module 7: Product Type Master](#module-7-product-type-master)
10. [Database Schema Design](#database-schema-design)
11. [API Endpoints](#api-endpoints)
12. [Frontend Components](#frontend-components)
13. [Business Logic & Workflows](#business-logic--workflows)
14. [Integration Points](#integration-points)
15. [Performance & Scalability](#performance--scalability)
16. [Security & Validation](#security--validation)
17. [Testing Strategy](#testing-strategy)

---

## 🎯 System Overview

### What This System Does:
- **Product Master**: Defines WHAT a product is (identity, description, pricing, media)
- **Variant Master**: Defines HOW a product is sold (size + color combinations)
- **Size Master**: Global size library (reusable across products)
- **Color Master**: Global color library (reusable across products)
- **Category Master**: Product classification and organization
- **Brand Master**: Brand information and relationships
- **Product Type Master**: Attribute templates for products

### What This System Does NOT Do:
- ❌ **Inventory Management** (separate module handles stock, warehouses, movements)
- ❌ **Order Processing** (separate module)
- ❌ **Pricing Rules Engine** (basic pricing only, advanced rules separate)
- ❌ **Shipping Calculations** (configuration only, not execution)

---

## 🏛️ Architecture Principles

### 1. **Separation of Concerns**
```
Product System (WHAT & HOW)          Inventory System (HOW MUCH)
├── Product Master                   ├── Inventory Ledger
├── Variant Master                   ├── Stock Movements
├── Size Master                      ├── Warehouse Management
├── Color Master                     ├── Reorder Levels
├── Category Master                  └── Stock Valuation
├── Brand Master                     
└── Product Type Master              
```

### 2. **Data Flow**
```
1. Create Product → 2. Create Variants → 3. Inventory Auto-Created
   (Product Master)    (Variant Builder)     (Inventory Module)
```

### 3. **Scalability Targets**
- **Products**: 1M+ products
- **Variants**: 10M+ variants
- **Categories**: 10K+ categories
- **Concurrent Users**: 10K+
- **API Response Time**: <200ms (p95)

### 4. **SEO & Marketplace Readiness**
- Unique slugs for all entities
- Rich meta data support
- Schema.org markup ready
- Multi-language support
- Multi-currency support

---

## 📦 Module 1: Product Master

### Purpose
Defines the **core identity** of a product. This is the parent entity that contains all information about WHAT the product is, not how much stock exists.

### MongoDB Schema

```javascript
const productSchema = new mongoose.Schema({
  // ====================================================================
  // 1. CORE IDENTITY
  // ====================================================================
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
    index: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
    // Auto-generated from name
    // Example: "nike-air-max-90"
  },
  
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
    // Internal reference code
    // Example: "PROD-2024-001"
  },
  
  globalSKU: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
    // Parent-level SKU (optional)
    // Example: "NIKE-AM90"
  },
  
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
    // UPC / EAN / ISBN
    // Example: "012345678905"
  },
  
  hsnCode: {
    type: String,
    trim: true,
    index: true
    // HSN / SAC Code for GST
    // Example: "6403"
  },

  // ====================================================================
  // 2. RELATIONSHIPS
  // ====================================================================
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Brand is required'],
    index: true
  },
  
  manufacturer: {
    type: String,
    trim: true
    // Can be different from brand
    // Example: "Foxconn" for Apple products
  },
  
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    index: true
  },
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Primary category is required'],
    index: true
  },
  
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
    // Multi-select, no tree enforcement
  }],
  
  productType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductType'
    // Links to attribute template
  },

  // ====================================================================
  // 3. PRODUCT TYPE & STATUS
  // ====================================================================
  type: {
    type: String,
    enum: ['simple', 'variable', 'grouped', 'digital', 'service'],
    default: 'variable',
    required: true,
    index: true
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'draft', 'archived'],
    default: 'draft',
    required: true,
    index: true
  },

  // ====================================================================
  // 4. CLASSIFICATION & ORGANIZATION
  // ====================================================================
  tags: [{
    type: String,
    trim: true,
    lowercase: true
    // Example: ["summer", "casual", "trending"]
  }],
  
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
    // Example: "Summer 2024", "Best Sellers"
  }],
  
  department: {
    type: String,
    enum: ['mens', 'womens', 'kids', 'unisex', 'home', 'electronics', 'other'],
    index: true
  },
  
  occasion: [{
    type: String,
    enum: ['casual', 'formal', 'sports', 'party', 'wedding', 'work', 'travel']
  }],

  // ====================================================================
  // 5. DESCRIPTIONS
  // ====================================================================
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters'],
    trim: true
    // For listing pages, search results
  },
  
  longDescription: {
    type: String,
    maxlength: [5000, 'Long description cannot exceed 5000 characters']
    // For product detail page (PDP)
    // Supports HTML/Markdown
  },
  
  keyFeatures: [{
    type: String,
    maxlength: [200, 'Feature cannot exceed 200 characters']
    // Bullet points
    // Example: "Breathable mesh upper", "Air Max cushioning"
  }],
  
  technicalSpecifications: [{
    key: { type: String, required: true },
    value: { type: String, required: true },
    group: { type: String, default: 'General' },
    unit: { type: String },
    searchable: { type: Boolean, default: true }
    // Example: { key: "Weight", value: "300", unit: "grams" }
  }],
  
  usageInstructions: {
    type: String,
    maxlength: [2000, 'Usage instructions cannot exceed 2000 characters']
  },
  
  warrantyDetails: {
    duration: { type: Number }, // in months
    type: { type: String, enum: ['manufacturer', 'seller', 'extended'] },
    description: { type: String }
  },
  
  careInstructions: {
    type: String,
    maxlength: [1000, 'Care instructions cannot exceed 1000 characters']
  },
  
  legalNotes: {
    type: String,
    maxlength: [1000, 'Legal notes cannot exceed 1000 characters']
    // Compliance, warnings, disclaimers
  },

  // ====================================================================
  // 6. PRICING (REFERENCE ONLY - NOT FINAL SELL PRICE)
  // ====================================================================
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative'],
    default: 0
    // MRP / Compare At Price
  },
  
  defaultSellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative'],
    default: 0
    // Fallback if variant doesn't override
  },
  
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    default: 0
    // For margin calculation
  },
  
  discount: {
    type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    value: { type: Number, min: 0, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  
  taxClass: {
    type: String,
    enum: ['standard', 'reduced', 'zero', 'exempt'],
    default: 'standard'
  },
  
  gstRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 18
    // GST percentage
  },
  
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  
  priceValidity: {
    startDate: { type: Date },
    endDate: { type: Date }
  },
  
  tierPricing: [{
    minQuantity: { type: Number, required: true, min: 1 },
    maxQuantity: { type: Number },
    price: { type: Number, required: true, min: 0 }
    // Quantity-based pricing
  }],
  
  customerGroupPricing: [{
    group: { type: String, enum: ['b2b', 'b2c', 'wholesale', 'retail'], required: true },
    price: { type: Number, required: true, min: 0 }
  }],

  // ====================================================================
  // 7. MEDIA & ASSETS
  // ====================================================================
  featuredImage: {
    url: { type: String, required: true },
    alt: { type: String },
    title: { type: String }
    // Primary product image
  },
  
  gallery: [{
    url: { type: String, required: true },
    alt: { type: String },
    title: { type: String },
    sortOrder: { type: Number, default: 0 }
  }],
  
  videos: [{
    url: { type: String, required: true },
    thumbnail: { type: String },
    title: { type: String },
    platform: { type: String, enum: ['youtube', 'vimeo', 'custom'] }
  }],
  
  images360: [{
    url: { type: String },
    frameCount: { type: Number }
  }],
  
  documents: [{
    type: { type: String, enum: ['brochure', 'manual', 'installation', 'certificate'] },
    url: { type: String, required: true },
    title: { type: String },
    fileSize: { type: Number } // in bytes
  }],

  // ====================================================================
  // 8. PHYSICAL ATTRIBUTES
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
  
  volume: {
    value: { type: Number, min: 0 },
    unit: { type: String, enum: ['ml', 'l', 'oz'], default: 'ml' }
  },
  
  packageDimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { type: String, enum: ['cm', 'inch', 'm'], default: 'cm' }
  },
  
  packageWeight: {
    value: { type: Number, min: 0 },
    unit: { type: String, enum: ['kg', 'g', 'lb'], default: 'kg' }
  },
  
  material: [{
    type: String,
    trim: true
    // Example: ["Cotton", "Polyester"]
  }],
  
  defaultColor: {
    type: String,
    trim: true
    // If product has a primary color
  },
  
  sizeChart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SizeChart'
  },

  // ====================================================================
  // 9. SEO & WEB
  // ====================================================================
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title should not exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description should not exceed 160 characters']
    },
    metaKeywords: [{
      type: String,
      trim: true
    }],
    canonicalUrl: {
      type: String,
      trim: true
    },
    ogTitle: { type: String },
    ogDescription: { type: String },
    ogImage: { type: String },
    twitterCard: { type: String, enum: ['summary', 'summary_large_image'] },
    schemaMarkup: {
      type: mongoose.Schema.Types.Mixed
      // JSON-LD for Product schema
    }
  },
  
  searchKeywords: [{
    type: String,
    trim: true,
    lowercase: true
    // Additional search terms
  }],

  // ====================================================================
  // 10. SHIPPING (CONFIGURATION ONLY)
  // ====================================================================
  shipping: {
    class: {
      type: String,
      enum: ['standard', 'express', 'heavy', 'fragile', 'perishable'],
      default: 'standard'
    },
    freeShippingEligible: {
      type: Boolean,
      default: false
    },
    isFragile: {
      type: Boolean,
      default: false
    },
    isHazardous: {
      type: Boolean,
      default: false
    },
    countryOfOrigin: {
      type: String,
      default: 'IN'
    },
    hsCode: {
      type: String
      // Harmonized System Code for customs
    },
    customsValue: {
      type: Number,
      min: 0
    }
  },

  // ====================================================================
  // 11. MARKETING & VISIBILITY
  // ====================================================================
  badges: [{
    type: String,
    enum: ['new', 'sale', 'bestseller', 'featured', 'limited', 'exclusive', 'trending']
  }],
  
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  dealEligibility: {
    flashSale: { type: Boolean, default: false },
    dailyDeal: { type: Boolean, default: false },
    clearance: { type: Boolean, default: false }
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
  // 12. PUBLISHING & LIFECYCLE
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
  
  targetAudience: {
    type: String,
    enum: ['b2b', 'b2c', 'both'],
    default: 'b2c',
    index: true
  },
  
  channelRestrictions: [{
    type: String,
    enum: ['website', 'app', 'pos', 'marketplace']
  }],
  
  geoRestrictions: {
    allowedCountries: [{ type: String }],
    blockedCountries: [{ type: String }],
    allowedStates: [{ type: String }],
    blockedStates: [{ type: String }]
  },
  
  launchDate: {
    type: Date
  },
  
  lifecycleStatus: {
    type: String,
    enum: ['new', 'active', 'mature', 'declining', 'discontinued'],
    default: 'new'
  },
  
  replacementProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
    // If discontinued, link to replacement
  },

  // ====================================================================
  // 13. REVIEWS & RATINGS
  // ====================================================================
  reviewSettings: {
    enableReviews: { type: Boolean, default: true },
    enableRatings: { type: Boolean, default: true },
    moderationRequired: { type: Boolean, default: true },
    verifiedPurchaseOnly: { type: Boolean, default: false }
  },
  
  ratingStats: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
    distribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },

  // ====================================================================
  // 14. VARIANT CONFIGURATION
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
    // SINGLE_COLOR: One color per variant
    // COLORWAY: Multiple colors per variant (e.g., sneakers)
    // CUSTOM: Custom variant logic
  },
  
  variantAttributes: [{
    type: String,
    enum: ['size', 'color', 'material', 'style', 'storage', 'ram']
    // Which attributes create variants
  }],

  // ====================================================================
  // 15. SOFT DELETE & AUDIT
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
    ref: 'User'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: {
    type: Date
  },

  // ====================================================================
  // 16. VERSIONING & HISTORY
  // ====================================================================
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  
  changeHistory: [{
    version: { type: Number },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    changes: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String }
  }]

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
productSchema.index({ isFeatured: 1, displayPriority: -1 });
productSchema.index({ 'seo.metaTitle': 'text', 'seo.metaDescription': 'text' });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });

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
productSchema.pre('save', async function(next) {
  // Auto-generate slug
  if (this.isModified('name') || !this.slug) {
    const slugify = (await import('slugify')).default;
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
  if (!this.productCode) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.productCode = `PROD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate discount price
  if (this.discount && this.discount.value > 0) {
    if (this.discount.type === 'percentage') {
      this.defaultSellingPrice = this.basePrice * (1 - this.discount.value / 100);
    } else {
      this.defaultSellingPrice = this.basePrice - this.discount.value;
    }
  }
  
  // Increment version on update
  if (!this.isNew) {
    this.version += 1;
  }
  
  next();
});

// ====================================================================
// STATIC METHODS
// ====================================================================
productSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    publishStatus: 'published',
    isDeleted: false
  });
};

productSchema.statics.findByCategory = function(categoryId) {
  return this.find({
    $or: [
      { category: categoryId },
      { subCategories: categoryId }
    ],
    status: 'active',
    isDeleted: false
  });
};

productSchema.statics.findByBrand = function(brandId) {
  return this.find({
    brand: brandId,
    status: 'active',
    isDeleted: false
  });
};

productSchema.statics.search = function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { shortDescription: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      { searchKeywords: { $in: [new RegExp(query, 'i')] } }
    ],
    status: 'active',
    publishStatus: 'published',
    isDeleted: false
  });
};

// ====================================================================
// INSTANCE METHODS
// ====================================================================
productSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'archived';
  return this.save();
};

productSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

productSchema.methods.publish = function() {
  this.publishStatus = 'published';
  this.publishDate = new Date();
  this.status = 'active';
  return this.save();
};

productSchema.methods.unpublish = function() {
  this.publishStatus = 'draft';
  this.unpublishDate = new Date();
  return this.save();
};

productSchema.methods.duplicate = async function() {
  const duplicate = this.toObject();
  delete duplicate._id;
  delete duplicate.createdAt;
  delete duplicate.updatedAt;
  duplicate.name = `${duplicate.name} (Copy)`;
  duplicate.slug = null; // Will be auto-generated
  duplicate.productCode = null; // Will be auto-generated
  duplicate.status = 'draft';
  duplicate.publishStatus = 'draft';
  
  const Product = this.constructor;
  return new Product(duplicate);
};

export default mongoose.model('Product', productSchema);
```

---

## 🎨 Module 2: Variant Master

### Purpose
Defines **HOW a product is sold** by combining Product + Size + Color. Each variant is a unique sellable SKU.

### Key Concepts
- **Formula**: `Product + Size + Color = Unique Variant`
- **Compound Unique Index**: Prevents duplicate variants
- **Pricing Override**: Variants can override product pricing
- **Media Override**: Variants can have specific images

### MongoDB Schema

```javascript
const variantSchema = new mongoose.Schema({
  // ====================================================================
  // 1. CORE IDENTITY (Required)
  // ====================================================================
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  
  sizeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Size',
    required: [true, 'Size ID is required'],
    index: true
  },
  
  colorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Color',
    required: [true, 'Color ID is required'],
    index: true
  },

  // ====================================================================
  // 2. COLORWAY STRATEGY (For multi-color variants)
  // ====================================================================
  colorwayName: {
    type: String,
    trim: true
    // Example: "Chicago", "Panda", "Triple Black"
    // Used for sneakers, limited editions
  },
  
  colorParts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Color'
    // For multi-color variants
    // Example: [Red, White, Black] for "Chicago" colorway
  }],

  // ====================================================================
  // 3. SKU & IDENTIFICATION
  // ====================================================================
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
    // Format: PROD-{productCode}-SIZE-{sizeCode}-COLOR-{colorCode}
    // Example: "PROD-2024-001-SIZE-XL-COLOR-RED"
  },
  
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
    // Variant-specific barcode (if different from product)
  },

  // ====================================================================
  // 4. PRICING (Overrides Product Pricing)
  // ====================================================================
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
    // MRP / Base Price
  },
  
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative'],
    default: function() {
      return this.price;
    }
    // Actual selling price (can be less than price)
  },
  
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative']
    // For showing discounts
  },
  
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    default: 0
    // For margin calculation
  },
  
  discount: {
    type: { type: String, enum: ['percentage', 'flat'] },
    value: { type: Number, min: 0 }
  },
  
  taxOverride: {
    enabled: { type: Boolean, default: false },
    rate: { type: Number, min: 0, max: 100 }
    // Override product tax rate if needed
  },

  // ====================================================================
  // 5. MEDIA (Variant-specific)
  // ====================================================================
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    sortOrder: { type: Number, default: 0 },
    isColorSpecific: { type: Boolean, default: true }
  }],
  
  video: {
    url: { type: String },
    thumbnail: { type: String }
  },

  // ====================================================================
  // 6. VARIANT FLAGS
  // ====================================================================
  isDefault: {
    type: Boolean,
    default: false
    // Default variant to show on PDP
  },
  
  isFeatured: {
    type: Boolean,
    default: false
    // Featured variant (bestseller for this product)
  },
  
  isBestseller: {
    type: Boolean,
    default: false
  },
  
  isLimitedEdition: {
    type: Boolean,
    default: false
  },

  // ====================================================================
  // 7. VARIANT STATUS
  // ====================================================================
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
    index: true
  },
  
  availableForSale: {
    type: Boolean,
    default: true,
    index: true
  },
  
  preOrder: {
    enabled: { type: Boolean, default: false },
    releaseDate: { type: Date },
    maxQuantity: { type: Number }
  },

  // ====================================================================
  // 8. ATTRIBUTES (Additional variant-specific attributes)
  // ====================================================================
  attributes: {
    type: mongoose.Schema.Types.Mixed
    // Flexible storage for variant-specific attributes
    // Example: { fit: "slim", material: "cotton-blend" }
  },

  // ====================================================================
  // 9. SOFT DELETE & AUDIT
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
    ref: 'User'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// ====================================================================
// COMPOUND UNIQUE INDEX (Prevents Duplicates)
// ====================================================================
variantSchema.index(
  { productId: 1, sizeId: 1, colorId: 1 },
  { unique: true, name: 'unique_variant_combo' }
);

// ====================================================================
// ADDITIONAL INDEXES
// ====================================================================
variantSchema.index({ sku: 1, isDeleted: 1 });
variantSchema.index({ productId: 1, status: 1, isDeleted: 1 });
variantSchema.index({ barcode: 1 }, { sparse: true });
variantSchema.index({ isDefault: 1, productId: 1 });

// ====================================================================
// VIRTUALS
// ====================================================================
variantSchema.virtual('inventory', {
  ref: 'InventoryLedger',
  localField: '_id',
  foreignField: 'variantId',
  justOne: true
});

variantSchema.virtual('profit').get(function() {
  return this.sellingPrice - this.costPrice;
});

variantSchema.virtual('profitMargin').get(function() {
  if (this.sellingPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100;
});

// ====================================================================
// MIDDLEWARE
// ====================================================================
variantSchema.pre('save', async function(next) {
  // Auto-generate SKU if not provided
  if (!this.sku) {
    const product = await mongoose.model('Product').findById(this.productId);
    const size = await mongoose.model('Size').findById(this.sizeId);
    const color = await mongoose.model('Color').findById(this.colorId);
    
    if (product && size && color) {
      this.sku = `${product.productCode}-${size.code}-${color.slug.toUpperCase()}`;
    }
  }
  
  // Calculate selling price if discount is applied
  if (this.discount && this.discount.value > 0) {
    if (this.discount.type === 'percentage') {
      this.sellingPrice = this.price * (1 - this.discount.value / 100);
    } else {
      this.sellingPrice = this.price - this.discount.value;
    }
  }
  
  next();
});

// ====================================================================
// STATIC METHODS
// ====================================================================
variantSchema.statics.findByProduct = function(productId) {
  return this.find({
    productId,
    isDeleted: false,
    status: 'active'
  }).populate('sizeId colorId');
};

variantSchema.statics.findByCombo = function(productId, sizeId, colorId) {
  return this.findOne({
    productId,
    sizeId,
    colorId,
    isDeleted: false
  });
};

variantSchema.statics.exists = async function(productId, sizeId, colorId) {
  const count = await this.countDocuments({
    productId,
    sizeId,
    colorId,
    isDeleted: false
  });
  return count > 0;
};

// ====================================================================
// INSTANCE METHODS
// ====================================================================
variantSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'inactive';
  return this.save();
};

variantSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

export default mongoose.model('Variant', variantSchema);
```

---

## 📏 Module 3: Size Master

### Purpose
Global, reusable size library that can be used across multiple products and categories.

### Key Features
- **Category-Specific**: Sizes can be linked to specific categories
- **Sortable**: Priority field for custom ordering
- **Reusable**: One size can be used by many products
- **Soft Delete**: Can be disabled without deleting

### MongoDB Schema

```javascript
const sizeSchema = new mongoose.Schema({
  // ====================================================================
  // 1. CORE IDENTITY
  // ====================================================================
  name: {
    type: String,
    required: [true, 'Size name is required'],
    trim: true,
    maxlength: [50, 'Size name cannot exceed 50 characters']
    // Example: "Small", "Medium", "Large", "XL", "32", "42"
  },
  
  slug: {
    type: String,
    required: [true, 'Size slug is required'],
    unique: true,
    lowercase: true,
    index: true
    // Auto-generated from name
    // Example: "small", "xl", "32"
  },
  
  code: {
    type: String,
    required: [true, 'Size code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [50, 'Size code cannot exceed 50 characters'],
    index: true
    // Example: "S", "M", "L", "XL", "32", "42"
  },
  
  value: {
    type: String,
    trim: true,
    maxlength: [50, 'Size value cannot exceed 50 characters']
    // Numeric value if applicable
    // Example: "32" for waist size, "42" for shoe size
  },

  // ====================================================================
  // 2. CLASSIFICATION
  // ====================================================================
  sizeGroup: {
    type: String,
    enum: [
      'apparel',
      'footwear',
      'accessories',
      'electronics',
      'furniture',
      'custom'
    ],
    default: 'apparel',
    index: true
  },
  
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
    // Which categories can use this size
  }],
  
  measurementUnit: {
    type: String,
    enum: ['cm', 'inch', 'numeric', 'alpha', 'custom'],
    default: 'alpha'
    // Alpha: S, M, L, XL
    // Numeric: 32, 34, 36
    // CM/Inch: Actual measurements
  },

  // ====================================================================
  // 3. DISPLAY & ORDERING
  // ====================================================================
  priority: {
    type: Number,
    default: 0,
    min: 0
    // Lower number = shown first
    // Example: S=1, M=2, L=3, XL=4
  },
  
  displayOrder: {
    type: Number,
    default: 0
    // Alternative to priority for custom sorting
  },

  // ====================================================================
  // 4. SIZE CHART REFERENCE
  // ====================================================================
  sizeChart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SizeChart'
  },
  
  measurements: {
    chest: { type: Number },
    waist: { type: Number },
    hip: { type: Number },
    length: { type: Number },
    shoulder: { type: Number },
    sleeve: { type: Number },
    unit: { type: String, enum: ['cm', 'inch'], default: 'cm' }
  },

  // ====================================================================
  // 5. METADATA
  // ====================================================================
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },

  // ====================================================================
  // 6. SOFT DELETE & AUDIT
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
    ref: 'User'
  },
  
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

// ====================================================================
// INDEXES
// ====================================================================
sizeSchema.index({ code: 1, isDeleted: 1 });
sizeSchema.index({ status: 1, isDeleted: 1 });
sizeSchema.index({ priority: 1 });
sizeSchema.index({ sizeGroup: 1, status: 1 });

// ====================================================================
// VIRTUALS
// ====================================================================
sizeSchema.virtual('productCount', {
  ref: 'Variant',
  localField: '_id',
  foreignField: 'sizeId',
  count: true
});

// ====================================================================
// STATIC METHODS
// ====================================================================
sizeSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    isDeleted: false
  }).sort({ priority: 1, name: 1 });
};

sizeSchema.statics.findByCategory = function(categoryId) {
  return this.find({
    applicableCategories: categoryId,
    status: 'active',
    isDeleted: false
  }).sort({ priority: 1, name: 1 });
};

sizeSchema.statics.findByGroup = function(sizeGroup) {
  return this.find({
    sizeGroup,
    status: 'active',
    isDeleted: false
  }).sort({ priority: 1, name: 1 });
};

// ====================================================================
// INSTANCE METHODS
// ====================================================================
sizeSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  
  // Rename to allow reuse of code/slug
  const timestamp = Date.now();
  this.slug = `${this.slug}-deleted-${timestamp}`;
  this.code = `${this.code}-DEL-${timestamp.toString().slice(-4)}`;
  
  return this.save();
};

sizeSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

export default mongoose.model('Size', sizeSchema);
```

---

## 🎨 Module 4: Color Master

### Purpose
Global, reusable color library with hex codes, RGB values, and visual consistency across the platform.

### Key Features
- **Hex Code Required**: Every color must have a valid hex code
- **RGB Support**: Optional RGB values for advanced use
- **Pantone Support**: For print/physical products
- **Swatch Images**: Optional image overlay for textures
- **Color Families**: Group similar colors together

### MongoDB Schema

```javascript
const colorSchema = new mongoose.Schema({
  // ====================================================================
  // 1. CORE IDENTITY
  // ====================================================================
  name: {
    type: String,
    required: [true, 'Color name is required'],
    trim: true,
    maxlength: [50, 'Color name cannot exceed 50 characters']
    // Example: "Red", "Navy Blue", "Forest Green"
  },
  
  slug: {
    type: String,
    required: [true, 'Color slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
    // Auto-generated from name
    // Example: "red", "navy-blue", "forest-green"
  },
  
  code: {
    type: String,
    required: [true, 'Color code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
    // Short code for internal use
    // Example: "RED", "NAVY", "FGRN"
  },

  // ====================================================================
  // 2. COLOR VALUES
  // ====================================================================
  hexCode: {
    type: String,
    required: [true, 'Hex code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code'],
    index: true
    // Example: "#FF0000", "#001F3F", "#228B22"
  },
  
  rgbCode: {
    type: String,
    trim: true,
    match: [/^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/i, 'Please provide a valid RGB color code']
    // Example: "rgb(255, 0, 0)"
  },
  
  pantoneCode: {
    type: String,
    trim: true,
    uppercase: true
    // Example: "PANTONE 186 C"
    // For print/physical products
  },
  
  cmykCode: {
    type: String,
    trim: true
    // Example: "cmyk(0, 100, 100, 0)"
    // For print applications
  },

  // ====================================================================
  // 3. VISUAL REPRESENTATION
  // ====================================================================
  swatchImage: {
    type: String,
    default: null
    // URL to swatch image (for textures, patterns)
    // Example: Wood grain, marble pattern
  },
  
  isGradient: {
    type: Boolean,
    default: false
  },
  
  gradientColors: [{
    hexCode: { type: String },
    position: { type: Number, min: 0, max: 100 }
    // For gradient colors
  }],
  
  isDualTone: {
    type: Boolean,
    default: false
  },
  
  secondaryHexCode: {
    type: String,
    uppercase: true,
    trim: true,
    match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code']
    // For dual-tone colors
  },

  // ====================================================================
  // 4. CLASSIFICATION
  // ====================================================================
  colorFamily: {
    type: String,
    enum: [
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'purple',
      'pink',
      'brown',
      'black',
      'white',
      'gray',
      'multi'
    ],
    index: true
    // Group similar colors together
  },
  
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
    // Which categories can use this color
  }],

  // ====================================================================
  // 5. DISPLAY & ORDERING
  // ====================================================================
  priority: {
    type: Number,
    default: 0,
    min: 0
    // Lower number = shown first
  },
  
  displayOrder: {
    type: Number,
    default: 0
  },

  // ====================================================================
  // 6. SEO & NAMING
  // ====================================================================
  seoFriendlyName: {
    type: String,
    trim: true
    // SEO-optimized color name
    // Example: "vibrant-red" instead of "red-001"
  },
  
  alternativeNames: [{
    type: String,
    trim: true
    // Example: ["Crimson", "Scarlet", "Ruby Red"]
  }],

  // ====================================================================
  // 7. METADATA
  // ====================================================================
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },

  // ====================================================================
  // 8. SOFT DELETE & AUDIT
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
    ref: 'User'
  },
  
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

// ====================================================================
// INDEXES
// ====================================================================
colorSchema.index({ hexCode: 1, isDeleted: 1 });
colorSchema.index({ slug: 1, isDeleted: 1 });
colorSchema.index({ status: 1, isDeleted: 1 });
colorSchema.index({ priority: 1 });
colorSchema.index({ colorFamily: 1, status: 1 });

// ====================================================================
// VIRTUALS
// ====================================================================
colorSchema.virtual('productCount', {
  ref: 'Variant',
  localField: '_id',
  foreignField: 'colorId',
  count: true
});

// ====================================================================
// STATIC METHODS
// ====================================================================
colorSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    isDeleted: false
  }).sort({ priority: 1, name: 1 });
};

colorSchema.statics.findByCategory = function(categoryId) {
  return this.find({
    applicableCategories: categoryId,
    status: 'active',
    isDeleted: false
  }).sort({ priority: 1, name: 1 });
};

colorSchema.statics.findByFamily = function(colorFamily) {
  return this.find({
    colorFamily,
    status: 'active',
    isDeleted: false
  }).sort({ priority: 1, name: 1 });
};

colorSchema.statics.hexToRgb = function(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
    : null;
};

// ====================================================================
// INSTANCE METHODS
// ====================================================================
colorSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  
  // Rename to allow reuse
  const timestamp = Date.now();
  this.slug = `${this.slug}-deleted-${timestamp}`;
  this.hexCode = `${this.hexCode}-DEL`;
  
  return this.save();
};

colorSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

export default mongoose.model('Color', colorSchema);
```

---

## 🎯 Summary of Current vs. Required Architecture

### ✅ What You Already Have (Good!)
1. **Variant Model**: ✅ Excellent - has compound unique index, no stock fields
2. **Size Model**: ✅ Good - reusable, category-specific
3. **Color Model**: ✅ Good - hex codes, reusable
4. **Product Model**: ✅ Basic structure exists

### ⚠️ What Needs Enhancement
1. **Product Model**: Needs all the fields from the comprehensive schema above
2. **Category Master**: Need to verify it supports multi-select
3. **Brand Master**: Need to add more fields
4. **Product Type Master**: Need to implement attribute templates

### 📊 Next Steps

Would you like me to:

1. **Audit your current Product model** and create a migration plan?
2. **Create the enhanced Product schema** with all required fields?
3. **Build the frontend components** for the comprehensive product management?
4. **Create API endpoints** for all CRUD operations?
5. **Design the UI/UX** for the product management interface?

Let me know which area you'd like to focus on first, and I'll provide detailed implementation code!
