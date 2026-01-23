import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    status: {
      type: Boolean,
      default: true, // active / inactive
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attribute", attributeSchema);
