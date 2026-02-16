
import mongoose from 'mongoose';

// High-Write Counter Collection
// We do NOT update this on every view/click directly on the Product doc
// to avoid lock contention.

const attributeAnalyticsSchema = new mongoose.Schema({
    // Dimension
    attributeType: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeType', required: true, index: true },
    attributeValue: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue', required: true, index: true },

    // Period (e.g., "2024-02")
    period: { type: String, required: true, index: true },

    // Metrics
    views: { type: Number, default: 0 },
    addsToCart: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 } // Computed periodically
}, {
    timestamps: true
});

// Compound index for unique upsert
attributeAnalyticsSchema.index({ attributeType: 1, attributeValue: 1, period: 1 }, { unique: true });

export default mongoose.model('AttributeAnalytics', attributeAnalyticsSchema);
