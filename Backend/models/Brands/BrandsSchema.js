import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    // Identity
    internalKey: {
      type: String,
      unique: true,
      immutable: true,
      description: "Immutable internal system key"
    },
    canonicalId: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
      description: "Cross-system canonical identifier"
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    description: { type: String, default: "" },

    // Visuals
    logo: { type: String, default: "" },
    banner: { type: String, default: "" }, // New: Banner support

    // Status & Visibility
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' }, // Added archived
    isFeatured: { type: Boolean, default: false },
    showInNav: { type: Boolean, default: true }, // New: Nav visibility
    priority: { type: Number, default: 0 }, // New: Sort order

    // SEO
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },

    // System
    isLocked: { type: Boolean, default: false }, // For structural protection
    isDeleted: { type: Boolean, default: false, index: true }, // Soft delete
    deletedAt: { type: Date, default: null },
    createdBy: { type: String, default: "admin" },
    updatedBy: { type: String, default: "admin" }
  },
  {
    timestamps: true,
    optimisticConcurrency: true
  }
);

// Indexes
brandSchema.index({ status: 1, isDeleted: 1 });
brandSchema.index({ priority: -1, name: 1 });

// ==================== IMMUTABILITY GUARDS ====================
brandSchema.pre('save', async function () {
  if (this.isNew) {
    if (!this.internalKey) {
      this.internalKey = `BRAND_${this.slug.toUpperCase().replace(/-/g, '_')}_${Math.random().toString(36).substring(2, 7)}`;
    }
    return;
  }

  const modifiedPaths = this.modifiedPaths();
  const immutablePaths = ['internalKey', 'canonicalId'];

  const violations = modifiedPaths.filter(path => immutablePaths.includes(path));

  if (violations.length > 0) {
    throw new Error(`IMMUTABILITY VIOLATION: The following structural fields cannot be modified after creation: ${violations.join(', ')}`);
  }

  // Lock check
  if (this.isLocked && !this.isModified('isLocked')) {
    const structuralFields = ['name', 'slug'];
    const structuralViolations = modifiedPaths.filter(path => structuralFields.includes(path));
    if (structuralViolations.length > 0) {
      throw new Error(`LOCKED: Cannot modify structural fields ${structuralViolations.join(', ')} on a locked Brand.`);
    }
  }
});

brandSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  const docToUpdate = await this.model.findOne(this.getQuery()).lean();

  if (!docToUpdate) return;

  const immutableFields = ['internalKey', 'canonicalId'];
  const modifiedImmutable = Object.keys(update.$set || {}).filter(path => immutableFields.includes(path));

  if (modifiedImmutable.length > 0) {
    throw new Error(`IMMUTABILITY VIOLATION: Cannot modify immutable fields: ${modifiedImmutable.join(', ')}`);
  }

  if (docToUpdate.isLocked) {
    const structuralFields = ['name', 'slug'];
    const modifiedStructural = Object.keys(update.$set || {}).filter(path => structuralFields.includes(path));
    if (modifiedStructural.length > 0) {
      throw new Error(`LOCKED: Cannot modify structural fields ${modifiedStructural.join(', ')} on a locked Brand.`);
    }
  }
});

export default mongoose.model("Brand", brandSchema);
