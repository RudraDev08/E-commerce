import Category from "../../models/Category/categorySchema.js";

/* ================= ADD CATEGORY ================= */
export const createCategory = async (req, res) => {
  try {
    const { name, type, parentId, order, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    if (type === "SUB" && !parentId) {
      return res.status(400).json({ message: "Parent category required" });
    }

    const category = await Category.create({
      name,
      type,
      parentId: type === "SUB" ? parentId : null,
      order,
      icon
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL CATEGORIES ================= */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= TOGGLE STATUS ================= */
export const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.status = !category.status;
    await category.save();

    // 🔥 Zepto rule: if MAIN inactive → SUB inactive
    if (category.type === "MAIN" && category.status === false) {
      await Category.updateMany(
        { parentId: category._id },
        { status: false }
      );
    }

    res.json({ message: "Status updated", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
