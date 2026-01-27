import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    // Identity
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    description: { type: String, default: "" },

    // Visuals
    logo: { type: String, default: "" },
    banner: { type: String, default: "" }, // New: Banner support

    // Status & Visibility
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }, // Changed to string enum for consistency
    isFeatured: { type: Boolean, default: false },
    showInNav: { type: Boolean, default: true }, // New: Nav visibility
    priority: { type: Number, default: 0 }, // New: Sort order

    // SEO
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },

    // System
    isDeleted: { type: Boolean, default: false, index: true }, // Soft delete
    deletedAt: { type: Date, default: null },
    createdBy: { type: String, default: "admin" },
    updatedBy: { type: String, default: "admin" }
  },
  { timestamps: true }
);

// Indexes
brandSchema.index({ status: 1, isDeleted: 1 });
brandSchema.index({ priority: -1, name: 1 });

export default mongoose.model("Brand", brandSchema);
