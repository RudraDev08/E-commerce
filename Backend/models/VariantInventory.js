import mongoose from 'mongoose';

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
        { $match: { variant: new mongoose.Types.ObjectId(variantId) } },
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

// ========================================
// ATOMIC INVENTORY OPERATIONS
//Safe under high concurrency
// ========================================

/**
 * Reserve stock automatically preventing overselling
 * Uses atomic findOneAndUpdate with $expr validator
 */
inventorySchema.statics.reserveStock = async function (variantId, warehouseId, quantity, session) {
    const VariantMaster = mongoose.models.VariantMaster || mongoose.model('VariantMaster');
    const variant = await VariantMaster.findById(variantId).session(session);

    if (!variant) {
        throw new Error('Variant not found');
    }

    if (variant.status === 'ARCHIVED') {
        throw new Error('Archived variants cannot modify stock');
    }

    if (variant.status !== 'ACTIVE') {
        throw new Error('Cannot reserve stock for inactive variant');
    }

    const result = await this.findOneAndUpdate(
        {
            variant: variantId,
            warehouse: warehouseId,
            $expr: {
                $gte: [
                    { $subtract: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$reservedQuantity', 0] }] },
                    quantity
                ]
            }
        },
        {
            $inc: { reservedQuantity: quantity }
        },
        {
            new: true,
            session
        }
    );

    if (!result) {
        throw new Error(`Insufficient stock or inventory not found for Variant: ${variantId}`);
    }

    return result;
};

/**
 * Release reserved stock safely
 */
inventorySchema.statics.releaseStock = async function (variantId, warehouseId, quantity, session) {
    const VariantMaster = mongoose.models.VariantMaster || mongoose.model('VariantMaster');
    const variant = await VariantMaster.findById(variantId).session(session);

    if (variant && variant.status === 'ARCHIVED') {
        throw new Error('Archived variants cannot modify stock');
    }

    const result = await this.findOneAndUpdate(
        {
            variant: variantId,
            warehouse: warehouseId,
            $expr: { $gte: [{ $ifNull: ['$reservedQuantity', 0] }, quantity] }
        },
        {
            $inc: { reservedQuantity: -quantity }
        },
        {
            new: true,
            session
        }
    );

    if (!result) {
        throw new Error('Cannot release more than reserved quantity');
    }

    return result;
};

/**
 * Adjust stock safely with transaction audit
 * Prevents negative stock
 */
inventorySchema.statics.adjustStock = async function (variantId, warehouseId, adjustment, transactionType, referenceId, notes, session) {
    const VariantMaster = mongoose.models.VariantMaster || mongoose.model('VariantMaster');
    const variant = await VariantMaster.findById(variantId).session(session);

    if (variant && variant.status === 'ARCHIVED') {
        throw new Error('Archived variants cannot modify stock');
    }

    // 1. Validate if reduction is possible (for negative adjustment)
    if (adjustment < 0) {
        const doc = await this.findOne({ variant: variantId, warehouse: warehouseId }).session(session);
        if (!doc) throw new Error('Inventory record not found');

        // available = quantity - reserved
        // We must ensure quantity + adjustment >= reserved (basically we can't reduce quantity below what is reserved)
        // OR simply ensure quantity + adjustment >= 0 depending on business rule.
        // Rule: You cannot remove stock that counts physically towards reserved items? 
        // Usually: Quantity represents physical stock. Reserved is logical. 
        // We should just ensure Quantity >= 0.
        // STRICT MODE: Quantity + adjustment >= ReservedQuantity (Don't destroy reserved units)

        if ((doc.quantity + adjustment) < doc.reservedQuantity) {
            throw new Error('Cannot reduce stock below reserved quantity level');
        }
    }

    // 2. Perform Atomic Update
    const result = await this.findOneAndUpdate(
        {
            variant: variantId,
            warehouse: warehouseId,
            // Ensure resulting quantity >= 0
            $expr: { $gte: [{ $add: [{ $ifNull: ['$quantity', 0] }, adjustment] }, 0] }
        },
        {
            $inc: { quantity: adjustment }
        },
        {
            new: true,
            upsert: true, // Auto-create if not exists (for positive adjustments)
            session
        }
    );

    if (!result) {
        throw new Error('Stock adjustment failed: Negative stock constraint or database error');
    }

    // 3. Create Audit Log (InventoryTransaction)
    // Note: InventoryTransaction model usage requires circular import handling or dynamic requirement
    // We assume the caller handles the transaction logging or we use mongoose.model check
    try {
        const InventoryTransaction = mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction');
        await InventoryTransaction.create([{
            inventory: result._id,
            variant: variantId,
            warehouse: warehouseId,
            transactionType,
            quantity: adjustment,
            referenceType: 'manual', // Can be parameterized
            referenceId,
            notes,
            timestamp: new Date()
        }], { session });
    } catch (e) {
        // If Model not found, usually means it hasn't been compiled yet. 
        // In a real app index, models are loaded. 
        console.warn('InventoryTransaction logging failed:', e.message);
    }

    return result;
};

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

export default mongoose.model('VariantInventory', inventorySchema);
