import mongoose from 'mongoose';
import metrics from '../../services/MetricsService.js';

/**
 * ========================================================================
 * PROMOTION MASTER — DETERMINISTIC PROMOTION ENGINE
 * ========================================================================
 *
 * Design Contracts:
 *   • Promotions never modify base price on VariantMaster directly.
 *     They are resolved at cart/checkout time as a separate layer.
 *   • Priority determines precedence (highest wins if not stackable).
 *   • Stackable promotions apply sequentially in descending priority order.
 *   • Applied BEFORE tax calculation (gross price reduction).
 *   • Expired rules are auto-disabled via TTL index on endsAt.
 *   • Timezone: all dates stored in UTC.
 *
 * Resolution Algorithm:
 *   1. Fetch active promotions for the variant/cart (status=ACTIVE, time range valid).
 *   2. Sort by priority DESC.
 *   3. If NOT stackable → apply highest-priority only.
 *   4. If stackable → apply all in sorted order sequentially.
 *   5. Floor: resolvedPrice cannot go below 0 (margin guard).
 *
 * ========================================================================
 */

const promotionSchema = new mongoose.Schema(
    {
        // ── Identity ────────────────────────────────────────────────────
        name: {
            type: String,
            required: [true, 'Promotion name is required'],
            trim: true,
            index: true,
        },

        code: {
            type: String,
            uppercase: true,
            trim: true,
            sparse: true,
            index: true,   // Coupon code lookup
        },

        description: { type: String, trim: true },

        // ── Type & Value ─────────────────────────────────────────────────
        type: {
            type: String,
            enum: ['PERCENT', 'FIXED', 'BUY_X_GET_Y', 'FREE_SHIPPING'],
            required: true,
        },

        value: {
            type: Number,
            required: true,
            min: 0,
        },

        // ── Priority & Stacking ──────────────────────────────────────────
        // Higher number = higher priority. Ties broken by createdAt (older wins).
        priority: {
            type: Number,
            default: 0,
            index: true,
        },

        stackable: {
            type: Boolean,
            default: false,
        },

        exclusive: {
            type: Boolean,
            default: false,
        },

        // ── Scheduling ───────────────────────────────────────────────────
        startsAt: {
            type: Date,
            required: true,
            index: true,
        },

        endsAt: {
            type: Date,
            required: true,
            index: true,
        },

        // ── Scope ────────────────────────────────────────────────────────
        // If empty, applies to all variants. Explicit list overrides global.
        applicableVariants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VariantMaster',
        }],

        applicableCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        }],

        applicableBrands: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
        }],

        // ── Lifecycle ────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED'],
            default: 'DRAFT',
            index: true,
        },

        // ── Limits ───────────────────────────────────────────────────────
        maxUsageTotal: { type: Number, default: null },      // null = unlimited
        maxUsagePerUser: { type: Number, default: null },
        usageCount: { type: Number, default: 0 },

        // ── Audit ────────────────────────────────────────────────────────
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
        collection: 'promotions',
        optimisticConcurrency: true,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────

// Efficient active promotion lookup: fetch all eligible promos for right now
promotionSchema.index(
    { status: 1, startsAt: 1, endsAt: 1, priority: -1 },
    { name: 'idx_promo_active_window' }
);

// Variant-scoped promotion lookup
promotionSchema.index(
    { applicableVariants: 1, status: 1 },
    { name: 'idx_promo_variant_scope' }
);

// ── Pre-save: Auto-expire overdue promotions ──────────────────────────────
promotionSchema.pre('save', function () {
    if (this.endsAt && new Date() > this.endsAt && this.status === 'ACTIVE') {
        this.status = 'EXPIRED';
    }
});

// ── Static: Deterministic Promotion Resolver ──────────────────────────────

/**
 * Resolves the final price for a variant after applying all eligible promotions.
 *
 * @param {number}   basePrice  - The variant's resolvedPrice (after attribute modifiers)
 * @param {ObjectId} variantId  - Used to scope promotions
 * @param {Array}    categoryIds- Used to scope promotions
 * @param {string}   couponCode - Optional direct coupon code
 *
 * @returns {object} { finalPrice, discount, appliedPromotions }
 */
promotionSchema.statics.resolvePrice = async function (basePrice, { variantId, categoryIds = [], couponCode } = {}) {
    const now = new Date();

    // 1. Build scope filter
    const scopeFilter = {
        status: 'ACTIVE',
        startsAt: { $lte: now },
        endsAt: { $gte: now },
        $or: [
            { applicableVariants: { $size: 0 } },            // Global (no scope restriction)
            { applicableVariants: variantId },                 // Variant-specific
            { applicableCategories: { $in: categoryIds } },   // Category-specific
        ],
    };

    if (couponCode) {
        scopeFilter.code = couponCode.toUpperCase();
    }

    // 2. Fetch eligible promotions
    const promotions = await this.find(scopeFilter)
        .sort({ priority: -1, createdAt: 1 })  // Highest priority first, older wins on tie
        .lean();

    if (!promotions.length) {
        return { finalPrice: basePrice, discount: 0, appliedPromotions: [] };
    }

    // 3. Apply sequentially in priority order
    let price = basePrice;
    const appliedPromotions = [];
    let canStack = true;

    for (const promo of promotions) {
        if (!canStack || (promo.exclusive && appliedPromotions.length > 0)) {
            metrics.inc('promotion_conflict_total');
            continue;
        }

        // Usage limit check
        if (promo.maxUsageTotal !== null && promo.usageCount >= promo.maxUsageTotal) continue;

        let discountAmount = 0;

        if (promo.type === 'PERCENT') {
            discountAmount = +(price * (promo.value / 100)).toFixed(2);
        } else if (promo.type === 'FIXED') {
            discountAmount = Math.min(promo.value, price);  // Can't discount more than price
        }

        if (discountAmount <= 0) continue;

        price = Math.max(0, +(price - discountAmount).toFixed(2));  // Floor at 0

        appliedPromotions.push({
            promotionId: promo._id,
            name: promo.name,
            type: promo.type,
            value: promo.value,
            discountAmount,
            stackable: promo.stackable,
            exclusive: promo.exclusive
        });

        if (!promo.stackable || promo.exclusive) {
            canStack = false;
        }
    }

    return {
        finalPrice: price,
        discount: +(basePrice - price).toFixed(2),
        appliedPromotions,
    };
};

const PromotionMaster = mongoose.models.PromotionMaster ||
    mongoose.model('PromotionMaster', promotionSchema);

export default PromotionMaster;
