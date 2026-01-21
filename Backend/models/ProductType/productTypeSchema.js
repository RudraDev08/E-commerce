import mongoose from "mongoose";

const productTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attribute" }]
});

export default mongoose.model("ProductType", productTypeSchema);
