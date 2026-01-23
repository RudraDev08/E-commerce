import express from "express";
import * as ctrl from "../../controllers/variant/productVariantController.js";

const router = express.Router();

router.post("/", ctrl.createVariant);
router.get("/", ctrl.getVariants);
router.put("/:id", ctrl.updateVariant);
router.delete("/:id", ctrl.deleteVariant);
router.patch("/:id/toggle", ctrl.toggleVariantStatus);

export default router;
