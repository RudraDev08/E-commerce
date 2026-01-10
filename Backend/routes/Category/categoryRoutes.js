import express from "express";
import {
    createCategory,
    getAllCategories,
    toggleCategoryStatus
} from "../../controllers/Category/categoryController.js";

const router = express.Router();

router.post("/", createCategory);
router.get("/", getAllCategories);
router.patch("/:id/status", toggleCategoryStatus);

export default router;
