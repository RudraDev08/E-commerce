import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true, trim: true },
    slug: { type: String, unique: true, index: true },

    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },

    icon: String,
    thumbnail: String,
    banner: String,

    seo: {
      title: String,
      description: String,
      keywords: [String],
      canonicalUrl: String
    },

    tags: [String],

    isActive: { type: Boolean, default: true },
    showInNavbar: Boolean,
    showOnHomepage: Boolean,
    isFeatured: Boolean,

    priority: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },

    createdBy: String,
    updatedBy: String
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
