// src/routes/category.routes.js
import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryTree,
  softDelete
} from "../../controllers/Category/CategoryController.js";
import { upload } from "../../config/multer.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([{ name: "icon" }, { name: "thumbnail" }, { name: "banner" }]),
  createCategory
);

router.get("/", getCategories);
router.get("/tree", getCategoryTree);
router.delete("/:id", softDelete);

export default router;
