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

    // Tree depth (0 = root, max 4 = 5 levels: 0-4)
    depth: { type: Number, default: 0, min: 0, max: 4 },

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

const MAX_DEPTH = 4; // 0=root … 4=5th level

// ==================== IMMUTABILITY + CIRCULAR REFERENCE GUARDS ====================
categorySchema.pre('save', async function () {
  // ── On UPDATE: immutability check ─────────────────────────────────────────
  if (!this.isNew) {
    const modifiedPaths = this.modifiedPaths();
    const immutablePaths = ['internalKey', 'parentId'];
    const violations = modifiedPaths.filter(path => immutablePaths.includes(path));
    if (violations.length > 0) {
      throw new Error(`IMMUTABILITY VIOLATION: Category structural fields [${violations.join(', ')}] are locked.`);
    }
    return;
  }

  // ── On CREATE: circular reference + depth guard ───────────────────────────
  if (this.parentId) {
    // Walk the ancestor chain from parentId up to root
    let depth = 0;
    let currentId = this.parentId;
    const visited = new Set();

    while (currentId) {
      const currentIdStr = currentId.toString();

      // Cycle detected: parent chain loops back to this new category's _id
      if (this._id && currentIdStr === this._id.toString()) {
        throw new Error('CIRCULAR REFERENCE: A category cannot be its own ancestor.');
      }

      if (visited.has(currentIdStr)) {
        throw new Error('CIRCULAR REFERENCE: Existing category tree is already cyclic.');
      }
      visited.add(currentIdStr);

      if (depth > MAX_DEPTH) {
        throw new Error(`MAX DEPTH EXCEEDED: Category tree allows a maximum of ${MAX_DEPTH + 1} levels.`);
      }

      const parent = await this.constructor.findById(currentId).select('parentId depth').lean();
      if (!parent) break;

      depth++;
      currentId = parent.parentId || null;
    }

    // Set depth on new category
    this.depth = depth;

    if (this.depth > MAX_DEPTH) {
      throw new Error(`MAX DEPTH EXCEEDED: Category tree allows a maximum of ${MAX_DEPTH + 1} levels.`);
    }
  } else {
    // Root category
    this.depth = 0;
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
  // Block direct depth overwrite — depth is computed, not user-supplied
  if (updateObj.depth !== undefined) {
    delete updateObj.depth;
  }
});

export default mongoose.model("Category", categorySchema);
