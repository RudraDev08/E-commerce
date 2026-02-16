import mongoose from "mongoose";

// The IMMUTABLE record of a completed transaction.
// Unlike Cart, this does not reference live data but stores snapshots.

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' }, // Updated ref to correct Model Name

    // Snapshot Data (Deep Isolation)
    productName: { type: String, required: true },
    sku: { type: String, required: true },

    // Human Readable Snapshot (e.g. { "Size": "XL", "Color": "Red", "Fabric": "Cotton" })
    // Used for rendering the order receipt without joining DB
    attributeSnapshot: {
        type: Map,
        of: String
    },

    // Reference IDs for Analytics/Audit (e.g. { "Size": "ID_OF_XL", "Color": "ID_OF_RED" })
    // Used for "Buy it Again" functionality or analytics if names change
    attributeIds: {
        type: Map,
        of: mongoose.Schema.Types.ObjectId
    },

    image: String,

    // Financials
    quantity: { type: Number, required: true, min: 1 },
    pricePaid: { type: Number, required: true }, // The final price actually paid per unit
    mrpSnapshot: { type: Number }, // The MRP at time of purchase
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }  // (Price + Tax) * Qty
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true,
        index: true
    }, // Friendly ID: ORD-2024-001

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: [orderItemSchema],

    // Delivery Details
    shippingAddress: {
        fullName: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        zip: String,
        country: String,
        phone: String
    },

    // Financial Summary
    financials: {
        subtotal: { type: Number, required: true },
        taxTotal: { type: Number, default: 0 },
        shippingTotal: { type: Number, default: 0 },
        discountTotal: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true },
        paymentMethod: { type: String, enum: ['card', 'upi', 'cod'], default: 'cod' },
        paymentStatus: {
            type: String,
            enum: ['pending', 'authorized', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: String
    },

    // Order Lifecycle
    status: {
        type: String,
        enum: ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending',
        index: true
    },

    fulfillment: {
        courier: String,
        trackingNumber: String,
        shippedAt: Date,
        deliveredAt: Date
    },

    // Timeline for transparency
    timeline: [{
        status: String,
        note: String,
        timestamp: { type: Date, default: Date.now },
        user: { type: String, default: 'system' } // 'system', 'admin', 'customer'
    }]
}, {
    timestamps: true
});

export default mongoose.model("Order", orderSchema);
