
import mongoose from 'mongoose';
import logger from '../config/logger.js';

const reservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [{
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'VariantMaster', required: true }, // ✅ FIXED: was 'Variant'
        qty: { type: Number, required: true, min: 1 }
    }],
    expiresAt: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'RESERVED', 'CONSUMED', 'EXPIRED', 'CANCELLED'],
        default: 'PENDING',
        index: true
    },
    // Phase 2: Idempotency for consumption
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    }
}, {
    timestamps: true,
    optimisticConcurrency: true
});

// Compound index for finding expired RESERVED items
reservationSchema.index({ status: 1, expiresAt: 1 });

// Preventing over-reservation is complex. 
// Ideally, we decrement 'available' stock in InventoryMaster when reserving, 
// and increment strictly on expiration (via change stream or cron).
// For simplicity in this step, we just track the reservation.

reservationSchema.post('save', function (doc) {
    logger.info('Inventory Reservation Created', { reservationId: doc._id, userId: doc.userId, expiry: doc.expiresAt });
});

export default mongoose.model('InventoryReservation', reservationSchema);
