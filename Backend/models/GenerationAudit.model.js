/**
 * GenerationAudit — Audit trail for every Cartesian generate call  (SECTION 10)
 * ────────────────────────────────────────────────────────────────
 * Provides forensic traceability for catalog managers:
 *   • Who triggered generation
 *   • Which axes/values were selected
 *   • How many variants were created vs skipped
 *   • Duration for performance monitoring
 *   • Correlation via batchId back to VariantMaster.generationBatchId
 */

import mongoose from 'mongoose';

const GenerationAuditSchema = new mongoose.Schema(
    {
        batchId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        productGroupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductGroupMaster',
            required: true,
            index: true,
        },

        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        action: {
            type: String,
            enum: ['GENERATE', 'PREVIEW', 'ARCHIVE_BATCH'],
            required: true,
            default: 'GENERATE',
        },

        // Snapshot of exactly which axes and values were requested
        axesSnapshot: {
            type: mongoose.Schema.Types.Mixed,  // { color: [ids], size: [ids], attrs: [{id, values}] }
            required: true,
        },

        result: {
            totalGenerated: { type: Number, default: 0 },
            totalSkipped: { type: Number, default: 0 },
            raceDuplicates: { type: Number, default: 0 },
            durationMs: { type: Number, default: 0 },
            error: { type: String, default: null },  // null = success
        },

        tenantId: {
            type: String,
            default: 'GLOBAL',
        },
    },
    {
        timestamps: true,  // createdAt = generation timestamp
        collection: 'generationaudits',
    }
);

// Fast query for admin dashboard: "show me all generations for product X, most recent first"
GenerationAuditSchema.index({ productGroupId: 1, createdAt: -1 }, { name: 'idx_audit_product_date' });

// Optional retention policy: TTL index to auto-expire entries older than 2 years
// Uncomment when ready to enable:
// GenerationAuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000, name: 'idx_audit_ttl' });

export default mongoose.models.GenerationAudit ||
    mongoose.model('GenerationAudit', GenerationAuditSchema);
