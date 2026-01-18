import express from 'express';
import categoryController from '../../controllers/Category/CategoryController.js';
import { uploadCategoryImage } from '../../middlewares/upload.middleware.js';
// import { validateCategory, validateId, validateQuery } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// Get category tree (hierarchical structure)
router.get('/tree', categoryController.getTree);

// Get active parent categories for dropdown
router.get('/parents', categoryController.getParents);

// Get all categories with filters and pagination
router.get('/', categoryController.getAll);

// Get single category by ID
router.get('/:id', categoryController.getById);

// Create new category
router.post('/', uploadCategoryImage,  categoryController.create);

// Update category
router.put('/:id',  uploadCategoryImage,  categoryController.update);

// Soft delete category
router.delete('/:id', categoryController.delete);

export default router;