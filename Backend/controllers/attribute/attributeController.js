import Attribute from "../../models/Attribute/attributeSchema.js";

/* ---------------- CREATE ---------------- */
export const createAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.create(req.body);
    res.status(201).json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create attribute",
      error: error.message,
    });
  }
};

/* ---------------- GET ALL ---------------- */
export const getAllAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find();
    res.json({
      success: true,
      data: attributes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attributes",
      error: error.message,
    });
  }
};

/* ---------------- GET BY ID ---------------- */
export const getAttributeById = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    res.json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attribute",
      error: error.message,
    });
  }
};

/* ---------------- UPDATE ---------------- */
export const updateAttribute = async (req, res) => {
  try {
    const updated = await Attribute.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update attribute",
      error: error.message,
    });
  }
};

/* ---------------- DELETE ---------------- */
export const deleteAttribute = async (req, res) => {
  try {
    const deleted = await Attribute.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    res.json({
      success: true,
      message: "Attribute deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete attribute",
      error: error.message,
    });
  }
};
