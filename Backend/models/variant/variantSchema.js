import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    attributes: {
      type: Object,
      required: true,
      /*
        Example:
        {
          color: "Black",
          ram: "8GB",
          storage: "128GB"
        }
      */
    },

    sku: {
      type: String,
      unique: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Variant", variantSchema);
