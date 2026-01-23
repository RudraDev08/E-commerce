import express from "express";
import {
  createVariants,
  getAllVariants,
  getVariantsByProduct,
  getVariantById,
  updateVariant,
  deleteVariant,
} from "../../controllers/variant/variantController.js";

const router = express.Router();

/* CRUD ROUTES */
router.post("/", createVariants);                   // CREATE (bulk)
router.get("/", getAllVariants);                    // READ ALL
router.get("/product/:productId", getVariantsByProduct); // READ BY PRODUCT
router.get("/:id", getVariantById);                 // READ ONE
router.put("/:id", updateVariant);                  // UPDATE
router.delete("/:id", deleteVariant);               // DELETE

export default router;
