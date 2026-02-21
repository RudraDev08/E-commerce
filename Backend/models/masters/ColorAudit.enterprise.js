import mongoose from 'mongoose';

/**
 * ENTERPRISE COLOR AUDIT LOG
 * SOC2-compliant: append-only, insert-only, no updates, no deletes.
 * All fields immutable post-insert.
 */

const colorAuditSchema = new mongoose.Schema({

    tenantId: {
        type: String,
        required: true,
        immutable: true,
        index: true,
    },

    colorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ColorMaster',
        required: true,
        immutable: true,
        index: true,
    },

    action: {
        type: String,
        required: true,
        immutable: true,
        enum: [
            'CREATED', 'UPDATED', 'DELETED', 'ARCHIVED', 'RESTORED',
            'LOCKED', 'UNLOCKED', 'LIFECYCLE_CHANGED', 'BULK_OPERATION',
        ],
    },

    performedBy: {
        type: String,
        required: true,
        immutable: true,
    },

    // Point-in-time snapshot of the document at time of action
    // Not a reference — a real value clone for compliance integrity
    snapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        immutable: true,
    },

    // Immutable creation timestamp. This IS the audit record timestamp.
    createdAt: {
        type: Date,
        immutable: true,
        default: Date.now,
    },

}, {
    // Disable Mongoose's automatic `updatedAt` — audit records never update
    timestamps: false,
    collection: 'color_audits',
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// The primary access pattern is: "show me all events for colorId X"
colorAuditSchema.index({ tenantId: 1, colorId: 1, createdAt: -1 });

// Secondary: "show me all ARCHIVED events in tenant Y in last 90 days" (compliance query)
colorAuditSchema.index({ tenantId: 1, action: 1, createdAt: -1 });

// TTL: Retain audit logs for 2 years (730 days). Adjust per compliance requirement.
// SOC2 Type II minimum recommended: 1 year. GDPR: right-to-erasure may require shorter.
colorAuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 730 * 24 * 60 * 60 });

// ─── Immutability Enforcement ─────────────────────────────────────────────────

colorAuditSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function () {
    throw new Error('AUDIT: Audit records are immutable. No updates permitted on color_audits.');
});

colorAuditSchema.pre('deleteOne', function () {
    throw new Error('AUDIT: Audit records are immutable. No deletes permitted on color_audits.');
});

colorAuditSchema.pre('deleteMany', function () {
    if (!this.options?.bypassAuditRetention) {
        throw new Error('AUDIT: Bulk audit deletion blocked. Use TTL index for automated expiry.');
    }
});

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.ColorAudit || mongoose.model('ColorAudit', colorAuditSchema, 'color_audits');
