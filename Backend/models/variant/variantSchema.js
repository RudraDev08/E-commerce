import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // structured attributes
    size: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Size",
      required: true,
      index: true
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color", // Assuming Color model exists
      required: true,
      index: true
    },
    material: { type: String },
    style: { type: String },

    sku: {
      type: String,
      unique: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0
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
      type: Boolean,
      default: true,
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
variantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true });

// METHODS
variantSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

variantSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

export default mongoose.model("Variant", variantSchema);
