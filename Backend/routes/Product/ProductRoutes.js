import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  bulkDeleteProducts,
  getProductStats
} from '../../controllers/Product/ProductController.js';

import { upload } from "../../config/multer.js";

const router = express.Router();

// Stats
router.get("/stats", getProductStats);

// Bulk Actions
router.post('/bulk-delete', bulkDeleteProducts);

// CRUD
router.get('/', getProducts);
router.get('/:id', getProductById);

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

router.delete('/:id', deleteProduct);
router.patch('/:id/restore', restoreProduct);

export default router;