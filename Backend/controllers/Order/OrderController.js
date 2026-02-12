import Order from '../../models/Order/OrderSchema.js';
import '../../src/modules/product/product.model.js';
import inventoryService from '../../services/inventory.service.js';

// Helper: Generate Order ID (ORD-YYYYMMDD-XXXX)
const generateOrderId = async () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${date}`;

    const latestOrder = await Order.findOne({ orderId: { $regex: prefix } })
        .sort({ orderId: -1 })
        .select('orderId');

    let sequence = 1;
    if (latestOrder) {
        const parts = latestOrder.orderId.split('-');
        sequence = parseInt(parts[2]) + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// --------------------------------------------------------------------------
// CREATE ORDER
// --------------------------------------------------------------------------
export const createOrder = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            paymentMethod,
            subtotal,
            tax,
            total,
            userId
        } = req.body;

        // 1. Basic Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "No items in order" });
        }

        // 2. Validate & Reserve Stock (via Inventory Master)
        for (const item of items) {
            if (!item.variantId) {
                throw new Error(`Variant ID missing for ${item.name}`);
            }
            const inventory = await inventoryService.getInventoryByVariantId(item.variantId);
            if (!inventory || inventory.availableStock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${inventory?.availableStock || 0}`);
            }
        }

        // 3. Generate Order ID
        const orderId = await generateOrderId();

        // 4. Create Order Object
        const newOrder = new Order({
            orderId,
            customer: userId || "65c3f9b0e4b0a1b2c3d4e5f6", // Mock User ID for guest/dev
            items: items.map(item => ({
                productId: item.productId,
                variantId: item.variantId || null,
                productName: item.name,
                sku: item.sku || 'N/A',
                variantAttributes: item.variant || {},
                image: item.image,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
            })),
            shippingAddress: {
                fullName: shippingAddress.fullName,
                line1: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                zip: shippingAddress.pincode,
                phone: shippingAddress.phone,
                country: 'India' // Default
            },
            financials: {
                subtotal: subtotal,
                taxTotal: tax,
                grandTotal: total,
                paymentMethod: paymentMethod,
                paymentStatus: 'pending'
            },
            status: 'pending',
            timeline: [{
                status: 'pending',
                note: 'Order placed successfully',
                user: 'customer'
            }]
        });

        // 5. Save Order
        const savedOrder = await newOrder.save();

        // 6. Deduct Stock from Inventory Master
        for (const item of items) {
            try {
                await inventoryService.deductStockForOrder(
                    item.variantId,
                    item.quantity,
                    savedOrder.orderId
                );
            } catch (invError) {
                console.error(`[Order] Failed to deduct inventory for order ${savedOrder.orderId}:`, invError);
                // In production, you might want to rollback the order creation or flag it
            }
        }

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: savedOrder
        });

    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ success: false, message: error.message });
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
        // Mock user ID until auth is fully integrated
        const userId = "65c3f9b0e4b0a1b2c3d4e5f6";

        const orders = await Order.find({ customer: userId })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
