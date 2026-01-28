import mongoose from "mongoose";

// The Cart is a temporary collection of Variants.
// It tracks live inventory validation and persists across user sessions.

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        default: null
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    // Snapshot of price when added, to detect changes later
    priceSnapshot: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    // For guest users (cookie based)
    sessionId: {
        type: String,
        index: true,
        sparse: true // Allows multiple nulls if using userId
    },
    items: [cartItemSchema],

    // Total computed values (optional for caching, usually computed on fly)
    totalQuantity: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },

    lastActive: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// INDEX: Expire abandoned carts after 30 days
cartSchema.index({ lastActive: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Ensure either userId OR sessionId is present
cartSchema.pre('save', function (next) {
    if (!this.userId && !this.sessionId) {
        next(new Error("Cart must have either a User ID or Session ID"));
    }
    next();
});

export default mongoose.model("Cart", cartSchema);
