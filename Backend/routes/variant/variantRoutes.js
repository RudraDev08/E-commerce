import express from "express";
import {
  createVariants,
  getVariantsByProduct
} from "../../controllers/variant/variantController.js";

const router = express.Router();

router.post("/", createVariants);
router.get("/:productId", getVariantsByProduct);

export default router;
