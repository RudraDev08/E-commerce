import express from "express";
import mongoose from "mongoose"; // Needed for ID validation
import {
  getCities,
  getCitiesByState,
  addCity,
  updateCity,
  deleteCity,
} from "../controllers/cityController.js";

const router = express.Router();

// Middleware to validate MongoDB Object IDs
const validateId = (req, res, next) => {
  const id = req.params.id || req.params.stateId;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid ID format: ${id}` 
    });
  }
  next();
};

/* ================= ROUTES ================= */

// Get all cities
router.get("/", getCities);

// Get cities filtered by State
// Note: We apply the validateId middleware here to protect the DB
router.get("/state/:stateId", validateId, getCitiesByState);

// Add City
router.post("/", addCity);

// Update/Delete City
router.put("/:id", validateId, updateCity);
router.delete("/:id", validateId, deleteCity);

export default router;