import express from "express";
import multer from "multer";
import * as controller from "../../controllers/Category/CategoryController.js";

const router = express.Router();

const upload = multer();

// CREATE CATEGORY
router.post(
  "/",
  upload.none(),          
  controller.createCategory
);

// LIST (pagination, search, filter)
router.get("/", controller.getCategories);

// TREE VIEW
router.get("/tree", controller.getCategoryTree);

// UPDATE CATEGORY
router.put(
  "/:id",
  upload.none(),          
  controller.updateCategory
);

// DELETE (soft delete)
router.delete("/:id", controller.deleteCategory);

export default router;
