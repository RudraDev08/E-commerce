import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },

    // --------------------------------------------------------------------------
    // 1. IDENTITY & ATTRIBUTES
    // --------------------------------------------------------------------------
    attributes: {
      type: Map,
      of: String,
      required: true,
      // Generic: { size: "XL", material: "Cotton" }
    },

    // Core Relations (Indexed for Speed)
    sizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Size' },

    // Polymorphic Color Relations
    colorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },        // For SINGLE_COLOR
    colorwayName: { type: String },                                         // For COLORWAY (e.g. "Bred")
    colorParts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Color' }],   // For COLORWAY (Palette)

    sku: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true
    },

    // --------------------------------------------------------------------------
    // 2. PRICING ENGINE
    // --------------------------------------------------------------------------
    price: { type: Number, required: true, min: 0 },         // Selling Price (Final)
    basePrice: { type: Number, default: 0, min: 0 },         // MRP / Compare At
    costPrice: { type: Number, select: false, min: 0 },      // Internal Cost (Profit Calc)
    taxRate: { type: Number, default: 0, min: 0 },           // Tax Percentage (e.g., 18 for 18%)
    currency: { type: String, default: 'USD' },

    // --------------------------------------------------------------------------
    // 3. INVENTORY MANAGEMENT
    // --------------------------------------------------------------------------
    stock: { type: Number, default: 0, min: 0 },             // Physical Quantity Available
    reserved: { type: Number, default: 0, min: 0 },          // Locked in active carts/orders
    minStock: { type: Number, default: 5 },                  // Low stock alert threshold
    location: { type: String, default: 'Default Warehouse' },// Bin/Rack Location
    allowBackorder: { type: Boolean, default: false },       // Allow sales below 0

    // --------------------------------------------------------------------------
    // 4. MEDIA (Specific to this variant)
    // --------------------------------------------------------------------------
    image: { type: String, default: "" },                    // Primary Variant Image (e.g. Red Shirt)
    gallery: [{ type: String }],                             // Additional specific angles

    // --------------------------------------------------------------------------
    // 5. STATUS
    // --------------------------------------------------------------------------
    status: {
      type: Boolean,
      default: true,
      index: true
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// --------------------------------------------------------------------------
// VIRTUALS & INDEXES
// --------------------------------------------------------------------------

// Virtual: Real Sellable Stock
productVariantSchema.virtual('sellable').get(function () {
  if (this.allowBackorder) return 999999;
  return Math.max(0, this.stock - this.reserved);
});

// Virtual: Stock Status Text
productVariantSchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0 && !this.allowBackorder) return 'out_of_stock';
  if (this.stock <= this.minStock) return 'low_stock';
  return 'in_stock';
});

// Virtual: Profit Margin (Value)
productVariantSchema.virtual('profit').get(function () {
  if (this.costPrice === undefined) return null; // Since it's select: false
  return this.price - this.costPrice;
});

// Prevent Duplicate Variants for Same Product
productVariantSchema.index(
  { productId: 1, attributes: 1 },
  { unique: true }
);

export default mongoose.model("ProductVariant", productVariantSchema);
