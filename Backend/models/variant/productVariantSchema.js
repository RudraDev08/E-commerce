import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // KEY PART — USING attribute.slug
    attributes: {
      type: Map,
      of: String,
      required: true,
      // { size: "XL", color: "Black", ram: "8GB" }
    },

    price: {
      type: Number,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    sku: {
      type: String,
      trim: true,
      unique: true,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* PREVENT DUPLICATE VARIANTS */
productVariantSchema.index(
  { productId: 1, attributes: 1 },
  { unique: true }
);

export default mongoose.model("ProductVariant", productVariantSchema);
