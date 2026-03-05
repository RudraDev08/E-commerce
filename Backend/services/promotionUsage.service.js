/**
 * promotionUsageService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles promotion validation, per-user limit enforcement, atomic usageCount
 * increment, and PromotionUsage record creation.
 *
 * Called from the checkout controller AFTER the cart is validated but BEFORE
 * the Order document is committed.
 *
 * Usage example (checkout controller):
 *
 *   import promotionUsageService from '../services/promotionUsage.service.js';
 *
 *   // Inside a Mongoose session / transaction:
 *   const { finalPrice, discountAmount, appliedPromotions } =
 *       await promotionUsageService.applyAndRecord({
 *           userId,
 *           variantId,
 *           categoryIds,
 *           basePrice,
 *           couponCode,        // optional
 *           orderId,           // optional — pass after Order is created
 *           session            // mongoose session — optional but recommended
 *       });
 */

import mongoose from 'mongoose';
import PromotionMaster from '../models/masters/PromotionMaster.model.js';
import PromotionUsage from '../models/masters/PromotionUsage.model.js';

class PromotionUsageService {

    /**
     * Resolve, validate, apply, and record promotions for a checkout item.
     *
     * @param {object} opts
     * @param {ObjectId} opts.userId
     * @param {ObjectId} opts.variantId
     * @param {ObjectId[]} opts.categoryIds
     * @param {number}   opts.basePrice
     * @param {string}   [opts.couponCode]
     * @param {ObjectId} [opts.orderId]           — attach to usage record
     * @param {ClientSession} [opts.session]       — MongoDB session
     *
     * @returns {{ finalPrice, discountAmount, appliedPromotions[] }}
     */
    async applyAndRecord({ userId, variantId, categoryIds = [], basePrice, couponCode, orderId = null, session }) {
        const now = new Date();

        // ── 1. Build scope filter ──────────────────────────────────────────────
        const scopeFilter = {
            status: 'ACTIVE',
            startsAt: { $lte: now },
            endsAt: { $gte: now },
            $or: [
                { applicableVariants: { $size: 0 } },           // Global
                { applicableVariants: variantId },
                { applicableCategories: { $in: categoryIds } }
            ]
        };

        if (couponCode) scopeFilter.code = couponCode.toUpperCase().trim();

        // ── 2. Fetch eligible promotions ───────────────────────────────────────
        const promotions = await PromotionMaster.find(scopeFilter)
            .sort({ priority: -1, createdAt: 1 })
            .lean();

        if (!promotions.length) {
            return { finalPrice: basePrice, discountAmount: 0, appliedPromotions: [] };
        }

        // ── 3. Per-user usage counts (one batch query) ─────────────────────────
        const promoIds = promotions.map(p => p._id);
        const usageDocs = await PromotionUsage.find(
            { promotionId: { $in: promoIds }, userId },
            { promotionId: 1 }
        ).lean();

        const userUsageMap = usageDocs.reduce((map, doc) => {
            const key = doc.promotionId.toString();
            map[key] = (map[key] || 0) + 1;
            return map;
        }, {});

        // ── 4. Apply sequentially in priority order ────────────────────────────
        let price = basePrice;
        let canStack = true;
        const applied = [];
        const toRecord = [];

        for (const promo of promotions) {
            // 4a. Stop stacking if previous promo was non-stackable / exclusive
            if (!canStack) break;
            if (promo.exclusive && applied.length > 0) continue;

            // 4b. Global usage cap
            if (promo.maxUsageTotal !== null && promo.usageCount >= promo.maxUsageTotal) {
                continue;
            }

            // 4c. Per-user cap
            if (promo.maxUsagePerUser !== null) {
                const userCount = userUsageMap[promo._id.toString()] || 0;
                if (userCount >= promo.maxUsagePerUser) continue;
            }

            // 4d. Calculate discount
            let discountAmt = 0;
            if (promo.type === 'PERCENT') {
                discountAmt = +(price * (promo.value / 100)).toFixed(2);
            } else if (promo.type === 'FIXED') {
                discountAmt = Math.min(promo.value, price);
            } else if (promo.type === 'FREE_SHIPPING') {
                // Signal to checkout to zero out shipping cost
                discountAmt = 0;
            }
            // BUY_X_GET_Y is handled at cart level (multi-item), not per-variant

            if (discountAmt < 0) continue;

            price = Math.max(0, +(price - discountAmt).toFixed(2));

            applied.push({
                promotionId: promo._id,
                name: promo.name,
                code: promo.code,
                type: promo.type,
                value: promo.value,
                discountAmount: discountAmt,
                stackable: promo.stackable,
                exclusive: promo.exclusive
            });

            toRecord.push({ promo, discountAmt });

            if (!promo.stackable || promo.exclusive) canStack = false;
        }

        // ── 5. Atomically increment usageCount + create PromotionUsage ─────────
        await Promise.all(toRecord.map(async ({ promo, discountAmt }) => {
            // 5a. Atomic increment (findOneAndUpdate so no race condition)
            await PromotionMaster.findOneAndUpdate(
                { _id: promo._id },
                { $inc: { usageCount: 1 } },
                { session }
            );

            // 5b. Create usage record for per-user tracking
            await PromotionUsage.create([{
                promotionId: promo._id,
                userId,
                orderId,
                couponCode: promo.code,
                discountAmount: discountAmt
            }], { session });
        }));

        return {
            finalPrice: price,
            discountAmount: +(basePrice - price).toFixed(2),
            appliedPromotions: applied
        };
    }

    /**
     * Count how many times a user has used a specific promotion.
     */
    async getUserUsageCount(userId, promotionId) {
        return PromotionUsage.countDocuments({ userId, promotionId });
    }

    /**
     * Check if a coupon code is valid for a given user right now.
     * Does NOT apply or record anything.
     */
    async validateCoupon(couponCode, userId) {
        const now = new Date();
        const promo = await PromotionMaster.findOne({
            code: couponCode.toUpperCase().trim(),
            status: 'ACTIVE',
            startsAt: { $lte: now },
            endsAt: { $gte: now }
        }).lean();

        if (!promo) return { valid: false, reason: 'Coupon not found or expired' };
        if (promo.maxUsageTotal !== null && promo.usageCount >= promo.maxUsageTotal) {
            return { valid: false, reason: 'Coupon usage limit reached' };
        }
        if (promo.maxUsagePerUser !== null) {
            const used = await this.getUserUsageCount(userId, promo._id);
            if (used >= promo.maxUsagePerUser) {
                return { valid: false, reason: 'You have already used this coupon the maximum number of times' };
            }
        }

        return {
            valid: true,
            promotion: {
                _id: promo._id,
                name: promo.name,
                type: promo.type,
                value: promo.value,
                description: promo.description
            }
        };
    }
}

export default new PromotionUsageService();
