import ProductType from "../../models/ProductType/productTypeSchema.js";

/* ---------------- CREATE ---------------- */
export const createProductType = async (req, res) => {
  try {
    const type = await ProductType.create(req.body);
    res.status(201).json({
      success: true,
      data: type,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create product type",
      error: error.message,
    });
  }
};

/* ---------------- GET ALL ---------------- */
export const getAllProductTypes = async (req, res) => {
  try {
    const types = await ProductType.find().populate("attributes");
    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product types",
      error: error.message,
    });
  }
};

/* ---------------- GET BY ID ---------------- */
export const getProductTypeById = async (req, res) => {
  try {
    const type = await ProductType
      .findById(req.params.id)
      .populate("attributes");

    if (!type) {
      return res.status(404).json({
        success: false,
        message: "Product type not found",
      });
    }

    res.json({
      success: true,
      data: type,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product type",
      error: error.message,
    });
  }
};

/* ---------------- UPDATE ---------------- */
export const updateProductType = async (req, res) => {
  try {
    const updated = await ProductType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("attributes");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product type not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product type",
      error: error.message,
    });
  }
};

/* ---------------- DELETE ---------------- */
export const deleteProductType = async (req, res) => {
  try {
    const deleted = await ProductType.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product type not found",
      });
    }

    res.json({
      success: true,
      message: "Product type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product type",
      error: error.message,
    });
  }
};
