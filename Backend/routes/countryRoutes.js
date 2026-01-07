import express from "express";
import { getCountries } from "../controllers/countryController";

const router = express.Router();

router.get("/", getCountries);

export default router;
