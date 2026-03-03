/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 8 — ORDER SAFETY GUARD
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Before archiving or deleting a variant:
 *   → Check if any live orders reference it.
 *   → If > 0 orders: BLOCK delete, force archive only.
 *   → If 0 orders: allow hard delete (for DRAFT/orphan cleanup).
 *
 * Integration: Call checkVariantOrderSafety(variantId) from the controller
 *              before any variant archive/delete operation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} OrderSafetyResult
 * @property {'safe_delete'|'archive_only'} action
 * @property {number} orderCount
 * @property {number} cartCount
 * @property {number} reservationCount
 * @property {string} message
 */

/**
 * Check if a variant is safe to delete vs archive.
 * Checks Orders, Cart items, and active Reservations.
 *
 * @param {string|ObjectId} variantId
 * @returns {Promise<OrderSafetyResult>}
 */
export async function checkVariantOrderSafety(variantId) {
    const Order = mongoose.models.Order;
    const Cart = mongoose.models.Cart;
    const Reservation = mongoose.models.Reservation ||
        mongoose.models.InventoryReservation;

    // ── Orders ───────────────────────────────────────────────────────────────
    let orderCount = 0;
    if (Order) {
        orderCount = await Order.countDocuments({
            $or: [
                { 'items.variantId': variantId },
                { 'lineItems.variantId': variantId },
                { 'orderItems.variantId': variantId },
            ]
        });
    }

    // ── Cart ─────────────────────────────────────────────────────────────────
    let cartCount = 0;
    if (Cart) {
        cartCount = await Cart.countDocuments({
            $or: [
                { 'items.variantId': variantId },
                { 'cartItems.variantId': variantId },
            ]
        });
    }

    // ── Reservations ─────────────────────────────────────────────────────────
    let reservationCount = 0;
    if (Reservation) {
        reservationCount = await Reservation.countDocuments({
            variantId,
            status: { $nin: ['RELEASED', 'EXPIRED', 'CANCELLED'] }
        });
    }

    const totalReferences = orderCount + cartCount + reservationCount;

    if (totalReferences > 0) {
        return {
            action: 'archive_only',
            orderCount,
            cartCount,
            reservationCount,
            message:
                `Variant ${variantId} has live references: ` +
                `${orderCount} order(s), ${cartCount} cart(s), ${reservationCount} reservation(s). ` +
                `ARCHIVE ONLY — hard delete is prohibited to preserve referential integrity.`,
        };
    }

    return {
        action: 'safe_delete',
        orderCount: 0,
        cartCount: 0,
        reservationCount: 0,
        message: `Variant ${variantId} has no live references. Safe to hard delete.`,
    };
}

/**
 * Safely archive or delete a variant, respecting order safety rules.
 *
 * @param {string|ObjectId} variantId
 * @param {'archive'|'delete'} requestedAction  - Action requested by admin
 * @returns {Promise<{done: boolean, action: string, message: string}>}
 */
export async function safeVariantDispose(variantId, requestedAction = 'archive') {
    const VariantMaster = mongoose.models.VariantMaster;
    if (!VariantMaster) throw new Error('VariantMaster model not registered');

    const variant = await VariantMaster.findById(variantId);
    if (!variant) throw Object.assign(new Error(`Variant ${variantId} not found`), { statusCode: 404 });

    const safety = await checkVariantOrderSafety(variantId);
    console.log(`[OrderSafety] ${safety.message}`);

    // If admin requested a delete but orders exist — downgrade to archive
    if (requestedAction === 'delete' && safety.action === 'archive_only') {
        console.warn(`[OrderSafety] Downgrading delete → archive for variant ${variantId} (${safety.orderCount} orders).`);
        requestedAction = 'archive';
    }

    if (requestedAction === 'archive') {
        variant.status = 'ARCHIVED';
        await variant.save(); // post-save hook will soft-archive InventoryMaster
        return {
            done: true,
            action: 'archived',
            message: `Variant ${variantId} archived. InventoryMaster soft-archived.`,
        };
    }

    if (requestedAction === 'delete') {
        // Hard delete — only reached if safety.action === 'safe_delete'
        await VariantMaster.deleteOne({ _id: variantId });
        const InventoryMaster = mongoose.models.InventoryMaster;
        if (InventoryMaster) await InventoryMaster.deleteOne({ variantId });

        return {
            done: true,
            action: 'deleted',
            message: `Variant ${variantId} hard deleted. Orphan inventory removed.`,
        };
    }

    throw new Error(`Unknown action: ${requestedAction}`);
}
