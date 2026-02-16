import mongoose from 'mongoose';
import crypto from 'crypto';

// ==========================================
// ENTERPRISE VARIANT MASTER (DETERMINISTIC)
// ==========================================
// This model acts as the "Configurator State" and "Global Registry".
// It ensures that no two variants exist with the same configuration.
// It is SEPARATE from the transactional "Variant" model used for carts/orders (which is lightweight).

const variantMasterSchema = new mongoose.Schema({
    // ==================== IDENTITY ====================
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        description: "Globally unique, human-readable SKU (e.g. NKE-TSH-BLK-XL-001)",
        index: true
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },

    productGroup: {
        type: String, // Group ID from Product
        required: true,
        index: true
    },

    barcode: {
        type: String,
        sparse: true,
        unique: true,
        trim: true,
        description: "EAN-13, UPC-A, or GTIN-14"
    },

    // ==================== DETERMINISTIC CONFIGURATION ====================
    // The "DNA" of the variant. Hashed to prevent duplicates.
    configHash: {
        type: String,
        required: true,
        unique: true, // THE HOLY GRAIL CONSTRAINT
        index: true,
        description: "SHA-256 Hash of sorted attribute value IDs + Product Group"
    },

    // Normalized Snapshot of Attributes (for faster read/indexing without heavy population)
    normalizedAttributes: [{
        typeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeType', required: true },
        valueId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue', required: true },
        typeSlug: String,
        valueSlug: String,
        valueName: String, // e.g. "XL"
        sortOrder: Number
    }],

    // Legacy Support (Optional, can be removed in pure v2)
    legacySizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SizeMaster' },
    legacyColorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColorMaster' },

    // ==================== PRICING & INVENTORY SUMMARY ====================
    // Denormalized for high-speed listing. 
    // real-time checks should hit Inventory Service, but this is used for filtering "In Stock" facets.

    price: {
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'USD' },
        compareAt: { type: Number, min: 0 },
        cost: { type: Number, min: 0 } // For margin calc
    },

    inventorySummary: {
        totalQuantity: { type: Number, default: 0, index: true },
        reservedQuantity: { type: Number, default: 0 },
        availableQuantity: { type: Number, default: 0, index: true }, // Virtual: total - reserved

        // Distribution of stock across warehouses (simplified for search)
        locations: [{
            warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
            quantity: Number
        }]
    },

    // ==================== SEGMENTATION & AVAILABILITY ====================
    availableChannels: {
        type: [String],
        enum: ['WEB', 'POS', 'B2B', 'APP', 'MARKETPLACE'],
        default: ['WEB'],
        index: true
    },

    availableRegions: {
        type: [String],
        enum: ['US', 'EU', 'APAC', 'GLOBAL'],
        default: ['GLOBAL'],
        index: true
    },

    launchDate: { type: Date, default: Date.now },

    // ==================== LIFECYCLE & GOVERNANCE ====================
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'DISCONTINUED', 'ARCHIVED'],
        default: 'DRAFT',
        index: true
    },

    lifecycleState: {
        type: String,
        enum: ['NEW', 'MATURE', 'CLEARANCE', 'EUL'], // End of Life
        default: 'NEW'
    },

    isLocked: {
        type: Boolean,
        default: false,
        description: "If locked, pricing and attributes cannot be changed by automated syncs"
    },

    // ==================== AUDIT & VERSIONING ====================
    version: { type: Number, default: 1 },

    auditLog: [{
        action: String, // 'PRICE_CHANGE', 'STOCK_UPDATE', 'STATUS_CHANGE'
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        diff: mongoose.Schema.Types.Mixed
    }]

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== COMPOUND INDEXES ====================
// 1. Uniqueness Guard (Fallback if field-level unique fails, but Mongo 5+ field level is fine)
// variantMasterSchema.index({ configHash: 1 }, { unique: true }); // Redundant w/ field def

// 2. High-Speed Category Browsing (Product + Filters)
variantMasterSchema.index({ productGroup: 1, status: 1 });

// 3. Faceted Search Support (Wildcard for attribute values)
variantMasterSchema.index({ "normalizedAttributes.valueSlug": 1 });
variantMasterSchema.index({ "normalizedAttributes.valueId": 1 });

// 4. Price Filtering within Categories
variantMasterSchema.index({ productGroup: 1, "price.amount": 1 });

// 5. SKU Lookup (Barcode fallback)
variantMasterSchema.index({ barcode: 1 }, { sparse: true, unique: true });

// ==================== STATIC METHOD: DETERMINISTIC GENERATION ====================
variantMasterSchema.statics.generateConfigHash = function (productId, attributeValueIds) {
    if (!productId) throw new Error("Product ID required for hash generation");

    // 1. Sort Attributes Deterministically
    const sortedIds = [...attributeValueIds].sort().join('|');

    // 2. Combine with Product Identity
    const rawString = `${productId.toString()}:${sortedIds}`;

    // 3. Hash
    return crypto.createHash('sha256').update(rawString).digest('hex');
};

// ==================== MIDDLEWARE: COLLISION PREVENTION ====================
variantMasterSchema.pre('save', async function (next) {
    // 1. Ensure Hash Consistency
    if (this.isModified('normalizedAttributes') || this.isModified('productId')) {
        const valueIds = this.normalizedAttributes.map(a => a.valueId.toString());
        this.configHash = this.constructor.generateConfigHash(this.productId, valueIds);
    }

    // 2. Stock Consistency
    if (this.inventorySummary) {
        this.inventorySummary.availableQuantity =
            this.inventorySummary.totalQuantity - this.inventorySummary.reservedQuantity;
    }

    next();
});

export default mongoose.models.VariantMaster || mongoose.model('VariantMaster', variantMasterSchema);
