import mongoose from 'mongoose';

/**
 * IDEMPOTENT EVENT STORE
 * Phase 1: Event Ordering & Idempotency
 * 
 * Purpose: 
 * 1. Deduplication (Reject duplicate eventIds)
 * 2. Ordering (Ignore events with stale entityVersion)
 * 3. Audit (Historical record of all system events)
 */
const eventStoreSchema = new mongoose.Schema({
    eventId: {
        type: String,
        unique: true,
        required: true,
        index: true,
        immutable: true
    },
    entityType: { type: String, required: true, index: true, immutable: true },
    entityId: { type: String, required: true, index: true, immutable: true },
    type: { type: String, required: true, index: true, immutable: true },
    entityVersion: { type: Number, required: true, immutable: true },

    payload: { type: mongoose.Schema.Types.Mixed, immutable: true },
    metadata: { type: mongoose.Schema.Types.Mixed, immutable: true },

    processedAt: { type: Date, default: Date.now, immutable: true }
}, {
    collection: 'event_store',
    versionKey: false,
    timestamps: false
});

// Compound index for entity ordering: get the latest processed version for an entity
eventStoreSchema.index({ entityType: 1, entityId: 1, entityVersion: -1 });

// Prevent any updates or deletes (Append-only)
eventStoreSchema.pre('save', function (next) {
    if (!this.isNew) return next(new Error('Event store is append-only.'));
    next();
});

export default mongoose.models.EventStore || mongoose.model('EventStore', eventStoreSchema);
