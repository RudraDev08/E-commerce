import mongoose from 'mongoose';

const inventoryMasterSchema = new mongoose.Schema({
    // Link to Catalog
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VariantMaster',  // ✅ FIXED: was 'Variant' — model is registered as 'VariantMaster'
        required: true,
        unique: true, // One stock record per variant
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductGroupSnapshot',  // ✅ FIXED: closest to the ProductGroup concept in this system
        required: false,  // ✅ Made optional — variants seeded via repair may not have productId
        index: true
    },
    sku: {
        type: String,
        required: false,  // ✅ Optional — repair records may not carry a SKU
        uppercase: true,
        index: true
    },

    // The Source of Truth for Stock
    totalStock: {
        type: Number,
        default: 0,
        min: 0,
        required: true
    },
    reservedStock: {
        type: Number,
        default: 0,
        min: 0,
        required: true
    },

    // CRITICAL FIX: Computed field for shard-safe queries
    // This replaces $expr usage and is indexable
    availableStock: {
        type: Number,
        default: 0,
        min: 0,
        required: true,
        index: true  // ✅ INDEXABLE (unlike $expr)
    },

    // Configuration / Metadata
    lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0
    },
    warehouseLocation: {
        type: String,
        default: 'Default',
        trim: true
    },
    binLocation: {
        type: String,
        trim: true
    },

    // Status
    status: {
        type: String,
        enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK', 'DISCONTINUED'],
        default: 'OUT_OF_STOCK'
    },

    // Multi-Warehouse Distribution
    locations: [{
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse'
        },
        stock: {
            type: Number,
            default: 0
        },
        binLocation: String,
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }],

    lastUpdated: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save to update status and sync availableStock
inventoryMasterSchema.pre('save', async function () {
    // CRITICAL: Keep availableStock in sync
    this.availableStock = Math.max(0, this.totalStock - this.reservedStock);

    // Update status based on total stock
    if (this.totalStock === 0) {
        this.status = 'OUT_OF_STOCK';
    } else if (this.totalStock <= this.lowStockThreshold) {
        this.status = 'LOW_STOCK';
    } else {
        this.status = 'IN_STOCK';
    }

    this.lastUpdated = new Date();
});

// ✅ Register model BEFORE attaching static methods
const InventoryMaster = mongoose.model('InventoryMaster', inventoryMasterSchema);

/**
 * Static helper — enforces 1:1 invariant between VariantMaster and InventoryMaster.
 * Uses updateOne/upsert so it is SAFE to call multiple times (idempotent).
 *
 * @param {Object}  variant   - Lean or Mongoose VariantMaster document
 * @returns {Object}          - { created: boolean, id: ObjectId|null }
 */
InventoryMaster.ensureForVariant = async function (variant) {
    const result = await InventoryMaster.updateOne(
        { variantId: variant._id },
        {
            $setOnInsert: {
                variantId: variant._id,
                productId: variant.productGroupId ?? variant.productId ?? null,
                sku: variant.sku ?? null,
                totalStock: 0,
                reservedStock: 0,
                availableStock: 0,
                lowStockThreshold: 5,
                status: 'OUT_OF_STOCK',
                isDeleted: false,
                locations: [],
            }
        },
        { upsert: true, setDefaultsOnInsert: true }
    );
    return { created: result.upsertedCount > 0, id: result.upsertedId };
};

export default InventoryMaster;
