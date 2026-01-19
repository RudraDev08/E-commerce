import express from "express";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../../controllers/Brands/BrandsController.js";
import upload from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/", upload.single("logo"), createBrand);
router.get("/", getAllBrands);
router.get("/:id", getBrandById);
router.put("/:id", upload.single("logo"), updateBrand);
router.delete("/:id", deleteBrand);

export default router;
