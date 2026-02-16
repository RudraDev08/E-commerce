
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
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        qty: { type: Number, required: true, min: 1 }
    }],
    expiresAt: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'converted', 'expired'],
        default: 'active'
    }
}, { timestamps: true });

// TTL Index: Auto-expire documents after `expiresAt` passes
// Note: MongoDB TTL runs ~every 60s.
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Preventing over-reservation is complex. 
// Ideally, we decrement 'available' stock in InventoryMaster when reserving, 
// and increment strictly on expiration (via change stream or cron).
// For simplicity in this step, we just track the reservation.

reservationSchema.post('save', function (doc) {
    logger.info('Inventory Reservation Created', { reservationId: doc._id, userId: doc.userId, expiry: doc.expiresAt });
});

export default mongoose.model('InventoryReservation', reservationSchema);
