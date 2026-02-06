import express from 'express';
import { generateProductVariants, getProductVariants } from '../../controllers/unifiedVariant.controller.js';

const router = express.Router();

// Generate variants for a product
router.post('/:productId/generate', generateProductVariants);

// Get variants for a product
router.get('/:productId', getProductVariants);

export default router;
