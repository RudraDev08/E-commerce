import express from "express";
import {
  getCountries,
  getStates,
  getCities
} from "../controllers/locationController.js";

const router = express.Router();

// 🔥 THESE PATHS MUST EXIST
router.get("/countries", getCountries);
router.get("/states", getStates);
router.get("/cities", getCities);

export default router;
