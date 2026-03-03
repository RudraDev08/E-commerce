import mongoose from 'mongoose';

const alertLogSchema = new mongoose.Schema({
    metric: {
        type: String,
        required: true,
        index: true
    },
    value: {
        type: Number,
        required: true
    },
    severity: {
        type: String,
        enum: ['WARNING', 'CRITICAL'],
        required: true,
        index: true
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

export default mongoose.model('AlertLog', alertLogSchema);
