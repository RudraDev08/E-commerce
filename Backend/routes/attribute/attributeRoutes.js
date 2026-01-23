import express from "express";
import {
  createAttribute,
  getAllAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
} from "../../controllers/attribute/attributeController.js";

const router = express.Router();

router.post("/", createAttribute);          // CREATE
router.get("/", getAllAttributes);           // READ ALL
router.get("/:id", getAttributeById);        // READ ONE
router.put("/:id", updateAttribute);         // UPDATE
router.delete("/:id", deleteAttribute);      // DELETE

export default router;
