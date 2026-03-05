import mongoose from 'mongoose';

/**
 * PromotionUsage — tracks per-user coupon redemptions.
 *
 * Used to enforce `Promotion.maxUsagePerUser` limits.
 * One document per (userId × promotionId × orderId).
 */
const promotionUsageSchema = new mongoose.Schema({
    promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PromotionMaster',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    },
    couponCode: { type: String, uppercase: true, trim: true },
    discountAmount: { type: Number, required: true, min: 0 },
    usedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'promotion_usages'
});

// Compound index: count how many times a user used a specific promotion
promotionUsageSchema.index({ promotionId: 1, userId: 1 });

// Prevent duplicate usage record for the same order
promotionUsageSchema.index({ promotionId: 1, orderId: 1 }, { unique: true, sparse: true });

const PromotionUsage = mongoose.models.PromotionUsage ||
    mongoose.model('PromotionUsage', promotionUsageSchema);

export default PromotionUsage;
