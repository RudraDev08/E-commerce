import mongoose from 'mongoose';

/**
 * ========================================================================
 * INVENTORY MASTER SCHEMA - VARIANT-LEVEL INVENTORY TRACKING
 * ========================================================================
 * 
 * PURPOSE:
 * - Auto-created when variant is created
 * - Tracks stock at variant level (size + color combination)
 * - Supports automated stock operations (order, cancel, return)
 * - Provides real-time stock status calculation
 * - Maintains complete audit trail
 * 
 * BUSINESS RULES:
 * - One inventory record per variant (1:1 relationship)
 * - Available Stock = Total Stock - Reserved Stock
 * - Stock cannot be negative
 * - Status auto-calculated based on stock levels
 * - All changes logged in InventoryLedger
 * ========================================================================
 */

const inventoryMasterSchema = new mongoose.Schema({

    // ========================================================================
    // 1. VARIANT REFERENCE (Read-Only, System-Generated)
    // ========================================================================

    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: [true, 'Variant ID is required'],
        unique: true,
        // index: true, // Redundant with unique: true
        immutable: true // Cannot be changed after creation
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
        index: true,
        immutable: true
    },

    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        uppercase: true,
        trim: true,
        // index: true, // Redundant with unique: true
        immutable: true // SKU never changes
    },

    // ========================================================================
    // 2. PRODUCT INFORMATION (Denormalized for Quick Display)
    // ========================================================================

    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },

    // Variant attributes for display (e.g., "Large / Red")
    variantAttributes: {
        size: { type: String },
        color: { type: String },
        colorwayName: { type: String }, // For COLORWAY variants
        // Additional attributes stored as key-value
        other: { type: Map, of: String }
    },

    // ========================================================================
    // 3. STOCK TRACKING (Core Inventory Fields)
    // ========================================================================

    totalStock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Total stock cannot be negative'],
        validate: {
            validator: Number.isInteger,
            message: 'Stock must be a whole number'
        }
    },

    reservedStock: {
        type: Number,
        default: 0,
        min: [0, 'Reserved stock cannot be negative'],
        validate: {
            validator: Number.isInteger,
            message: 'Reserved stock must be a whole number'
        }
    },

    // Track individual reservations
    reservations: [{
        cartId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        reservedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
        userId: { type: String }
    }],

    // Virtual field: availableStock = totalStock - reservedStock
    // Calculated in real-time, not stored

    // ========================================================================
    // 4. STOCK STATUS & THRESHOLDS
    // ========================================================================

    lowStockThreshold: {
        type: Number,
        default: 10,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: 'Threshold must be a whole number'
        }
    },

    // Auto-calculated status (in_stock, low_stock, out_of_stock, discontinued)
    stockStatus: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
        default: 'out_of_stock',
        index: true
    },

    // ========================================================================
    // 5. WAREHOUSE & LOCATION (Future-Ready)
    // ========================================================================

    warehouseId: {
        type: String,
        default: 'WH-DEFAULT',
        index: true
    },

    // ========================================================================
    // 5.1 MULTI-LOCATION SUPPORT (Phase 3)
    // ========================================================================

    locations: [{
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
        stock: { type: Number, default: 0, min: 0 },
        rack: { type: String, trim: true },
        bin: { type: String, trim: true }
    }],

    locationCode: {
        type: String,
        default: 'A-01-01', // Legacy/Default location
        trim: true
    },

    // ========================================================================
    // 6. VALUATION & COSTING
    // ========================================================================

    costPrice: {
        type: Number,
        default: 0,
        min: 0
    },

    // Total inventory value = totalStock * costPrice (calculated)
    inventoryValue: {
        type: Number,
        default: 0,
        min: 0
    },

    // ========================================================================
    // 7. AUTOMATION SETTINGS
    // ========================================================================

    autoLowStockAlert: {
        type: Boolean,
        default: true
    },

    allowBackorder: {
        type: Boolean,
        default: false // If true, can sell even when stock = 0
    },

    autoBlockOnZeroStock: {
        type: Boolean,
        default: false // If true, variant status becomes inactive when stock = 0
    },

    // ========================================================================
    // 8. SOFT DELETE & STATUS
    // ========================================================================

    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    deletedAt: {
        type: Date,
        default: null
    },

    deletedBy: {
        type: String,
        default: null
    },

    // ========================================================================
    // 9. AUDIT TRAIL
    // ========================================================================

    lastStockUpdate: {
        type: Date,
        default: Date.now
    },

    lastStockUpdateBy: {
        type: String,
        default: 'SYSTEM'
    },

    createdBy: {
        type: String,
        default: 'SYSTEM'
    },

    updatedBy: {
        type: String,
        default: 'SYSTEM'
    },

    // ========================================================================
    // 10. METADATA
    // ========================================================================

    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },

    version: {
        type: Number,
        default: 1 // For optimistic locking
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========================================================================
// VIRTUALS
// ========================================================================

// Available Stock (Real-time calculation)
inventoryMasterSchema.virtual('availableStock').get(function () {
    return Math.max(0, this.totalStock - this.reservedStock);
});

// Is Low Stock
inventoryMasterSchema.virtual('isLowStock').get(function () {
    return this.availableStock > 0 && this.availableStock <= this.lowStockThreshold;
});

// Is Out of Stock
inventoryMasterSchema.virtual('isOutOfStock').get(function () {
    return this.availableStock === 0 && !this.allowBackorder;
});

// Can Sell (considering backorder)
inventoryMasterSchema.virtual('canSell').get(function () {
    return this.availableStock > 0 || this.allowBackorder;
});

// ========================================================================
// PRE-SAVE MIDDLEWARE
// ========================================================================

inventoryMasterSchema.pre('save', async function () {
    // 1. Calculate inventory value
    this.inventoryValue = this.totalStock * this.costPrice;

    // 2. Auto-calculate stock status
    const available = this.totalStock - this.reservedStock;

    if (this.stockStatus !== 'discontinued') {
        if (available === 0) {
            this.stockStatus = 'out_of_stock';
        } else if (available <= this.lowStockThreshold) {
            this.stockStatus = 'low_stock';
        } else {
            this.stockStatus = 'in_stock';
        }
    }

    // 3. Update last stock update timestamp
    if (this.isModified('totalStock') || this.isModified('reservedStock')) {
        this.lastStockUpdate = new Date();
    }

    // 4. Increment version for optimistic locking
    if (this.isModified('totalStock') || this.isModified('reservedStock')) {
        this.version += 1;
    }

    // 5. Sync totalStock with locations if locations are modified
    if (this.isModified('locations') && this.locations.length > 0) {
        const locationTotal = this.locations.reduce((sum, loc) => sum + loc.stock, 0);
        // If we are explicitly managing locations, the total should match
        // However, legacy flows might update totalStock directly.
        // Rule: If locations specific update happened, trust it? 
        // Safer: Logic in Service should handle this sync. 
        // Here we just ensure we don't have negative locations
    }
});

// ========================================================================
// INDEXES FOR PERFORMANCE
// ========================================================================

// Compound indexes for common queries
inventoryMasterSchema.index({ productId: 1, variantId: 1 });
inventoryMasterSchema.index({ stockStatus: 1, isActive: 1 });
inventoryMasterSchema.index({ warehouseId: 1, stockStatus: 1 });
inventoryMasterSchema.index({ isDeleted: 1, isActive: 1 });
inventoryMasterSchema.index({ lastStockUpdate: -1 });

// Text index for search
inventoryMasterSchema.index({
    productName: 'text',
    sku: 'text'
});

// ========================================================================
// STATIC METHODS
// ========================================================================

// Get inventory statistics
inventoryMasterSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: null,
                totalVariants: { $sum: 1 },
                inStock: {
                    $sum: { $cond: [{ $eq: ['$stockStatus', 'in_stock'] }, 1, 0] }
                },
                lowStock: {
                    $sum: { $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0] }
                },
                outOfStock: {
                    $sum: { $cond: [{ $eq: ['$stockStatus', 'out_of_stock'] }, 1, 0] }
                },
                totalInventoryValue: { $sum: '$inventoryValue' },
                totalStock: { $sum: '$totalStock' },
                totalReserved: { $sum: '$reservedStock' }
            }
        }
    ]);

    return stats[0] || {
        totalVariants: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalInventoryValue: 0,
        totalStock: 0,
        totalReserved: 0
    };
};

// ========================================================================
// INSTANCE METHODS
// ========================================================================

// Check if stock can be reserved
inventoryMasterSchema.methods.canReserve = function (quantity) {
    return this.availableStock >= quantity;
};

// Reserve stock
inventoryMasterSchema.methods.reserve = async function (quantity) {
    if (!this.canReserve(quantity)) {
        throw new Error(`Insufficient stock. Available: ${this.availableStock}, Requested: ${quantity}`);
    }

    this.reservedStock += quantity;
    return this.save();
};

// Release reserved stock
inventoryMasterSchema.methods.releaseReserve = async function (quantity) {
    if (this.reservedStock < quantity) {
        throw new Error(`Cannot release ${quantity} units. Only ${this.reservedStock} reserved.`);
    }

    this.reservedStock -= quantity;
    return this.save();
};

// Deduct stock (convert reserved to sold)
inventoryMasterSchema.methods.deductStock = async function (quantity) {
    if (this.totalStock < quantity) {
        throw new Error(`Insufficient total stock. Available: ${this.totalStock}, Requested: ${quantity}`);
    }

    this.totalStock -= quantity;
    this.reservedStock = Math.max(0, this.reservedStock - quantity);
    return this.save();
};

// Add stock
inventoryMasterSchema.methods.addStock = async function (quantity) {
    this.totalStock += quantity;
    return this.save();
};

const InventoryMaster = mongoose.model('InventoryMaster', inventoryMasterSchema);

export default InventoryMaster;
