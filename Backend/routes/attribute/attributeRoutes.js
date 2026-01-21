import express from "express";
import { createAttribute, getAttributes } from "../../controllers/attribute/attributeController.js";

const router = express.Router();

router.post("/", createAttribute);
router.get("/", getAttributes);

export default router;
