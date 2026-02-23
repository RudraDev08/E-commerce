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
    const mongoose = (await import('mongoose')).default;
    const session = await mongoose.startSession();

    try {
        let savedOrder = null;

        await session.withTransaction(async () => {
            const {
                items,
                shippingAddress,
                paymentMethod,
                userId
            } = req.body;

            // 1. Basic Validation
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw { status: 400, message: "No items in order" };
            }

            const VariantMaster = mongoose.models.VariantMaster || mongoose.model('VariantMaster');
            const ProductVariant = mongoose.models.ProductVariant || mongoose.model('ProductVariant');

            let serverSubtotal = 0;
            const processedItems = [];

            // 2. Resolve Pricing & Validate Status
            for (const item of items) {
                let dbVariant = await VariantMaster.findById(item.variantId).session(session);
                if (!dbVariant) dbVariant = await ProductVariant.findById(item.variantId).session(session);

                if (!dbVariant) {
                    throw { status: 400, message: `Variant ${item.variantId} not found.` };
                }

                if (dbVariant.status?.toUpperCase() !== 'ACTIVE') {
                    throw { status: 409, code: 'INSUFFICIENT_STOCK', message: `Item ${dbVariant.sku || 'selected'} is no longer available.` };
                }

                let truePrice = 0;
                if (dbVariant.resolvedPrice) truePrice = parseFloat(dbVariant.resolvedPrice.toString());
                else if (dbVariant.price) truePrice = parseFloat(dbVariant.price.toString());

                const quantity = parseInt(item.quantity, 10);
                if (isNaN(quantity) || quantity <= 0) throw { status: 400, message: "Invalid quantity" };

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
                    total: itemTotal
                });
            }

            const serverTax = parseFloat((serverSubtotal * 0.18).toFixed(2));
            const serverGrandTotal = serverSubtotal + serverTax;

            // 3. Generate Order ID
            const orderId = await generateOrderId();

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

            // 6. ATOMIC STOCK DEDUCTION
            // This is protected by the transaction. If any deduction fails, whole order rolls back.
            for (const item of processedItems) {
                try {
                    await inventoryService.deductStockForOrder(
                        item.variantId,
                        item.quantity,
                        savedOrder.orderId,
                        session
                    );
                } catch (invError) {
                    console.error(`[Stock Error] ${invError.message}`);
                    throw {
                        status: 409,
                        code: 'INSUFFICIENT_STOCK',
                        message: `Stock conflict for ${item.sku}. It may have just sold out.`
                    };
                }
            }
        });

        // If we reach here, transaction committed successfully
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
