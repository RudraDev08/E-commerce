
import mongoose from 'mongoose';

/**
 * ========================================================================
 * BIN LOCATION SCHEMA
 * ========================================================================
 * Defines specific storage locations within a warehouse.
 */

const binLocationSchema = new mongoose.Schema({
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true,
        index: true
    },
    binCode: {
        type: String,
        required: [true, 'Bin code is required'],
        trim: true,
        uppercase: true,
        // unique: true // Scoped unique to warehouse usually, but let's keep it simple for now or use compound index
    },
    zone: { type: String, trim: true, uppercase: true },
    aisle: { type: String, trim: true },
    rack: { type: String, trim: true },
    shelf: { type: String, trim: true },

    capacity: {
        type: Number,
        default: 100
    },
    currentQuantity: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['EMPTY', 'PARTIAL', 'FULL'],
        default: 'EMPTY'
    },
    binType: {
        type: String,
        enum: ['SHELF', 'PALLET', 'FLOOR', 'HANGING', 'COLD_STORAGE'],
        default: 'SHELF'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique bin code per warehouse
binLocationSchema.index({ warehouse: 1, binCode: 1 }, { unique: true });

const BinLocation = mongoose.model('BinLocation', binLocationSchema);
export default BinLocation;
