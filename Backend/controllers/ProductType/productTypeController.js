import ProductType from "../../models/ProductType/productTypeSchema.js";
import mongoose from "mongoose";

export const getProductTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ObjectId to prevent server crashes
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Product Type ID format" });
    }

    // 2. Find the document and Populate related data
    const productType = await ProductType.findById(id)
      .populate("category", "name slug") // Get Category Name
      .populate("attributes", "name type"); // Get Attribute Names

    // 3. Handle "Not Found" specifically
    if (!productType) {
      return res.status(404).json({ message: "Product Type not found" });
    }

    res.status(200).json(productType);
  } catch (error) {
    console.error("Error in getProductTypeById:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Create a new Product Type
// @route   POST /api/product-types
export const createProductType = async (req, res) => {
  try {
    const { name, category, attributes, hasSizeChart } = req.body;

    // Check if it already exists
    const existing = await ProductType.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Product Type already exists" });
    }

    const newType = await ProductType.create({
      name,
      category,
      attributes,
      hasSizeChart
    });

    res.status(201).json(newType);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get ALL product types (For your Dropdown)
// @route   GET /api/product-types
export const getAllProductTypes = async (req, res) => {
  try {
    const types = await ProductType.find()
      .populate("category", "name")
      .populate('productType')
      .sort({ createdAt: -1 });
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};