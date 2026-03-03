import mongoose from 'mongoose';

const alertLogSchema = new mongoose.Schema({
    metric: {
        type: String,
        required: true,
        index: true
    },
    severity: {
        type: String,
        default: 'WARNING'
    },
    value: {
        type: Number,
        required: true
    },
    threshold: {
        type: Number
    },
    triggeredBy: {
        type: String,
        default: 'SYSTEM'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true,
    collection: 'alertlogs'
});

// Auto-expire logs after 30 days
alertLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });
alertLogSchema.index({ metric: 1, isActive: 1, timestamp: -1 });

export default mongoose.models.AlertLog || mongoose.model('AlertLog', alertLogSchema);

