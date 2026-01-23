import mongoose from "mongoose";

const productTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    attributes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attribute",
        required: true,
      },
    ],

    status: {
      type: Boolean,
      default: true, // active / inactive
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ProductType", productTypeSchema);
