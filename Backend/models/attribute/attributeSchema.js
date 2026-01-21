import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true },   // Color, RAM, Size
  slug: { type: String, required: true }    // color, ram, size
});

export default mongoose.model("Attribute", attributeSchema);
