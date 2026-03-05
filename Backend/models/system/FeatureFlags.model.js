import mongoose from 'mongoose';

const featureFlagSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    enabled: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const FeatureFlags = mongoose.models.FeatureFlags || mongoose.model('FeatureFlags', featureFlagSchema);
export default FeatureFlags;
