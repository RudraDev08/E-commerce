import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    logo: {
      type: String, // image URL or filename
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    // categories: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Category",
    //   },
    // ],

    isFeatured: {
      type: Boolean,
      default: false,
    },

    showOnHomepage: {
      type: Boolean,
      default: true,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Brand", brandSchema);
