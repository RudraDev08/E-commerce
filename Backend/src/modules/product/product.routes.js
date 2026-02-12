import express from 'express';
import {
    getProducts,
    getProductById,
    getProductBySlug,
    getFeaturedProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    bulkDeleteProducts,
    getProductStats,
    // New enhanced methods
    softDeleteProduct,
    bulkSoftDeleteProducts,
    publishProduct,
    unpublishProduct,
    duplicateProduct,
    bulkUpdateStatus,
    bulkUpdatePublishStatus,
    getProductsByPublishStatus,
    searchProducts
} from '../../../controllers/Product/ProductController.js';

import { upload } from "../../../config/multer.js";

const router = express.Router();

// --------------------------------------------------------------------------
// STATS & ANALYTICS
// --------------------------------------------------------------------------
router.get("/stats", getProductStats);

// --------------------------------------------------------------------------
// SEARCH
// --------------------------------------------------------------------------
router.get("/search", searchProducts); // GET /api/products/search?q=keyword

// --------------------------------------------------------------------------
// FEATURED PRODUCTS (Customer Website)
// --------------------------------------------------------------------------
router.get("/featured", getFeaturedProducts);

// --------------------------------------------------------------------------
// PUBLISH STATUS ROUTES
// --------------------------------------------------------------------------
router.get("/publish-status/:publishStatus", getProductsByPublishStatus); // GET /api/products/publish-status/published

// --------------------------------------------------------------------------
// BULK ACTIONS
// --------------------------------------------------------------------------
router.post('/bulk-delete', bulkDeleteProducts); // Hard delete
router.post('/bulk-soft-delete', bulkSoftDeleteProducts); // Soft delete (move to trash)
router.post('/bulk-update-status', bulkUpdateStatus); // Update status (active, inactive, etc.)
router.post('/bulk-update-publish-status', bulkUpdatePublishStatus); // Update publish status

// --------------------------------------------------------------------------
// SINGLE PRODUCT ACTIONS
// --------------------------------------------------------------------------
router.patch('/:id/publish', publishProduct); // Publish product
router.patch('/:id/unpublish', unpublishProduct); // Unpublish product
router.post('/:id/duplicate', duplicateProduct); // Duplicate product
router.patch('/:id/soft-delete', softDeleteProduct); // Soft delete (move to trash)
router.patch('/:id/restore', restoreProduct); // Restore from trash

// --------------------------------------------------------------------------
// CRUD OPERATIONS
// --------------------------------------------------------------------------
router.get('/', getProducts); // GET all with filters, pagination, search
router.get('/slug/:slug', getProductBySlug); // GET by slug (for customer website)
router.get('/:id', getProductById); // GET single by ID

router.post(
    '/',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 10 }
    ]),
    createProduct
);

router.put(
    '/:id',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 10 }
    ]),
    updateProduct
);

router.delete('/:id', deleteProduct); // Hard delete

export default router;
