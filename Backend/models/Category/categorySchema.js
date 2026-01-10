import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["MAIN", "SUB"],
      required: true
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },

    status: {
      type: Boolean,
      default: true // true = Active, false = Inactive
    },

    order: {
      type: Number,
      default: 0
    },

    icon: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
