import express from "express";
import {
  createCategory,
  getCategoryTree,
  updateCategory,
  deleteCategory,
  // If you need the flat list for your dropdowns, ensure this is exported in controller
  // getAllCategories 
} from "../../controllers/Category/categoryController.js";

const router = express.Router();

/* -------------------------------------------------------
   CORE ENDPOINTS
------------------------------------------------------- */

// @route   POST /api/categories
// @desc    Create a new category node (handles parentId logic)
router.post("/", createCategory);

// @route   GET /api/categories/tree
// @desc    Get hierarchical tree structure (Recursive)
// NOTE: Put specific routes like "/tree" BEFORE "/:id" to avoid route conflict
router.get("/tree", getCategoryTree);

// @route   PUT /api/categories/:id
// @desc    Update full category details or partial fields
router.put("/:id", updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Remove a category (Checks for children first)
router.delete("/:id", deleteCategory);

/* -------------------------------------------------------
   OPTIONAL / HELPER ENDPOINTS
------------------------------------------------------- */

// If your frontend "Toggle Status" button uses a separate PATCH request:
// router.patch("/:id/status", updateCategory); 
// Note: Since our updateCategory handles { status }, a PUT is usually enough.

export default router;