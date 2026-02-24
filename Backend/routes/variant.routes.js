const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');

// ========================================
// PUBLIC ROUTES (Customer-facing)
// ========================================

/**
 * Get all variants for a product group
 * Used by Product Detail Page
 */
router.get('/group/:productGroup', variantController.getByProductGroup);

/**
 * Get available configurations for a product group
 * Returns unique sizes, colors, and attributes
 */
router.get('/group/:productGroup/configurations', variantController.getConfigurations);

/**
 * Get single variant by ID
 */
router.get('/:variantId', variantController.getById);

/**
 * Get stock information for a variant
 */
router.get('/:variantId/stock', variantController.getStock);

// ========================================
// ADMIN ROUTES (Protected)
// ========================================

/**
 * Create a new variant
 * Requires admin authentication
 */
router.post('/', variantController.create);

/**
 * Update a variant
 * Requires admin authentication
 */
router.put('/:id', variantController.update);

/**
 * Archive-to-Edit Clone Flow
 * Requires admin authentication
 */
router.post('/:id/clone', variantController.clone);

/**
 * Soft delete a variant
 * Requires admin authentication
 */
router.delete('/:id', variantController.delete);

/**
 * Adjust inventory
 * Requires admin authentication
 */
router.post('/inventory/adjust', variantController.adjustInventory);

/**
 * Add images to variant
 * Requires admin authentication
 */
router.post('/:id/images', variantController.addImages);

module.exports = router;
