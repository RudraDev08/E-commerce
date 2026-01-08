import express from "express";
import {
  getStates,
  addState,
  updateState,
  deleteState,
} from "../controllers/stateController.js";

const router = express.Router();

router.get("/", getStates);
router.post("/", addState);
router.put("/:id", updateState);
router.delete("/:id", deleteState);

export default router;
