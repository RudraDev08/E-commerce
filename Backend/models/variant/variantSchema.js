import mongoose from "mongoose";
import crypto from 'crypto';

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // structured attributes - LEGACY SUPPORT (Optional)
    size: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Size",
      required: false, // MADE OPTIONAL
      index: true
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color", // Single color mode
      required: false, // MADE OPTIONAL
      index: true
    },

    // UNIFIED UNIFIED ATTRIBUTE SYSTEM
    variantAttributes: [{
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

    // Fast Filtering Index (Auto-generated)
    filterIndex: {
      type: Map,
      of: String
    },

    // Unique combination key for duplicate prevention
    combinationKey: {
      type: String,
      unique: true,
      sparse: true
    },

    // Colorway Strategy Fields
    colorwayName: { type: String },
    colorParts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color"
    }],

    material: { type: String },
    style: { type: String },

    skuStrategy: {
      type: String,
      enum: ['auto', 'manual', 'template'],
      default: 'auto'
    },

    sku: {
      type: String,
      unique: true,
      trim: true,
    },

    priceOverride: {
      type: Number,
      description: "Overrides base product price and attribute modifiers"
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    // DENORMALIZED PRICE FIELDS (Critical for Sorting)
    finalPrice: {
      type: Number,
      description: "Pre-calculated price including modifiers"
    },
    indexedPrice: {
      type: Number,
      description: "Price used for sorting loops"
    },
    mrp: {
      type: Number,
      min: 0,
      default: 0
    },
    costPrice: {
      type: Number,
      min: 0,
      default: 0
    },

    // Variant Specific Media
    images: [{
      url: { type: String, required: true },
      alt: { type: String },
      sortOrder: { type: Number, default: 0 }
    }],

    isDefault: {
      type: Boolean,
      default: false
    },

    // Stock is strictly managed by Inventory Service (InventoryMaster)

    status: {
      type: String,
      enum: ['draft', 'active', 'out_of_stock', 'archived'], // ENUM UPDATED
      default: 'active',
      index: true
    },

    // Segmentation (Enterprise)
    availableChannels: {
      type: [String],
      enum: ['B2C', 'B2B', 'POS', 'APP'],
      default: ['B2C'],
      index: true
    },
    availableRegions: {
      type: [String],
      enum: ['US', 'EU', 'APAC', 'IN', 'GLOBAL'],
      default: ['GLOBAL'],
      index: true
    },

    // Soft Delete Implementation
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Prevent duplicate variants for the same product
// Note: We need a new index strategy for unified attributes.
// The old index { product: 1, size: 1, color: 1 } might conflict if purely using attributes.
// We will relax the unique constraint on size/color if they are null, but this requires sparse index.
// Prevent duplicate variants for the same product
// Note: We need a new index strategy for unified attributes.
// The old index { product: 1, size: 1, color: 1 } might conflict if purely using attributes.
// We will relax the unique constraint on size/color if they are null, but this requires sparse index.
variantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true, sparse: true });
// Wildcard index for scalable attribute filtering
variantSchema.index({ "filterIndex.$**": 1 });


// SEARCH & PRICE INDEXING (Updated for Production Scale)
// NOTE: Text index on filterIndex.$** REMOVED to reduce RAM pressure
// Text search is now handled by SearchDocument collection
// variantSchema.index({ sku: 'text', 'filterIndex.$**': 'text' }); // DEPRECATED

// Price Index for Sorting
// Segmentation Index
variantSchema.index({ availableChannels: 1, availableRegions: 1, status: 1 });

// METHODS

// Calculate Price Logic (Hardware Rule 4)
// Now synchronous-capable if data is present, but kept async for population safety.
variantSchema.methods.calculatePrice = function (baseProductPrice) { // Removed async requirement for internal logic
  // 1. Override wins explicitly
  if (this.priceOverride !== undefined && this.priceOverride !== null) {
    return this.priceOverride;
  }

  const base = baseProductPrice || this.price || 0;
  let fixedTotal = 0;
  let percentTotal = 0;

  // We need to fetch attribute values to get price modifiers
  // This is best done via population before calling this method to avoid async DB calls in synchronous contexts
  // However, for accuracy, we assume variantAttributes is populated or we fetch it.
  if (this.variantAttributes && this.variantAttributes.length > 0) {
    if (this.populated('variantAttributes.attributeValue') || (this.variantAttributes[0] && this.variantAttributes[0].attributeValue && this.variantAttributes[0].attributeValue.priceModifier)) {
      this.variantAttributes.forEach(attr => {
        if (attr.attributeValue && attr.attributeValue.priceModifier) {
          const { type, value } = attr.attributeValue.priceModifier;
          if (type === 'fixed') {
            fixedTotal += (value || 0);
          } else if (type === 'percentage') {
            percentTotal += (value || 0);
          }
        }
      });
    }
  }

  // Rule: Percentage modifiers apply to base price only
  const percentageAmount = base * (percentTotal / 100);

  return base + fixedTotal + percentageAmount;
};

// Generate Filter Index
variantSchema.methods.generateFilterIndex = function () {
  const index = {};

  // Legacy mapping
  if (this.size) index['size'] = this.size.toString();
  if (this.color) index['color'] = this.color.toString();

  // Unified mapping
  if (this.variantAttributes && this.variantAttributes.length > 0) {
    this.variantAttributes.forEach(attr => {
      // we use attributeType ID as key, attributeValue ID as value
      if (attr.attributeType && attr.attributeValue) {
        index[attr.attributeType.toString()] = attr.attributeValue.toString();
      }
    });
  }

  this.filterIndex = index;
};

variantSchema.pre('save', function (next) {
  // 1. Auto-migration / Legacy Handling
  // Mirror legacy text to filterIndex
  this.generateFilterIndex();

  // 2. Combination Key Generation (Hardware Rule 1)
  let components = [];

  // Add unified attributes
  if (this.variantAttributes && this.variantAttributes.length) {
    this.variantAttributes.forEach(a => {
      const typeId = a.attributeType ? a.attributeType.toString() : '';
      const valId = a.attributeValue ? a.attributeValue.toString() : '';
      if (typeId && valId) {
        components.push(`${typeId}:${valId}`);
      }
    });
  }

  // Add legacy fields to key if they exist (to support legacy uniqueness)
  // We treat them as pseudo-attributes "LEGACY_SIZE" and "LEGACY_COLOR"
  if (this.size) {
    components.push(`LEGACY_SIZE:${this.size.toString()}`);
  }
  if (this.color) {
    components.push(`LEGACY_COLOR:${this.color.toString()}`);
  }

  if (components.length > 0) {
    // Sort to ensure deterministic key order
    components.sort();
    const rawKey = `${this.product.toString()}|${components.join('|')}`;
    this.combinationKey = crypto.createHash('sha1').update(rawKey).digest('hex');
  }

  // 3. Status backward compatibility
  if (this.status === true) this.status = 'active';
  if (this.status === false) this.status = 'archived';

  // 4. PRICE DENORMALIZATION (Critical Fix)
  // We calculate final price and store it for sorting/filtering. 
  // Note: This relies on attribute values being populated or handled by service layer. 
  // In pre-save, we might not have baseProductPrice easily if not passed.
  // However, the Service Layer MUST populate this.
  // Fallback: If not set by service, default to 'price'.
  if (this.finalPrice === undefined) {
    this.finalPrice = this.price; // Fallback
  }
  this.indexedPrice = this.finalPrice;

  next();
});

// Static Guard for Explosion (Hardware Rule 3)
variantSchema.statics.validateCombinationCount = function (combinations) {
  const MAX_COMBINATIONS = 100;
  if (Array.isArray(combinations) && combinations.length > MAX_COMBINATIONS) {
    throw new Error(`Variant Explosion Guard: Attempting to create ${combinations.length} variants. Limit is ${MAX_COMBINATIONS}. Please refine attributes.`);
  }
  return true;
};

variantSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = 'archived';
  return this.save();
};

variantSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  this.status = 'active';
  return this.save();
};

export default mongoose.model("Variant", variantSchema);
