import mongoose from 'mongoose';

const inventoryMasterSchema = new mongoose.Schema({
    // Link to Catalog
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Variant',
        required: true,
        unique: true, // One stock record per variant
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    sku: {
        type: String,
        required: true,
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

const InventoryMaster = mongoose.model('InventoryMaster', inventoryMasterSchema);

export default InventoryMaster;
