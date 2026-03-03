/**
 * Cart Routes
 * POST /api/cart/validate — FIX 3 (cart revalidation)
 */
import express from 'express';
import { validateCart } from '../../controllers/cart/cartController.js';

const router = express.Router();

// No auth required — customer validates before checkout
// Rate-limited by the global apiLimiter
router.post('/validate', validateCart);

export default router;
