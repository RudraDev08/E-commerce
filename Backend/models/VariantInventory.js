const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    reservedQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    reorderLevel: {
        type: Number,
        default: 0,
        min: 0
    },
    reorderQuantity: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Compound unique index: one inventory record per variant per warehouse
inventorySchema.index({ variant: 1, warehouse: 1 }, { unique: true });

// Index for low stock queries
inventorySchema.index({ quantity: 1, reorderLevel: 1 });

// Virtual for available quantity
inventorySchema.virtual('availableQuantity').get(function () {
    return Math.max(0, this.quantity - this.reservedQuantity);
});

// Virtual for needs reorder
inventorySchema.virtual('needsReorder').get(function () {
    return this.quantity <= this.reorderLevel;
});

// Static method: Get total stock for a variant across all warehouses
inventorySchema.statics.getTotalStock = async function (variantId) {
    const result = await this.aggregate([
        { $match: { variant: mongoose.Types.ObjectId(variantId) } },
        {
            $group: {
                _id: null,
                totalQuantity: { $sum: '$quantity' },
                totalReserved: { $sum: '$reservedQuantity' }
            }
        }
    ]);

    if (result.length === 0) {
        return { total: 0, available: 0, reserved: 0 };
    }

    return {
        total: result[0].totalQuantity,
        reserved: result[0].totalReserved,
        available: result[0].totalQuantity - result[0].totalReserved
    };
};

// Static method: Reserve stock
inventorySchema.statics.reserveStock = async function (variantId, warehouseId, quantity) {
    const inventory = await this.findOne({ variant: variantId, warehouse: warehouseId });

    if (!inventory) {
        throw new Error('Inventory record not found');
    }

    const available = inventory.quantity - inventory.reservedQuantity;
    if (available < quantity) {
        throw new Error(`Insufficient stock. Available: ${available}, Requested: ${quantity}`);
    }

    inventory.reservedQuantity += quantity;
    await inventory.save();

    return inventory;
};

// Static method: Release reserved stock
inventorySchema.statics.releaseStock = async function (variantId, warehouseId, quantity) {
    const inventory = await this.findOne({ variant: variantId, warehouse: warehouseId });

    if (!inventory) {
        throw new Error('Inventory record not found');
    }

    if (inventory.reservedQuantity < quantity) {
        throw new Error('Cannot release more than reserved quantity');
    }

    inventory.reservedQuantity -= quantity;
    await inventory.save();

    return inventory;
};

// Static method: Adjust stock
inventorySchema.statics.adjustStock = async function (variantId, warehouseId, adjustment, transactionType, referenceId, notes) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const inventory = await this.findOne({ variant: variantId, warehouse: warehouseId }).session(session);

        if (!inventory) {
            throw new Error('Inventory record not found');
        }

        const newQuantity = inventory.quantity + adjustment;
        if (newQuantity < 0) {
            throw new Error('Adjustment would result in negative stock');
        }

        inventory.quantity = newQuantity;
        await inventory.save({ session });

        // Create transaction record
        const InventoryTransaction = mongoose.model('InventoryTransaction');
        await InventoryTransaction.create([{
            inventory: inventory._id,
            variant: variantId,
            warehouse: warehouseId,
            transactionType,
            quantity: adjustment,
            referenceType: 'manual',
            referenceId,
            notes
        }], { session });

        await session.commitTransaction();
        return inventory;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VariantInventory', inventorySchema);
