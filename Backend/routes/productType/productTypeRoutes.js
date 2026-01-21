import express from "express";
import { createProductType, getProductType } from "../../controllers/ProductType/productTypeController.js";

const router = express.Router();

router.post("/", createProductType);
router.get("/:id", getProductType);

export default router;
