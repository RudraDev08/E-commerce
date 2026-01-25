import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, unique: true, required: true, trim: true },
    slug: { type: String, unique: true, required: true, index: true },
    description: { type: String, default: '' },

    // Hierarchy
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },

    // Status & Visibility
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    isVisible: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    showInNav: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },

    // SEO Fields
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },

    // Media
    image: { type: String, default: '' },
    banner: { type: String, default: '' },
    icon: { type: String, default: '' },

    // Tags
    tags: [{ type: String }],

    // Custom Fields (extensible)
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Product Count (virtual or cached)
    productCount: { type: Number, default: 0 },

    // Soft Delete
    isDeleted: { type: Boolean, default: false },

    // Audit Fields
    createdBy: { type: String, default: 'admin' },
    updatedBy: { type: String, default: 'admin' }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for better query performance
categorySchema.index({ name: 1, slug: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ status: 1, isVisible: 1 });
categorySchema.index({ isFeatured: 1 });

// Virtual for children (populated when needed)
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

export default mongoose.model("Category", categorySchema);
