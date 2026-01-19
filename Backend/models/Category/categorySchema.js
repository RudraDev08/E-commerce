import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true
    },

    description: String,

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    priority: {
      type: Number,
      default: 0
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
