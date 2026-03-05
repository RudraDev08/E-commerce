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
    // Enhanced methods
    softDeleteProduct,
    bulkSoftDeleteProducts,
    publishProduct,
    unpublishProduct,
    duplicateProduct,
    bulkUpdateStatus,
    bulkUpdatePublishStatus,
    getProductsByPublishStatus,
    searchProducts,
    // Fix 7: Bulk edit
    bulkEditProducts
} from '../../../controllers/Product/ProductController.js';

import { upload } from "../../../config/multer.js";
import { protect } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/authorize.middleware.js';

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
router.get("/publish-status/:publishStatus", getProductsByPublishStatus);

// --------------------------------------------------------------------------
// BULK ACTIONS
// --------------------------------------------------------------------------
router.post('/bulk-delete', protect, authorize('admin'), bulkDeleteProducts);
router.post('/bulk-soft-delete', protect, authorize('admin', 'manager'), bulkSoftDeleteProducts);
router.post('/bulk-update-status', protect, authorize('admin', 'manager'), bulkUpdateStatus);
router.post('/bulk-update-publish-status', protect, authorize('admin', 'manager'), bulkUpdatePublishStatus);

// Fix 7: PATCH /api/products/bulk-edit — single updateMany(), admin/manager only
router.patch('/bulk-edit', protect, authorize('admin', 'manager'), bulkEditProducts);

// --------------------------------------------------------------------------
// SINGLE PRODUCT ACTIONS
// --------------------------------------------------------------------------
router.patch('/:id/publish', protect, authorize('admin', 'manager'), publishProduct);
router.patch('/:id/unpublish', protect, authorize('admin', 'manager'), unpublishProduct);
router.post('/:id/duplicate', protect, authorize('admin', 'manager'), duplicateProduct);
router.patch('/:id/soft-delete', protect, authorize('admin', 'manager'), softDeleteProduct);
router.patch('/:id/restore', protect, authorize('admin', 'manager'), restoreProduct);

// --------------------------------------------------------------------------
// CRUD OPERATIONS
// --------------------------------------------------------------------------
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

router.post(
    '/',
    protect,
    authorize('admin', 'manager'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 10 }
    ]),
    createProduct
);

router.put(
    '/:id',
    protect,
    authorize('admin', 'manager'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 10 }
    ]),
    updateProduct
);

router.patch(
    '/:id',
    protect,
    authorize('admin', 'manager'),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 10 }
    ]),
    updateProduct
);

router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;
