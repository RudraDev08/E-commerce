
import mongoose from 'mongoose';

/**
 * ========================================================================
 * STOCK TRANSFER SCHEMA
 * ========================================================================
 * Tracks movement of stock between warehouses.
 */

const stockTransferSchema = new mongoose.Schema({
    transferNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    sourceWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    destinationWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    items: [{
        variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 }
    }],
    status: {
        type: String,
        enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING',
        index: true
    },
    requestedBy: {
        type: String, // UserId
        required: true
    },
    completedBy: {
        type: String // UserId
    },
    notes: {
        type: String
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
export default StockTransfer;
