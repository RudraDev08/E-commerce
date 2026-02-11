
import mongoose from 'mongoose';

/**
 * ========================================================================
 * CYCLE COUNT SCHEMA
 * ========================================================================
 * Tracks inventory auditing sessions.
 */

const cycleCountSchema = new mongoose.Schema({
    countNumber: {
        type: String,
        required: true,
        unique: true
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true,
        index: true
    },
    countType: {
        type: String,
        enum: ['FULL', 'ABC', 'RANDOM', 'ADHOC'],
        default: 'ADHOC'
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'],
        default: 'SCHEDULED',
        index: true
    },
    assignedTo: {
        type: String // UserId
    },
    scheduledDate: {
        type: Date
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },

    items: [{
        inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryMaster' }, // Remapped to Variant
        variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
        sku: String,
        systemQuantity: Number, // Snapshot at start
        countedQuantity: Number,
        variance: Number,
        notes: String,
        status: {
            type: String,
            enum: ['PENDING', 'MATCH', 'VARIANCE', 'ADJUSTED'],
            default: 'PENDING'
        }
    }],

    summary: {
        totalItems: { type: Number, default: 0 },
        itemsCounted: { type: Number, default: 0 },
        totalVariance: { type: Number, default: 0 },
        adjustmentsMade: { type: Number, default: 0 }
    },

    createdBy: String,
    notes: String

}, {
    timestamps: true
});

const CycleCount = mongoose.model('CycleCount', cycleCountSchema);
export default CycleCount;
