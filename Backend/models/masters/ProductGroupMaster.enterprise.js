import mongoose from 'mongoose';

const productGroupSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        default: 'GLOBAL'
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },

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
    baseDescription: {
        type: String
    },
    cacheVersion: {
        type: Number,
        default: 1
    }, // Vital for Redis Invalidation
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
        default: 'DRAFT'
    },

    // ── CATEGORY REFERENCE ─────────────────────────────────────────────────────
    // REQUIRED for category-scope attribute validation.
    // Every ProductGroup MUST belong to exactly one Category so that the
    // system can enforce: "only attributes assigned to this category are allowed."
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true,
        // Not strictly required to avoid breaking existing data, but should be
        // enforced on new records (add `required: true` once migrated).
    },

}, {
    timestamps: true,
    optimisticConcurrency: true
});

// Read optimization
productGroupSchema.index({ tenantId: 1, status: 1 });

// Governance Hook: Immutability & Block Archival if ACTIVE variants exist
productGroupSchema.pre('save', async function () {
    if (this.isNew) return;
    const modifiedPaths = this.modifiedPaths();
    const immutablePaths = ['internalKey', 'categoryId'];
    const violations = modifiedPaths.filter(path => immutablePaths.includes(path));
    if (violations.length > 0) {
        throw new Error(`IMMUTABILITY VIOLATION: ProductGroup structural fields [${violations.join(', ')}] are locked.`);
    }
});

productGroupSchema.pre(['findOneAndUpdate', 'updateOne'], async function () {
    const update = this.getUpdate();
    const setUpdate = update.$set || update;

    const docToUpdate = await this.model.findOne(this.getQuery()).lean();
    if (!docToUpdate) return;

    // Immutability Check
    const immutableFields = ['internalKey', 'categoryId'];
    const violations = immutableFields.filter(f => setUpdate[f] !== undefined && setUpdate[f]?.toString() !== docToUpdate[f]?.toString());
    if (violations.length > 0) {
        throw new Error(`IMMUTABILITY VIOLATION: Mutation blocked for structural fields: ${violations.join(', ')}`);
    }

    // Check if transitioning to ARCHIVED
    const newStatus = setUpdate.status || update.status;

    if (newStatus === 'ARCHIVED') {
        const docToUpdate = await this.model.findOne(this.getQuery()).lean();
        if (docToUpdate) {
            // Count active variants
            const VariantMaster = mongoose.model('VariantMaster');
            const activeVariantsCount = await VariantMaster.countDocuments({
                productGroupId: docToUpdate._id,
                status: 'ACTIVE' // Fast count supported by idx_variant_productGroup_status
            });

            if (activeVariantsCount > 0) {
                const err = new Error(`Governance Violation: Cannot archive ProductGroup ${docToUpdate._id}. There are ${activeVariantsCount} ACTIVE variants linked to it.`);
                err.status = 409;
                throw err;
            }
        }
    }
});

export default mongoose.models.ProductGroupMaster || mongoose.model('ProductGroupMaster', productGroupSchema);
