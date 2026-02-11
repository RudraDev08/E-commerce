const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VariantInventory',
        required: true,
        index: true
    },
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VariantMaster',
        required: true,
        index: true
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WarehouseMaster',
        required: true,
        index: true
    },
    transactionType: {
        type: String,
        enum: ['in', 'out', 'reserved', 'released', 'adjustment', 'transfer'],
        required: true,
        index: true
    },
    quantity: {
        type: Number,
        required: true
    },
    referenceType: {
        type: String,
        enum: ['order', 'purchase', 'return', 'adjustment', 'transfer', 'manual'],
        index: true
    },
    referenceId: {
        type: String,
        index: true
    },
    notes: {
        type: String
    },
    createdBy: {
        type: String
    }
}, {
    timestamps: true
});

// Compound index for variant transaction history
transactionSchema.index({ variant: 1, createdAt: -1 });

// Compound index for warehouse transaction history
transactionSchema.index({ warehouse: 1, createdAt: -1 });

// Index for reference lookups
transactionSchema.index({ referenceType: 1, referenceId: 1 });

// Static method: Get transaction history for a variant
transactionSchema.statics.getVariantHistory = async function (variantId, limit = 50) {
    return this.find({ variant: variantId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('warehouse', 'name code')
        .lean();
};

// Static method: Get transaction history for a warehouse
transactionSchema.statics.getWarehouseHistory = async function (warehouseId, limit = 50) {
    return this.find({ warehouse: warehouseId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('variant', 'sku productName')
        .lean();
};

module.exports = mongoose.model('InventoryTransaction', transactionSchema);
