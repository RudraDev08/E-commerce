import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    // Who
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    userEmail: { type: String },
    userRole: { type: String },

    // What
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE',
            'PUBLISH', 'UNPUBLISH', 'STATUS_CHANGE',
            'STOCK_ADJUST', 'TRANSFER_COMPLETE', 'REFUND',
            'BLOCK_USER', 'UNBLOCK_USER', 'LOGIN', 'LOGOUT'
        ],
        index: true
    },

    // On what
    entityType: {
        type: String,
        required: true,
        enum: [
            'Product', 'Variant', 'Category', 'Brand',
            'InventoryMaster', 'StockTransfer', 'CycleCount',
            'Order', 'Promotion', 'User', 'Warehouse'
        ],
        index: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    entityLabel: { type: String },   // Human-readable (sku, name, orderId…)

    // Diff
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },

    // Context
    ipAddress: { type: String },
    userAgent: { type: String },
    requestId: { type: String },

    // TTL — auto-delete audit records older than 1 year
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        index: { expireAfterSeconds: 0 }
    }
}, {
    timestamps: true,
    collection: 'audit_logs'
});

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
