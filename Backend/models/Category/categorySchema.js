import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, unique: true, required: true, trim: true },
    slug: { type: String, unique: true, required: true, index: true },
    description: { type: String, default: '' },

    // ==================== IMMUTABLE IDENTITY ====================
    internalKey: {
      type: String,
      immutable: true,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    canonicalId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

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
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for better query performance
categorySchema.index({ name: 1, slug: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ status: 1, isVisible: 1 });
categorySchema.index({ isFeatured: 1 });

categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

// ==================== IMMUTABILITY GUARDS ====================
categorySchema.pre('save', async function () {
  if (this.isNew) return;
  const modifiedPaths = this.modifiedPaths();
  const immutablePaths = ['internalKey', 'parentId'];
  const violations = modifiedPaths.filter(path => immutablePaths.includes(path));
  if (violations.length > 0) {
    throw new Error(`IMMUTABILITY VIOLATION: Category structural fields [${violations.join(', ')}] are locked.`);
  }
});

categorySchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  const docToUpdate = await this.model.findOne(this.getQuery()).lean();
  if (!docToUpdate) return;
  const immutableFields = ['internalKey', 'parentId'];
  const updateObj = update.$set || update;
  const violations = immutableFields.filter(f => updateObj[f] !== undefined && updateObj[f] !== docToUpdate[f]?.toString());
  if (violations.length > 0) {
    throw new Error(`IMMUTABILITY VIOLATION: Mutation blocked for structural fields: ${violations.join(', ')}`);
  }
});

export default mongoose.model("Category", categorySchema);
