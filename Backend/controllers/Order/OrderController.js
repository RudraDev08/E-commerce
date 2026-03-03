import Order from '../../models/Order/OrderSchema.js';
import inventoryService from '../../services/inventory.service.js';
import IdempotencyKey from '../../models/Order/IdempotencyKey.schema.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import metrics from '../../services/MetricsService.js';
import { runInTransaction } from '../../utils/transaction.util.js';

/**
 * Generate Order ID using a true UUID instead of sequential dates/counters.
 * This completely eliminates collision risks and limits predictability.
 * 
 * Format: ORD-<UUID>
 */
const generateOrderId = async () => {
    return `ORD-${crypto.randomUUID()}`;
};

// --------------------------------------------------------------------------
// CREATE ORDER
// --------------------------------------------------------------------------
export const createOrder = async (req, res) => {
    if (global.systemState && global.systemState.checkoutFrozen) {
        return res.status(503).json({
            success: false,
            message: 'Checkout is currently unavailable',
            reason: global.systemState.reason || 'System protection freeze active'
        });
    }

    const key = req.headers['idempotency-key'];
    if (!key) {
        return res.status(400).json({ success: false, message: 'Idempotency-Key required' });
    }

    // Step 9.3: Idempotency Protection
    const IdempotencyKey = mongoose.model('IdempotencyKey');
    try {
        const auditRecord = await IdempotencyKey.create({
            key,
            userId: req.user?._id || req.body.userId || "65c3f9b0e4b0a1b2c3d4e5f6",
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            status: 'PROCESSING'
        });
    } catch (err) {
        if (err.code === 11000) {
            metrics.inc('order_id_collision_attempt_total');
            const existing = await IdempotencyKey.findOne({ key });
            if (existing && existing.orderId) {
                const Order = mongoose.model('Order');
                const existingOrder = await Order.findById(existing.orderId);
                return res.json({
                    success: true,
                    message: "Order placed successfully (Idempotent)",
                    data: existingOrder
                });
            } else {
                return res.status(409).json({ success: false, message: "Request currently processing" });
            }
        }
        return res.status(500).json({ success: false, message: err.message });
    }

    metrics.inc('total_checkouts');

    try {
        let savedOrder = null;

        await runInTransaction(async (session) => {
            const {
                items,
                shippingAddress,
                paymentMethod,
                userId
            } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                throw { status: 400, message: "No items in order" };
            }

            const VariantMaster = mongoose.models.VariantMaster || mongoose.model('VariantMaster');
            const InventoryMaster = mongoose.models.InventoryMaster;
            const InventoryReservation = mongoose.models.InventoryReservation;

            let serverSubtotal = 0;
            const processedItems = [];

            const customerId = req.user?._id || userId || "65c3f9b0e4b0a1b2c3d4e5f6";

            for (const item of items) {
                metrics.inc('total_reservations');

                let dbVariant = await VariantMaster.findById(item.variantId).session(session);

                if (!dbVariant) {
                    throw { status: 400, message: `Variant ${item.variantId} not found.` };
                }

                // Step 8: Price Version Lock
                if (item.priceVersion !== undefined && dbVariant.priceVersion !== undefined) {
                    if (dbVariant.priceVersion !== item.priceVersion) {
                        metrics.inc('price_mismatch_total');
                        throw {
                            status: 409,
                            code: 'PRICE_MISMATCH',
                            message: `Price for ${dbVariant.sku || 'one of the items'} has changed since it was added to cart.`,
                            variantId: dbVariant._id
                        };
                    }
                }

                // Step 7: Allocation Failure Protection
                if (dbVariant.status?.toUpperCase() !== 'ACTIVE') {
                    metrics.inc('allocation_failure_total');
                    throw { status: 409, code: 'INSUFFICIENT_STOCK', message: `Item ${dbVariant.sku || 'selected'} is no longer active.` };
                }

                const quantity = parseInt(item.quantity, 10);
                if (isNaN(quantity) || quantity <= 0) throw { status: 400, message: "Invalid quantity" };

                // Validate Stock & Reservation
                const dbInventory = await InventoryMaster.findOne({ variantId: item.variantId }).session(session);
                if (!dbInventory || dbInventory.availableStock < quantity) {
                    metrics.inc('allocation_failure_total');
                    throw { status: 409, code: 'INSUFFICIENT_STOCK', message: `Insufficient stock for ${dbVariant.sku}` };
                }

                if (InventoryReservation) {
                    const activeReservation = await InventoryReservation.findOne({
                        userId: customerId,
                        'items.variantId': item.variantId,
                        status: 'RESERVED',
                        expiresAt: { $gt: new Date() }
                    }).session(session);

                    if (!activeReservation) {
                        metrics.inc('allocation_failure_total');
                        throw { status: 409, code: 'RESERVATION_EXPIRED', message: `Reservation expired or not found for ${dbVariant.sku}` };
                    }
                }

                let truePrice = 0;
                if (dbVariant.resolvedPrice) truePrice = parseFloat(dbVariant.resolvedPrice.toString());
                else if (dbVariant.price) truePrice = parseFloat(dbVariant.price.toString());

                const itemTotal = truePrice * quantity;
                serverSubtotal += itemTotal;

                processedItems.push({
                    productId: dbVariant.productGroupId || dbVariant.product,
                    variantId: dbVariant._id,
                    productName: dbVariant.name || 'Product',
                    sku: dbVariant.sku || 'N/A',
                    variantAttributes: dbVariant.attributes || {},
                    image: dbVariant.images?.[0]?.url || '',
                    quantity: quantity,
                    price: truePrice,
                    priceVersion: dbVariant.priceVersion,
                    total: itemTotal
                });
            }

            const serverTax = parseFloat((serverSubtotal * 0.18).toFixed(2));
            const serverGrandTotal = serverSubtotal + serverTax;

            // 3. Generate true UUID Order ID (Step 8.1)
            const orderId = `ORD-${crypto.randomUUID()}`;

            // 4. Create Order Object
            const newOrder = new Order({
                orderId,
                customer: req.user?._id || userId || "65c3f9b0e4b0a1b2c3d4e5f6",
                items: processedItems,
                shippingAddress,
                financials: {
                    subtotal: serverSubtotal,
                    taxTotal: serverTax,
                    grandTotal: serverGrandTotal,
                    paymentMethod,
                    paymentStatus: 'pending'
                },
                status: 'pending',
                timeline: [{ status: 'pending', note: 'Order initiated', user: 'customer' }]
            });

            // 5. Save Order within Transaction
            savedOrder = await newOrder.save({ session });

            // 6. ATOMIC STOCK DEDUCTION (Step 2.1)
            for (const item of processedItems) {
                try {
                    await inventoryService.deductStockForOrder(
                        item.variantId,
                        item.quantity,
                        savedOrder.orderId,
                        session
                    );
                } catch (invError) {
                    metrics.inc('allocation_failure_total');
                    throw {
                        status: 409,
                        code: 'INSUFFICIENT_STOCK',
                        message: `Stock conflict for ${item.sku}. It may have just sold out.`
                    };
                }
            }
        });

        // If we reach here, transaction committed successfully
        await IdempotencyKey.updateOne(
            { key },
            { $set: { orderId: savedOrder._id } }
        );

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: savedOrder
        });

    } catch (error) {
        console.error("Order Transaction Error:", error);
        const status = error.status || 500;
        res.status(status).json({
            success: false,
            code: error.code || 'ORDER_ERROR',
            message: error.message || "An error occurred during checkout"
        });
    } finally {
        session.endSession();
    }
};

// --------------------------------------------------------------------------
// GET ORDER BY ID
// --------------------------------------------------------------------------
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId })
            .populate('items.productId', 'slug'); // To link back to product page

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --------------------------------------------------------------------------
// GET MY ORDERS
// --------------------------------------------------------------------------
export const getMyOrders = async (req, res) => {
    try {
        // Enforce Authentication
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in to view your orders." });
        }

        const userId = req.user._id;

        // Ensure user can only query their OWN orders
        const orders = await Order.find({ customer: userId })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --------------------------------------------------------------------------
// UPDATE ORDER STATUS (Admin)
// --------------------------------------------------------------------------
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status: newStatus, note } = req.body;

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // ✅ Block Direct Manual Updates with Transition Guard
        const allowed = ORDER_TRANSITIONS[order.status] || [];
        if (!allowed.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: `Illegal order transition: ${order.status} → ${newStatus}`
            });
        }

        order.status = newStatus;
        order.timeline.push({
            status: newStatus,
            note: note || `Order status updated to ${newStatus}`,
            user: 'admin'
        });

        await order.save();

        res.json({ success: true, message: "Order status updated", data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --------------------------------------------------------------------------
// PAYMENT WEBHOOK (Async Stock Restore)
// --------------------------------------------------------------------------
export const handlePaymentWebhook = async (req, res) => {
    const mongoose = (await import('mongoose')).default;
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const { orderId, paymentStatus } = req.body;

            const order = await Order.findById(orderId).session(session);
            if (!order) {
                throw { status: 404, message: "Order not found" };
            }

            // Only act if currently pending
            if (order.financials.paymentStatus === 'pending') {
                if (paymentStatus === 'failed') {
                    order.financials.paymentStatus = 'failed';
                    order.status = 'cancelled';
                    order.timeline.push({ status: 'cancelled', note: 'Payment failed automatically', user: 'system' });
                    await order.save({ session });

                    // Auto-restore stock
                    for (const item of order.items) {
                        await inventoryService.restoreStockForCancelledOrder(
                            item.variantId,
                            item.quantity,
                            order.orderId
                        );
                    }
                } else if (paymentStatus === 'paid') {
                    order.financials.paymentStatus = 'paid';
                    order.timeline.push({ status: 'processing', note: 'Payment successful', user: 'system' });
                    await order.save({ session });
                }
            }
        });

        res.json({ success: true, message: "Webhook processed" });
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(error.status || 500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
