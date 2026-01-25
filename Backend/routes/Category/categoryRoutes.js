// Enhanced Category Routes with Full CRUD
import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryTree,
  getCategoryById,
  updateCategory,
  toggleStatus,
  toggleFeatured,
  softDelete,
  getCategoryStats,
  debugCategories,
  fixCategories
} from "../../controllers/Category/categoryController.js";
import { upload } from "../../config/multer.js";

const router = express.Router();

// Get category stats
router.get("/stats", getCategoryStats);

// Get category tree (hierarchical)
router.get("/tree", getCategoryTree);

// Get all categories (with filters)
router.get("/", getCategories);

// Get single category by ID
router.get("/:id", getCategoryById);

// Create new category (with file upload)
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  createCategory
);

// Update category (with file upload)
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  updateCategory
);

// Toggle category status
router.patch("/:id/toggle-status", toggleStatus);

// Toggle featured status
router.patch("/:id/toggle-featured", toggleFeatured);

// Soft delete category
router.delete("/:id", softDelete);

// DEBUG ROUTES (for troubleshooting)
router.get("/debug/view", debugCategories);
router.get("/debug/fix", fixCategories);

export default router;
