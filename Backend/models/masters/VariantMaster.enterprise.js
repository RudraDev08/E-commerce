import mongoose from 'mongoose';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import { buildVariantIdentity, sortAttributeValueIds } from '../../utils/configHash.util.js';
import { LIMITS } from '../../utils/variantIdentity.js';

// Lazy import to avoid circular dependency — resolved at hook execution time
let _assertCategoryScope = null;
async function getCategoryScopeFn() {
    if (!_assertCategoryScope) {
        const mod = await import('../middlewares/categoryScope.middleware.js');
        _assertCategoryScope = mod.assertCategoryScope;
    }
    return _assertCategoryScope;
}

/**
 * VARIANT MASTER — REFACTORED ENTERPRISE SCHEMA
 * ─────────────────────────────────────────────
 * Design contract:
 *   • SizeMaster   → one ref per variant  (ref 'SizeMaster',  collection 'sizes')
 *   • ColorMaster  → one ref per variant  (ref 'ColorMaster', collection 'colormasters')
 *   • AttributeValue → zero-to-many refs  (ref 'AttributeValue', for material/processor/etc.)
 *   • configHash   → SHA-256(productGroupId:sizeId:colorId:sorted_attrValueIds)
 *   • price        → Decimal128 for precision
 *   • status       → ACTIVE | INACTIVE
 *   • imageGallery → [String] of URLs
 *
 * Collections kept SEPARATE — no data duplication from SizeMaster / ColorMaster.
 * Scale target: 20M+ variants.
 */

const VALID_TRANSITIONS = {
    DRAFT: ['ACTIVE', 'ARCHIVED'],
    ACTIVE: ['OUT_OF_STOCK', 'ARCHIVED', 'LOCKED'],
    OUT_OF_STOCK: ['ACTIVE', 'ARCHIVED'],
    LOCKED: ['ACTIVE', 'ARCHIVED'],
    ARCHIVED: []  // Terminal state
};

const variantMasterSchema = new mongoose.Schema(
    {
        // ═══════════════════════════════════════════════
        // TENANT ISOLATION
        // ═══════════════════════════════════════════════
        tenantId: {
            type: String,
            required: true,
            default: 'GLOBAL'
        },

        // ═══════════════════════════════════════════════
        // PRODUCT GROUP REFERENCE
        // ═══════════════════════════════════════════════
        productGroupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductGroupMaster',
            required: [true, 'productGroupId is required'],
            index: true,
        },

        // O(1) FLATTENED FILTER PARADIGM (e.g., ["color:red", "size:ram:16GB"])
        filterTokens: [{
            type: String,
            index: true
        }],

        // ═══════════════════════════════════════════════
        // MASTER DATA REFERENCES (Masters stay separate)
        // ═══════════════════════════════════════════════
        sizes: [
            {
                sizeId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'SizeMaster',
                    required: [true, 'sizeId is required']
                },
                category: {
                    type: String,
                    required: [true, 'Size category is required']
                }
            }
        ],

        colorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ColorMaster',
            required: [function () {
                // colorId is required ONLY for standard (non-colorway) variants
                return !this.colorwayName;
            }, 'colorId is required for non-colorway variants']
        },

        colorwayName: {
            type: String,
            default: null
        },

        // Zero-to-many attribute values (processor, material, RAM capacity, etc.)
        attributeValueIds: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AttributeValue',
            }],
            immutable: true,
        },

        // ── SECTION 6: Persisted structured dimension metadata ──────────────┄
        // This replaces runtime reconstruction from populated attributeValueIds.
        // Frozen at creation time — rename of attributeType does NOT update here.
        // Format mirrors frontend buildIdentityKeyFromVariant expectations.
        attributeDimensions: [{
            attributeId: { type: mongoose.Schema.Types.ObjectId, default: null },
            attributeName: { type: String, default: null },  // historic snapshot
            valueId: { type: mongoose.Schema.Types.ObjectId, required: true },
        }],

        // ── SECTION 10: Generation audit reference ──────────────────────────
        generationBatchId: { type: String, default: null },  // audit log correlation

        // ═══════════════════════════════════════════════
        // PRICING
        // ═══════════════════════════════════════════════
        price: {
            type: mongoose.Schema.Types.Decimal128,
            required: [true, 'price is required'],
            validate: {
                validator: (v) => parseFloat(v.toString()) >= 0,
                message: 'price must be non-negative',
            },
        },

        compareAtPrice: {
            type: mongoose.Schema.Types.Decimal128, // MRP / strikethrough price
        },

        resolvedPrice: {
            type: mongoose.Schema.Types.Decimal128,
        },

        priceResolutionLog: [{
            source: { type: String, enum: ['BASE', 'ATTRIBUTE_MODIFIER'], required: true },
            attributeValueId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' },
            modifierType: { type: String, enum: ['FIXED', 'PERCENTAGE'] },
            modifierValue: { type: mongoose.Schema.Types.Decimal128 },
            appliedAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
            recordedAt: { type: Date, default: Date.now, immutable: true },
            recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }],

        // ═══════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════
        status: {
            type: String,
            enum: ['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED', 'LOCKED'],
            default: 'DRAFT',
            required: true,
            index: true,
        },

        // ═══════════════════════════════════════════════
        // MEDIA
        // ═══════════════════════════════════════════════
        imageGallery: [{
            url: { type: String, required: true },
            altText: { type: String },
            isPrimary: { type: Boolean, default: false },
            sortOrder: { type: Number, default: 0 },
            type: {
                type: String,
                enum: ['HERO', 'THUMBNAIL', 'DETAIL', 'LIFESTYLE']
            }
        }],

        // ═══════════════════════════════════════════════
        // INVENTORY
        // ═══════════════════════════════════════════════
        inventory: {
            warehouseRef: { type: String },          // External WMS ID
            quantityOnHand: { type: Number, default: 0 },
            quantityReserved: { type: Number, default: 0 },
            lowStockThreshold: { type: Number, default: 5 },
            autoStatusSync: { type: Boolean, default: true }
        },

        // ═══════════════════════════════════════════════
        // COLLISION-PROOF IDENTITY
        // ═══════════════════════════════════════════════
        sku: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true
        },

        skuStrategy: {
            type: String,
            enum: ['AUTO', 'MANUAL', 'LEGACY_IMPORT'],
            default: 'AUTO'
        },

        configHash: {
            type: String,
            unique: true,
            index: true,
            immutable: true,
        },

        identityVersion: {
            type: Number,
            default: LIMITS.IDENTITY_VERSION || 1,
            immutable: true
        },

        // ═══════════════════════════════════════════════
        // GOVERNANCE — prevent modification of identity
        // fields after activation
        // ═══════════════════════════════════════════════
        governance: {
            isLocked: { type: Boolean, default: false },
            lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            lockedAt: { type: Date },
            lockedReason: {
                type: String,
                enum: ['WAREHOUSE_SYNC', 'COMPLIANCE', 'MANUAL']
            },
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date },
            version: { type: Number, default: 1 }
        },
    },
    {
        timestamps: true,
        collection: 'variantmasters',
        toJSON: {
            virtuals: true,
            // Convert Decimal128 to safe string in JSON responses automatically
            transform: (_doc, ret) => {
                if (ret.price) ret.price = ret.price.toString();
                if (ret.compareAtPrice) ret.compareAtPrice = ret.compareAtPrice.toString();
                if (ret.resolvedPrice) ret.resolvedPrice = ret.resolvedPrice.toString();
                if (ret.priceResolutionLog) {
                    ret.priceResolutionLog = ret.priceResolutionLog.map(log => {
                        if (log.modifierValue) log.modifierValue = log.modifierValue.toString();
                        if (log.appliedAmount) log.appliedAmount = log.appliedAmount.toString();
                        return log;
                    });
                }
                return ret;
            },
        },
        toObject: { virtuals: true },
        optimisticConcurrency: true,
        versionKey: 'governance.version'
    }
);



// ═══════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════

// Primary collision-prevention index (Scoped Uniqueness: combinations must be unique WITHIN a product group)
// We remove the unique property from the schema block for configHash and handle it here:
variantMasterSchema.index(
    { productGroupId: 1, configHash: 1 },
    { unique: true, name: 'idx_variant_scoped_configHash' }
);

// Global SKU Uniqueness Scoped to Tenant
variantMasterSchema.index(
    { tenantId: 1, sku: 1 },
    { unique: true, name: 'idx_variant_tenant_sku', partialFilterExpression: { sku: { $exists: true, $ne: null } } }
);

// High-speed faceted filtering index
variantMasterSchema.index(
    { tenantId: 1, filterTokens: 1, status: 1, price: 1 },
    { name: 'idx_variant_filter_tokens' }
);

// Compound index for the most common admin/customer query
variantMasterSchema.index(
    { productGroupId: 1, status: 1 },
    { name: 'idx_variant_productGroup_status' }
);

// Support filtering by color within a product group
variantMasterSchema.index(
    { productGroupId: 1, colorId: 1, status: 1 },
    { name: 'idx_variant_productGroup_color' }
);

// Attribute value lookup (e.g., "which variants have processor=A18 Pro?")
variantMasterSchema.index(
    { attributeValueIds: 1 },
    { name: 'idx_variant_attributeValues' }
);

// ═══════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════
variantMasterSchema.virtual('priceFormatted').get(function () {
    return this.price ? parseFloat(this.price.toString()) : null;
});

variantMasterSchema.virtual('isOnSale').get(function () {
    if (!this.compareAtPrice || !this.price) return false;
    return parseFloat(this.compareAtPrice.toString()) > parseFloat(this.price.toString());
});

// ═══════════════════════════════════════════════════════════
// 1️⃣ ORDERED MIDDLEWARE EXECUTION (P0 MUST)
// Sequence:
//   0. Pre-validate: FilterTokens & Size Category Dedup
//   1. Scope Validation (Ensure attributes are legal)
//   2. Hash & Dedup (Canonicalize identity)
//   3. Price Engine (Build logs using canonical attributes)
//   4. Media Validations (Check galleries)
//   5. Governance & Lifecycle (Lock checks, OCC timestamp, Inventory sync)
// ═══════════════════════════════════════════════════════════

/**
 * [STEP 0] Size Category Duplication Check & FilterToken Generation
 */
variantMasterSchema.pre('validate', function () {
    // 1. Array validation for Size Categories
    if (this.sizes && this.sizes.length > 0) {
        const categorySet = new Set();
        for (const s of this.sizes) {
            if (!s.category) throw new Error('Size category cannot be undefined');
            if (categorySet.has(s.category)) {
                throw new Error(`Duplicate size category detected: ${s.category}. A variant can only have one size per category.`);
            }
            categorySet.add(s.category);
        }
    }

    // 2. Generate Search/Filter Tokens for O(1) Reads
    const tks = new Set();
    if (this.colorId) tks.add(`color:${this.colorId.toString()}`);
    if (this.sizes && this.sizes.length) {
        this.sizes.forEach(s => tks.add(`size:${s.category}:${s.sizeId.toString()}`));
    }
    if (this.attributeValueIds) {
        this.attributeValueIds.forEach(valId => tks.add(`attr:${valId.toString()}`));
    }
    this.filterTokens = Array.from(tks).sort();
});

/**
 * [STEP 1] Scope Validation Middleware
 * Prevent mapping unrelated attributes to variants
 */
variantMasterSchema.pre('save', async function () {
    // [STEP 1 — FIXED] Category-Scope Validation
    // The previous implementation was a dead no-op: it checked
    // `v.attributeType.applicableTo` and `this.productGroupType` — neither
    // field exists on the respective schemas, so `invalid` was always [].
    //
    // The correct path is:
    //   this.productGroupId → ProductGroup.categoryId → CategoryAttribute → allowedTypeIds
    //   Then verify each attributeValueId's .attributeType is in allowedTypeIds.
    if (this.attributeValueIds && this.attributeValueIds.length > 0) {
        const assertScope = await getCategoryScopeFn();
        await assertScope(
            this.productGroupId?.toString(),
            this.attributeValueIds.map(id => id.toString())
        );
    }
});

/**
 * [STEP 2] Hash & Dedup Middleware
 * Deduplicate attributes and regenerate configHash whenever identity changes.
 */
variantMasterSchema.pre('save', function (next) {
    if (this.isModified('colorId') ||
        this.isModified('sizes') ||
        this.isModified('attributeValueIds')) {

        this.configHash = buildVariantIdentity({
            productGroupId: this.productGroupId,
            colorId: this.colorId,
            sizes: this.sizes,
            attributeValueIds: this.attributeValueIds
        });
    }

    next();
});

/**
 * [STEP 3] Price Resolution Engine (Decimal.js Hardened)
 * Deterministically resolve finalPrice and rebuild the priceResolutionLog
 */
variantMasterSchema.pre('save', async function () {
    if (this.isModified('price') || this.isModified('attributeValueIds')) {
        const basePrice = new Decimal(this.price ? this.price.toString() : 0);

        // Option A: Deterministic Rebuild Model Reset
        this.priceResolutionLog = [{
            source: 'BASE',
            modifierType: 'FIXED',
            modifierValue: basePrice.toString(),
            appliedAmount: basePrice.toString()
        }];

        let subtotal = new Decimal(basePrice);
        let totalFixed = new Decimal(0);
        let totalPercentage = new Decimal(0);
        const attrLogs = [];

        if (this.attributeValueIds && this.attributeValueIds.length > 0) {
            const AttributeValue = mongoose.model('AttributeValue');
            const attributes = await AttributeValue.find({ _id: { $in: this.attributeValueIds } }).lean();

            for (const attr of attributes) {
                const pm = attr.pricingModifiers?.priceModifier || attr.priceModifier;
                const mTypeRaw = pm?.type || attr.pricingModifiers?.modifierType;
                const mValueRaw = pm?.value || attr.pricingModifiers?.value;

                if (mTypeRaw && mTypeRaw !== 'none' && mValueRaw) {
                    const typeUpper = mTypeRaw.toUpperCase();
                    const valDec = new Decimal(mValueRaw.toString());

                    if (typeUpper === 'FIXED') {
                        totalFixed = totalFixed.plus(valDec);
                        attrLogs.push({
                            source: 'ATTRIBUTE_MODIFIER',
                            attributeValueId: attr._id,
                            modifierType: 'FIXED',
                            modifierValue: valDec.toString(),
                            appliedAmount: valDec.toString() // fixed amount is exactly the modifier
                        });
                    } else if (typeUpper === 'PERCENTAGE') {
                        totalPercentage = totalPercentage.plus(valDec);
                        attrLogs.push({
                            source: 'ATTRIBUTE_MODIFIER',
                            attributeValueId: attr._id,
                            modifierType: 'PERCENTAGE',
                            modifierValue: valDec.toString(),
                            appliedAmount: '0' // Will populate dynamically based on subtotal later
                        });
                    }
                }
            }
        }

        // Apply Fixed Modifiers to get Base Subtotal
        subtotal = subtotal.plus(totalFixed);

        // Apply Percentage on Evaluated Subtotal
        if (!totalPercentage.isZero()) {
            attrLogs.forEach(log => {
                if (log.modifierType === 'PERCENTAGE') {
                    // Applied proportionally to the fixed subtotal amount
                    const pctDec = new Decimal(log.modifierValue);
                    log.appliedAmount = subtotal.times(pctDec.dividedBy(100)).toString();
                }
            });
            subtotal = subtotal.plus(subtotal.times(totalPercentage.dividedBy(100)));
        }

        // Negative boundary protection (P0 requirement)
        if (subtotal.isNegative()) {
            throw new Error(`resolvedPrice evaluates to ${subtotal.toString()}. Variants cannot have a negative price outcome.`);
        }

        // Push deterministic logs
        if (attrLogs.length > 0) {
            this.priceResolutionLog.push(...attrLogs);
        }

        this.resolvedPrice = subtotal.toString();
    }
});

/**
 * [STEP 4] Image Gallery Validations
 */
variantMasterSchema.pre('save', function () {
    if (!this.imageGallery || !Array.isArray(this.imageGallery)) return;

    // 1. Primary Image Enforcement
    const primaryImages = this.imageGallery.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
        throw new Error('Only one image can be marked as primary.');
    }
    if (this.imageGallery.length > 0 && primaryImages.length === 0) {
        this.imageGallery[0].isPrimary = true;
    }

    // 2. SortOrder Uniqueness
    const orders = this.imageGallery.map(img => img.sortOrder).filter(o => o !== undefined);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
        throw new Error('Duplicate sortOrder values in imageGallery.');
    }
});

/**
 * [STEP 5] Governance, Lifecycle, & Inventory Validations
 */
variantMasterSchema.pre('save', async function () {
    // 1. Update timestamp for Governance (Mongoose handles OCC version increment automatically)
    if (!this.isNew && this.isModified()) {
        if (!this.governance) this.governance = {};
        this.governance.updatedAt = new Date();
    }

    // 2. compareAtPrice guard
    if (this.compareAtPrice && this.price) {
        const compareNum = new Decimal(this.compareAtPrice.toString());
        const priceNum = new Decimal(this.price.toString());
        if (compareNum.lessThanOrEqualTo(priceNum)) {
            throw new Error('compareAtPrice must be greater than price to show a valid discount.');
        }
    }

    // 3. Inventory Auto-Status Sync (Protect LOCKED variants)
    if (this.inventory && this.inventory.autoStatusSync) {
        const isCurrentlyLocked = this.governance?.isLocked || false;
        if (!isCurrentlyLocked) {
            if (this.inventory.quantityOnHand <= 0 && this.status === 'ACTIVE') {
                this.status = 'OUT_OF_STOCK';
            } else if (this.inventory.quantityOnHand > 0 && this.status === 'OUT_OF_STOCK') {
                this.status = 'ACTIVE';
            }
        }
    }

    if (this.isNew) return;

    // DB Fetch for Transition & Lock Validations
    const original = await mongoose.model('VariantMaster').findById(this._id).lean();
    if (!original) return;

    // 4. ACTIVE Lock Enforcement — includes attributeDimensions (SECTION 7)
    if (original.status === 'ACTIVE') {
        const lockedFields = ['sizes', 'colorId', 'attributeValueIds', 'attributeDimensions', 'productGroupId', 'configHash'];
        for (const field of lockedFields) {
            if (this.isModified(field)) {
                throw new Error(`Cannot modify '${field}' on an ACTIVE variant. Archive and recreate.`);
            }
        }
    }

    // 5. Valid Transitions Checks
    if (this.isModified('status')) {
        const allowed = VALID_TRANSITIONS[original.status] || [];
        if (this.status !== original.status && !allowed.includes(this.status)) {
            throw new Error(`Invalid status transition: ${original.status} → ${this.status}`);
        }
    }
});

/**
 * [QUERY MIDDLEWARE] Hardened Identity, OCC, and Image Gallery Guard
 */
variantMasterSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function () {
    const update = this.getUpdate();
    const setUpdate = update.$set || update;
    const query = this.getQuery();

    // 1. Enforce OCC Version Check in updates (P0)
    const isInternalSync = update.$ignoreOCC === true;
    if (!isInternalSync && (!query['governance.version'] && !query._id?.$in)) {
        if (this.op === 'findOneAndUpdate' || this.op === 'updateOne') {
            throw new Error(`Optimistic Concurrency Control requires 'governance.version' in query condition for ${this.op}`);
        }
    }

    // 2. Auto-lock on transition to ACTIVE
    const newStatus = setUpdate.status || update.status;
    if (newStatus === 'ACTIVE') {
        if (!update.$set) update.$set = {};
        if (!update.$set.governance) update.$set.governance = {};
        update.$set['governance.isLocked'] = true;
    }

    // 3. Dot-Notation Deep Identity Mutation Scan (P0) — SECTION 7 immutability enforcement
    const identityFields = ['sizes', 'colorId', 'productGroupId', 'configHash', 'attributeValueIds', 'attributeDimensions'];
    let identityModified = false;

    const mutateOps = [update.$set, update.$unset, update.$push, update.$addToSet, update.$pull, update];
    for (const opObj of mutateOps) {
        if (!opObj) continue;
        for (const key of Object.keys(opObj)) {
            if (identityFields.some(f => key === f || key.startsWith(`${f}.`))) {
                identityModified = true;
                break;
            }
        }
        if (identityModified) break;
    }

    if (identityModified) {
        const docs = await this.model.find(this.getQuery()).lean();
        for (const doc of docs) {
            if (doc?.governance?.isLocked || doc?.status === 'ACTIVE') {
                const err = new Error('Variant identity (configHash, etc.) is locked and cannot be modified via update query on ACTIVE/LOCKED docs.');
                err.status = 409;
                err.statusCode = 409;
                throw err;
            }
        }
    }

    // 4. Image Gallery Guards (P1)
    let galleryModified = false;
    for (const opObj of mutateOps) {
        if (!opObj) continue;
        for (const key of Object.keys(opObj)) {
            if (key === 'imageGallery' || key.startsWith('imageGallery.')) {
                galleryModified = true;
                break;
            }
        }
        if (galleryModified) break;
    }

    if (galleryModified) {
        if (update.$push?.imageGallery || update.$set?.imageGallery) {
            const err = new Error('Modifying imageGallery arrays via query updates is blocked for integrity. Use document.save().');
            err.status = 400;
            throw err;
        }
    }
});

// ═══════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════
export default mongoose.models.VariantMaster ||
    mongoose.model('VariantMaster', variantMasterSchema);
