import mongoose from 'mongoose';

const systemStateSchema = new mongoose.Schema({
    checkoutFrozen: {
        type: Boolean,
        default: false,
        required: true
    },
    reason: {
        type: String,
        default: ''
    },
    triggeredAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'systemstates'
});

export default mongoose.models.SystemState || mongoose.model('SystemState', systemStateSchema);
