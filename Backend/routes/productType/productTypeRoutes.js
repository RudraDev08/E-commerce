import express from "express";
import {
  createProductType,
  getAllProductTypes,
  getProductTypeById,
  updateProductType,
  deleteProductType,
} from "../../controllers/ProductType/productTypeController.js";

const router = express.Router();

/* CRUD ROUTES */
router.post("/", createProductType);          // CREATE
router.get("/", getAllProductTypes);           // READ ALL
router.get("/:id", getProductTypeById);        // READ ONE
router.put("/:id", updateProductType);         // UPDATE
router.delete("/:id", deleteProductType);      // DELETE

export default router;
