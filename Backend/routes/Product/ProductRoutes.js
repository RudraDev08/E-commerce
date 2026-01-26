import express from 'express';
import {
  getProducts,
  getFilterOptions,
  createProduct,
  updateProduct,
  bulkUpdateProducts,
  deleteProduct,
  bulkDeleteProducts,
  getProductById
} from '../../controllers/Product/ProductController.js';

const router = express.Router();

// Get all products with filters
router.get('/', getProducts);

// Get filter options (categories, brands)
router.get('/filter-options', getFilterOptions);

// Get single product
router.get('/:id', getProductById);

// Create product
router.post('/', createProduct);

// Update product
router.put('/:id', updateProduct);

// Bulk update products
router.put('/bulk/update', bulkUpdateProducts);

// Delete product
router.delete('/:id', deleteProduct);

// Bulk delete products
router.delete('/bulk/delete', bulkDeleteProducts);

export default router;