import Variant from "../../models/Variant/variantSchema.js";

/* ---------------- CREATE (MULTIPLE VARIANTS) ---------------- */
export const createVariants = async (req, res) => {
  try {
    const { productId, variants } = req.body;

    if (!productId || !Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }

    const payload = variants.map((v) => ({
      product: productId,
      attributes: v.attributes || v,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
    }));

    const created = await Variant.insertMany(payload);

    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create variants",
      error: error.message,
    });
  }
};

/* ---------------- GET ALL VARIANTS ---------------- */
export const getAllVariants = async (req, res) => {
  try {
    const variants = await Variant.find()
      .populate("product", "name");

    res.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
      error: error.message,
    });
  }
};

/* ---------------- GET VARIANTS BY PRODUCT ---------------- */
export const getVariantsByProduct = async (req, res) => {
  try {
    const variants = await Variant.find({
      product: req.params.productId,
    });

    res.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
      error: error.message,
    });
  }
};

/* ---------------- GET VARIANT BY ID ---------------- */
export const getVariantById = async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id)
      .populate("product");

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch variant",
      error: error.message,
    });
  }
};

/* ---------------- UPDATE VARIANT ---------------- */
export const updateVariant = async (req, res) => {
  try {
    const updated = await Variant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update variant",
      error: error.message,
    });
  }
};

/* ---------------- DELETE VARIANT ---------------- */
export const deleteVariant = async (req, res) => {
  try {
    const deleted = await Variant.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete variant",
      error: error.message,
    });
  }
};
