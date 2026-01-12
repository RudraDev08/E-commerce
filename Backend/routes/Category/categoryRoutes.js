import express from "express";
import {
  createCategory,
  getAllCategories,
  toggleCategoryStatus,
  deleteCategory,
  getCategoryTree,
  updateCategory
} from "../../controllers/Category/categoryController.js";

const router = express.Router();

/* ================= CATEGORY ROUTES ================= */

router.post("/", createCategory);

router.get("/", getAllCategories);

router.get("/tree", getCategoryTree)

router.patch("/:id/status", toggleCategoryStatus);

router.delete("/:id", deleteCategory);

router.put("/:id", updateCategory);

export default router;
