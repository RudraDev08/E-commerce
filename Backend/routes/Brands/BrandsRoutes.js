import express from "express";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  restoreBrand,
  getBrandStats,
  toggleBrandStatus
} from "../../controllers/Brands/BrandsController.js";

import { upload } from "../../config/multer.js"; // Use the central multer config

const router = express.Router();

// Stats
router.get("/stats", getBrandStats);

// CRUD
router.get("/", getAllBrands);
router.get("/:id", getBrandById);

router.post(
  "/",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  createBrand
);

router.put(
  "/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  updateBrand
);

// Actions
router.patch("/:id/toggle-status", toggleBrandStatus);
router.patch("/:id/restore", restoreBrand);
router.delete("/:id", deleteBrand);

export default router;
