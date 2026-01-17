import Category from "../../models/Category/categorySchema.js";
import slugify from "slugify";

/* -------------------------------------------------------
   CREATE CATEGORY
------------------------------------------------------- */
export const createCategory = async (req, res) => {
  try {
    let {
      name,
      description = "",
      parentId = null,
      icon = "",
      displayOrder = 0
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // 🔥 FIX: Ensure parentId is strictly null or a valid ObjectId string
    if (!parentId || parentId === "" || parentId === "null" || parentId === "undefined") {
      parentId = null;
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Check uniqueness before trying to save
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "A category with this name already exists" });
    }

    let level = 0; 
    let isLeaf = true;

    if (parentId) {
      const parent = await Category.findById(parentId);
      if (!parent) {
        return res.status(404).json({ message: "Parent category not found" });
      }

      level = parent.level + 1;

      // Update parent status if it was previously a leaf
      if (parent.isLeaf) {
        await Category.findByIdAndUpdate(parentId, { isLeaf: false });
      }
    }

    const category = await Category.create({
      name,
      slug,
      description,
      parentId,
      level,
      isLeaf,
      icon,
      displayOrder
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    // Specifically handle Duplicate Key Error (E11000)
    if (err.code === 11000) {
        return res.status(400).json({ message: "Slug must be unique" });
    }
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------------------------------------
   GET CATEGORY TREE
------------------------------------------------------- */
const buildTree = (categories, parentId = null) => {
  return categories
    .filter(cat => {
      // Robust null/undefined/string comparison
      const catParentId = cat.parentId ? cat.parentId.toString() : null;
      const targetParentId = parentId ? parentId.toString() : null;
      return catParentId === targetParentId;
    })
    .map(cat => ({
      ...cat._doc,
      children: buildTree(categories, cat._id)
    }));
};

export const getCategoryTree = async (req, res) => {
  try {
    // Fetch all active categories to build the tree in one go
    const categories = await Category.find({ status: "active" })
      .sort({ displayOrder: 1 });

    const tree = buildTree(categories);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------------------------------------
   UPDATE CATEGORY
------------------------------------------------------- */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, displayOrder, status } = req.body;

    // Use findByIdAndUpdate for cleaner partial updates
    const updateData = {};
    if (name) {
        updateData.name = name;
        updateData.slug = slugify(name, { lower: true, strict: true });
    }
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (status !== undefined) updateData.status = status;

    const category = await Category.findByIdAndUpdate(
        id, 
        { $set: updateData }, 
        { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------------------------------------
   DELETE CATEGORY
------------------------------------------------------- */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const hasChildren = await Category.findOne({ parentId: id });
    if (hasChildren) {
      return res.status(400).json({ 
        message: "Please delete all sub-categories first." 
      });
    }

    const savedParentId = category.parentId;
    await Category.findByIdAndDelete(id);

    // After deletion, check if the parent should become a leaf again
    if (savedParentId) {
      const remainingChildren = await Category.countDocuments({ parentId: savedParentId });
      if (remainingChildren === 0) {
        await Category.findByIdAndUpdate(savedParentId, { isLeaf: true });
      }
    }

    res.json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};