import express from "express";
import { 
  createProductType, 
  getAllProductTypes, 
  getProductTypeById 
} from "../../controllers/ProductType/productTypeController.js";

const router = express.Router();

router.route("/")
  .post(createProductType)
  .get(getAllProductTypes);

// This is the specific route failing in your log
router.route("/:id")
  .get(getProductTypeById);

export default router;