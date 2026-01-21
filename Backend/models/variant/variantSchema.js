import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  attributes: {
    type: Object,   // { color: "Black", ram: "8GB" }
    required: true
  },
  sku: String,
  price: Number,
  stock: Number
}, { timestamps: true });

export default mongoose.model("Variant", variantSchema);
