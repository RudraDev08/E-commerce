import Category from "../../models/Category/categorySchema.js";

/* ================= CREATE CATEGORY ================= */
export const createCategory = async (req, res) => {
  try {
    const { name, type, parentId } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required"
      });
    }

    // ===== MAIN CATEGORY =====
    if (type === "MAIN") {
      const category = await Category.create({
        name,
        type
      });

      return res.status(201).json({
        success: true,
        data: category
      });
    }

    // ===== SUB CATEGORY =====
    if (type === "SUB") {
      if (!parentId) {
        return res.status(400).json({
          success: false,
          message: "Parent category id is required"
        });
      }

      const parent = await Category.findOne({
        _id: parentId,
        type: "MAIN"
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found"
        });
      }

      const subCategory = await Category.create({
        name,
        type,
        parentId
      });

      return res.status(201).json({
        success: true,
        data: subCategory
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid category type"
    });

  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= GET ALL CATEGORIES (ADMIN) ================= */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error("GET ALL CATEGORIES ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= GET CATEGORY TREE ================= */
export const getCategoryTree = async (req, res) => {
  try {
    const mainCategories = await Category.find({
      type: "MAIN"
    }).lean();

    const subCategories = await Category.find({
      type: "SUB"
    }).lean();

    const tree = mainCategories.map(main => ({
      ...main,
      children: subCategories.filter(
        sub => String(sub.parentId) === String(main._id)
      )
    }));

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error("GET CATEGORY TREE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= TOGGLE CATEGORY STATUS ================= */
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    category.status = !category.status;
    await category.save();

    // 🔥 If MAIN category disabled → disable all SUB
    if (category.type === "MAIN" && category.status === false) {
      await Category.updateMany(
        { parentId: category._id },
        { status: false }
      );
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error("TOGGLE STATUS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= DELETE CATEGORY ================= */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Prevent deleting MAIN category with children
    if (category.type === "MAIN") {
      const hasChildren = await Category.exists({ parentId: id });

      if (hasChildren) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category with sub-categories"
        });
      }
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

