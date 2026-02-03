import express from 'express';
import {
    createOrder,
    getOrderById,
    getMyOrders
} from '../../controllers/Order/OrderController.js';

// Middleware for auth can be added later
// import { protect } from '../../middlewares/auth.js';

const router = express.flatten ? express.Router() : express.Router();

// Create Order (Public/Protected)
router.post('/', createOrder);

// Get My Orders
router.get('/my-orders', getMyOrders);

// Get Single Order
router.get('/:orderId', getOrderById);

export default router;
