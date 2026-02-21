import mongoose from 'mongoose';

const productGroupSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        default: 'GLOBAL'
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    baseDescription: {
        type: String
    },
    cacheVersion: {
        type: Number,
        default: 1
    }, // Vital for Redis Invalidation
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
        default: 'DRAFT'
    }
}, {
    timestamps: true,
    optimisticConcurrency: true
});

// Read optimization
productGroupSchema.index({ tenantId: 1, status: 1 });

export default mongoose.models.ProductGroupMaster || mongoose.model('ProductGroupMaster', productGroupSchema);
