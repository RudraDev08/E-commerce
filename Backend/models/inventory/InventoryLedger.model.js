import mongoose from 'mongoose';

/**
 * ========================================================================
 * INVENTORY LEDGER SCHEMA - COMPLETE AUDIT TRAIL
 * ========================================================================
 * 
 * PURPOSE:
 * - Immutable log of all inventory transactions
 * - Tracks every stock change with reason and context
 * - Supports compliance and dispute resolution
 * - Enables inventory movement analysis
 * 
 * TRANSACTION TYPES:
 * - STOCK_IN: Purchase, restock, return from customer
 * - STOCK_OUT: Sale, damage, theft, sample
 * - ADJUSTMENT: Manual correction, audit adjustment
 * - RESERVE: Stock reserved for order
 * - RELEASE: Reserved stock released (order cancelled)
 * - TRANSFER: Move between warehouses
 * ========================================================================
 */

const inventoryLedgerSchema = new mongoose.Schema({

    // ========================================================================
    // 1. REFERENCE LINKS
    // ========================================================================

    inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryMaster',
        required: true,
        index: true
    },

    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true,
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

    // ========================================================================
    // 2. TRANSACTION DETAILS
    // ========================================================================

    transactionType: {
        type: String,
        enum: [
            'STOCK_IN',        // Adding stock
            'STOCK_OUT',       // Removing stock
            'ADJUSTMENT',      // Manual adjustment
            'RESERVE',         // Reserve for order
            'RELEASE',         // Release reservation
            'TRANSFER',        // Warehouse transfer
            'ORDER_DEDUCT',    // Order confirmed
            'ORDER_CANCEL',    // Order cancelled (restore)
            'RETURN_RESTORE'   // Customer return (restore)
        ],
        required: true,
        index: true
    },

    quantity: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return v !== 0; // Quantity cannot be zero
            },
            message: 'Quantity cannot be zero'
        }
    },

    // ========================================================================
    // 3. STOCK SNAPSHOT (Before & After)
    // ========================================================================

    stockBefore: {
        total: { type: Number, required: true },
        reserved: { type: Number, required: true },
        available: { type: Number, required: true }
    },

    stockAfter: {
        total: { type: Number, required: true },
        reserved: { type: Number, required: true },
        available: { type: Number, required: true }
    },

    // ========================================================================
    // 4. REASON & CONTEXT
    // ========================================================================

    reason: {
        type: String,
        required: true,
        enum: [
            // Stock In Reasons
            'PURCHASE_RECEIVED',
            'STOCK_RECEIVED',
            'CUSTOMER_RETURN',
            'TRANSFER_IN',
            'OPENING_STOCK',

            // Stock Out Reasons
            'ORDER_SALE',
            'DAMAGE',
            'THEFT',
            'LOSS',
            'SAMPLE',
            'MARKETING_USE',
            'RETURN_TO_SUPPLIER',
            'TRANSFER_OUT',

            // Adjustment Reasons
            'MANUAL_CORRECTION',
            'AUDIT_ADJUSTMENT',
            'SYSTEM_CORRECTION',

            // Automation Reasons
            'ORDER_CONFIRMED',
            'ORDER_CANCELLED',
            'ORDER_RETURNED',
            'CART_RESERVED',
            'CART_EXPIRED'
        ]
    },

    notes: {
        type: String,
        trim: true,
        maxlength: 1000
    },

    // ========================================================================
    // 5. REFERENCE DOCUMENTS
    // ========================================================================

    referenceType: {
        type: String,
        enum: ['ORDER', 'PURCHASE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'MANUAL', 'SYSTEM'],
        default: 'MANUAL'
    },

    referenceId: {
        type: String,
        trim: true,
        index: true
    },

    // ========================================================================
    // 6. VALUATION (For Accounting)
    // ========================================================================

    unitCost: {
        type: Number,
        default: 0,
        min: 0
    },

    totalValue: {
        type: Number,
        default: 0
    },

    // ========================================================================
    // 7. WAREHOUSE CONTEXT
    // ========================================================================

    warehouseId: {
        type: String,
        default: 'WH-DEFAULT'
    },

    fromWarehouse: {
        type: String
    },

    toWarehouse: {
        type: String
    },

    // ========================================================================
    // 8. AUDIT & APPROVAL
    // ========================================================================

    performedBy: {
        type: String,
        required: true,
        default: 'SYSTEM'
    },

    performedByRole: {
        type: String,
        enum: ['SYSTEM', 'ADMIN', 'INVENTORY_MANAGER', 'STOCK_CLERK', 'SUPER_ADMIN'],
        default: 'SYSTEM'
    },

    requiresApproval: {
        type: Boolean,
        default: false
    },

    approvalStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'NA'],
        default: 'NA'
    },

    approvedBy: {
        type: String
    },

    approvedAt: {
        type: Date
    },

    rejectionReason: {
        type: String
    },

    // ========================================================================
    // 9. METADATA
    // ========================================================================

    transactionDate: {
        type: Date,
        default: Date.now,
        index: true
    },

    ipAddress: {
        type: String
    },

    userAgent: {
        type: String
    },

    // Batch ID for bulk operations
    batchId: {
        type: String,
        index: true
    }

}, {
    timestamps: true // createdAt, updatedAt
});

// ========================================================================
// PRE-SAVE MIDDLEWARE
// ========================================================================

inventoryLedgerSchema.pre('save', function (next) {
    // Calculate total value
    this.totalValue = Math.abs(this.quantity) * this.unitCost;

    // Set approval status based on transaction type
    if (this.transactionType === 'ADJUSTMENT' && Math.abs(this.quantity) > 100) {
        this.requiresApproval = true;
        this.approvalStatus = 'PENDING';
    }

    next();
});

// ========================================================================
// INDEXES FOR PERFORMANCE
// ========================================================================

// Compound indexes for common queries
inventoryLedgerSchema.index({ variantId: 1, transactionDate: -1 });
inventoryLedgerSchema.index({ productId: 1, transactionType: 1 });
inventoryLedgerSchema.index({ sku: 1, transactionDate: -1 });
inventoryLedgerSchema.index({ transactionType: 1, transactionDate: -1 });
inventoryLedgerSchema.index({ performedBy: 1, transactionDate: -1 });
inventoryLedgerSchema.index({ batchId: 1 });
inventoryLedgerSchema.index({ referenceType: 1, referenceId: 1 });

// ========================================================================
// STATIC METHODS
// ========================================================================

// Get transaction history for a variant
inventoryLedgerSchema.statics.getVariantHistory = async function (variantId, limit = 50) {
    return this.find({ variantId })
        .sort({ transactionDate: -1 })
        .limit(limit)
        .lean();
};

// Get stock movement summary
inventoryLedgerSchema.statics.getMovementSummary = async function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                transactionDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },
        {
            $group: {
                _id: '$transactionType',
                totalQuantity: { $sum: '$quantity' },
                totalValue: { $sum: '$totalValue' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { totalQuantity: -1 }
        }
    ]);
};

// Get user activity report
inventoryLedgerSchema.statics.getUserActivity = async function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                performedBy: userId,
                transactionDate: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$transactionType',
                count: { $sum: 1 },
                totalQuantity: { $sum: { $abs: '$quantity' } }
            }
        }
    ]);
};

const InventoryLedger = mongoose.model('InventoryLedger', inventoryLedgerSchema);

export default InventoryLedger;
