import express from "express";
import {
  createProductSize,
  getProductSizes,
  updateProductSize,
  deleteProductSize,
  toggleStatus
} from "../../controllers/Size/sizeController.js";

const router = express.Router();

router.get("/", getProductSizes);
router.post("/", createProductSize);
router.put("/:id", updateProductSize);
router.delete("/:id", deleteProductSize);
router.patch("/toggle/:id", toggleStatus);

export default router;
