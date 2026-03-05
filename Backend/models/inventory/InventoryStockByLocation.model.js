import mongoose from 'mongoose';

/**
 * ========================================================================
 * INVENTORY STOCK BY LOCATION MODEL
 * ========================================================================
 *
 * PURPOSE:
 *   Replaces the `locations: []` embedded array on InventoryMaster.
 *
 * PROBLEM WITH EMBEDDED ARRAY:
 *   At scale, a single InventoryMaster doc grows unboundedly as warehouses
 *   are added (e.g. 50 warehouses × 100k variants = huge docs).
 *   MongoDB has a 16MB document limit and embedded array updates require
 *   loading and rewriting the full document.
 *
 * THIS SOLUTION:
 *   Each (variantId, warehouseId) pair gets its own small document (< 1KB).
 *   Updates are surgical — only one row is touched per warehouse operation.
 *   Queries for total stock across warehouses use a fast aggregation on
 *   the indexed compound key.
 *
 * ROLLOUT PLAN:
 *   1. Deploy this model.
 *   2. Run migration script to seed from InventoryMaster.locations[].
 *   3. Update InventoryService.updateLocationStock() to use this collection.
 *   4. Run InventoryService.updateStock() to compute totalStock via aggregation.
 *   5. Remove `locations: []` from InventoryMaster schema (cleanup pass).
 *
 * ========================================================================
 */

const inventoryStockByLocationSchema = new mongoose.Schema({

    // ── Catalog Links ──────────────────────────────────────────────────────
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VariantMaster',
        required: true
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    },

    sku: {
        type: String,
        uppercase: true,
        trim: true,
        index: true
    },

    // ── Warehouse ──────────────────────────────────────────────────────────
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },

    // Optional: specific bin within the warehouse
    binLocation: {
        type: String,
        trim: true
    },

    // ── Stock Quantities ───────────────────────────────────────────────────
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },

    reservedStock: {
        type: Number,
        default: 0,
        min: 0
    },

    // Computed: stock - reservedStock (kept in sync by pre-save hook)
    availableStock: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },

    // ── Config ─────────────────────────────────────────────────────────────
    lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0
    },

    status: {
        type: String,
        enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
        default: 'OUT_OF_STOCK',
        index: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    lastUpdated: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true,
    optimisticConcurrency: true,  // Prevent concurrent write corruption
    versionKey: '__v'
});

// ── Pre-save: sync availableStock and status ───────────────────────────────
inventoryStockByLocationSchema.pre('save', function () {
    // Drift Guard: cap reservedStock
    if (this.reservedStock > this.stock) {
        this.reservedStock = this.stock;
    }

    // Sync availableStock
    this.availableStock = Math.max(0, this.stock - this.reservedStock);

    // Auto-status
    if (this.availableStock === 0) {
        this.status = 'OUT_OF_STOCK';
    } else if (this.availableStock <= (this.lowStockThreshold ?? 5)) {
        this.status = 'LOW_STOCK';
    } else {
        this.status = 'IN_STOCK';
    }

    this.lastUpdated = new Date();
});

// ── Indexes ────────────────────────────────────────────────────────────────

// Primary lookup: one row per (variant × warehouse)
inventoryStockByLocationSchema.index(
    { variantId: 1, warehouseId: 1 },
    { unique: true }
);

// Query: "all locations for variant X" (get total stock)
inventoryStockByLocationSchema.index({ variantId: 1, isActive: 1 });

// Query: "all variants at warehouse Y" (warehouse dashboard)
inventoryStockByLocationSchema.index({ warehouseId: 1, status: 1 });

// Query: low-stock alert across warehouses
inventoryStockByLocationSchema.index({ status: 1, availableStock: 1 });

// ── Static: Get total available across all warehouses for a variant ─────────
inventoryStockByLocationSchema.statics.getTotalForVariant = async function (variantId) {
    const result = await this.aggregate([
        { $match: { variantId: new mongoose.Types.ObjectId(variantId), isActive: true } },
        {
            $group: {
                _id: '$variantId',
                totalStock: { $sum: '$stock' },
                totalReserved: { $sum: '$reservedStock' },
                totalAvailable: { $sum: '$availableStock' },
                warehouseCount: { $sum: 1 }
            }
        }
    ]);
    return result[0] || { totalStock: 0, totalReserved: 0, totalAvailable: 0, warehouseCount: 0 };
};

// ── Static: Atomic reserve at a specific warehouse ────────────────────────
inventoryStockByLocationSchema.statics.atomicReserve = function (variantId, warehouseId, qty) {
    return this.findOneAndUpdate(
        {
            variantId,
            warehouseId,
            availableStock: { $gte: qty },  // Conditional: only if stock exists
            isActive: true
        },
        {
            $inc: { reservedStock: qty, availableStock: -qty },
            $set: { lastUpdated: new Date() }
        },
        { new: true }
    );
};

// ── Static: Atomic release at a specific warehouse ────────────────────────
inventoryStockByLocationSchema.statics.atomicRelease = function (variantId, warehouseId, qty) {
    return this.findOneAndUpdate(
        { variantId, warehouseId, isActive: true },
        {
            $inc: { reservedStock: -qty, availableStock: qty },
            $set: { lastUpdated: new Date() }
        },
        { new: true }
    );
};

// ── Static: Upsert a location row (safe for migration / seeding) ──────────
inventoryStockByLocationSchema.statics.ensureLocation = function (variantId, warehouseId, meta = {}) {
    return this.findOneAndUpdate(
        { variantId, warehouseId },
        {
            $setOnInsert: {
                variantId,
                warehouseId,
                productId: meta.productId || null,
                sku: meta.sku || null,
                stock: 0,
                reservedStock: 0,
                availableStock: 0,
                isActive: true
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

const InventoryStockByLocation = mongoose.model('InventoryStockByLocation', inventoryStockByLocationSchema);
export default InventoryStockByLocation;
