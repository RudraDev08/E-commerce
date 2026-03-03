import express from 'express';
import {
    createOrder,
    getOrderById,
    getMyOrders,
    updateOrderStatus
} from '../../controllers/Order/OrderController.js';
import rateLimit from 'express-rate-limit';

import { protect } from '../../middlewares/auth.middleware.js';

// Phase 4: Rate limit checkout attempts (Anti-spike / Bot protection)
const checkoutLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 5,
    message: { success: false, message: 'Too many checkout requests processing. Please wait.' }
});

// Phase 11: Application Level Switch (Auto-Freeze)
const ensureCheckoutActive = (req, res, next) => {
    if (global.systemState?.checkoutFrozen) {
        return res.status(503).json({ success: false, message: 'Checkout is currently paused for system maintenance. Please try again in a few minutes.' });
    }
    next();
};

const router = express.flatten ? express.Router() : express.Router();

// Create Order (Requires Auth to link to user safely without blind mocking)
// Create Order (Requires Auth to link to user safely without blind mocking, Limiter for DDoS, Switch for Panic)
router.post('/', protect, ensureCheckoutActive, checkoutLimiter, createOrder);

// Get My Orders
router.get('/my-orders', protect, getMyOrders);

// Get Single Order
router.get('/:orderId', protect, getOrderById);

// ✅ Update Order Status (Admin)
router.put('/:orderId/status', protect, updateOrderStatus);

export default router;
