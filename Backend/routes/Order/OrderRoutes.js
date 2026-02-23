import express from 'express';
import {
    createOrder,
    getOrderById,
    getMyOrders
} from '../../controllers/Order/OrderController.js';

import { protect } from '../../middlewares/auth.middleware.js';

const router = express.flatten ? express.Router() : express.Router();

// Create Order (Requires Auth to link to user safely without blind mocking)
router.post('/', protect, createOrder);

// Get My Orders
router.get('/my-orders', protect, getMyOrders);

// Get Single Order
router.get('/:orderId', protect, getOrderById);

export default router;
