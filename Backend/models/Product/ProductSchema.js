import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },

    description: { type: String, default: "" },

    image: { type: String, default: "" },

    status: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
