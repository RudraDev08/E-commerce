import express from "express";
import {
  addPincode,
  getPincodes,
  updatePincode,
  deletePincode
} from "../controllers/pincodeController.js";

const router = express.Router();

router.post("/", addPincode);
router.get("/", getPincodes);
router.put("/:id", updatePincode);
router.delete("/:id", deletePincode);

export default router;
