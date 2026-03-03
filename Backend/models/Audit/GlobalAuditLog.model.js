import mongoose from 'mongoose';

/**
 * GLOBAL AUDIT LOG (SOC2 COMPLIANT)
 * Phase 8: Hardware for Flash-Sale Scale
 * 
 * Rules:
 * 1. Append-only (No updates or deletes)
 * 2. Immutable records
 * 3. Captured snapshots of sensitive data (Price, Stock)
 */
const globalAuditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, index: true, immutable: true },
    tenantId: { type: String, default: 'GLOBAL', immutable: true },
    userId: { type: String, index: true, immutable: true },
    action: {
        type: String,
        required: true,
        enum: [
            'PRICE_CHANGE',
            'STOCK_ADJUSTMENT',
            'ENTITY_LOCK',
            'ENTITY_UNLOCK',
            'SENSITIVE_DATA_ACCESS',
            'SYSTEM_CONFIG_CHANGE'
        ],
        immutable: true
    },
    entityType: { type: String, required: true, index: true, immutable: true },
    entityId: { type: String, required: true, index: true, immutable: true },

    // Snapshots
    oldValue: { type: mongoose.Schema.Types.Mixed, immutable: true },
    newValue: { type: mongoose.Schema.Types.Mixed, immutable: true },

    // Context
    requestId: { type: String, index: true, immutable: true },
    ipAddress: { type: String, immutable: true },
    userAgent: { type: String, immutable: true },
    metadata: { type: mongoose.Schema.Types.Mixed, immutable: true }
}, {
    collection: 'global_audit_logs',
    versionKey: false,
    timestamps: false
});

// Phase 5: Retention & Compliance
// 90-day retention in hot storage (Auto-deleted by MongoDB TTL, script should move to S3 before this)
globalAuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Enforce immutability via pre-save hook
globalAuditLogSchema.pre('save', function (next) {
    if (!this.isNew) return next(new Error('AUDIT_VIOLATION: Audit logs are append-only.'));
    next();
});

// Block updates and deletes at the middleware level
globalAuditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function (next) {
    next(new Error('AUDIT_VIOLATION: Modifications to the audit log are strictly forbidden.'));
});

// Compound index for entity timeline
globalAuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

export default mongoose.models.GlobalAuditLog || mongoose.model('GlobalAuditLog', globalAuditLogSchema);
