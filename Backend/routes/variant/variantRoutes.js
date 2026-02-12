import express from "express";
import {
  createVariants,
  getAllVariants,
  getVariantsByProduct,
  getVariantById,
  updateVariant,
  deleteVariant,
} from "../../controllers/variant/variantController.js";
import {
  generateCombinations,
  previewCombinationsEndpoint
} from "../../controllers/variantCombination.controller.js";
import { upload } from "../../config/multer.js";

const router = express.Router();

/* COMBINATION GENERATOR ROUTES */
// Generate all combinations (Storage × RAM × Color)
router.post("/generate-combinations", generateCombinations);

// Preview combinations before generating
router.post("/preview-combinations", previewCombinationsEndpoint);

/* CRUD ROUTES */
// CREATE (bulk) - Support multiple images per variant
router.post("/", upload.array('images', 10), createVariants);

// READ ALL
router.get("/", getAllVariants);

// READ BY PRODUCT
router.get("/product/:productId", getVariantsByProduct);

// READ ONE
router.get("/:id", getVariantById);

// UPDATE - Support image updates
router.put("/:id", upload.array('images', 10), updateVariant);

// DELETE
router.delete("/:id", deleteVariant);

export default router;
