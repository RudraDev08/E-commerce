import Category from "../../models/Category/CategorySchema.js";
import { buildTree } from "../../utils/buildTree.js";

/* ---------------- CREATE CATEGORY ---------------- */
export const createCategory = async (req, res, next) => {
  try {
    console.log("REQ BODY:", req.body);

    const { name, description, parentId, status } = req.body || {};

    // ✅ MANUAL VALIDATION
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required"
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      parentId: parentId || null,
      status: status === "inactive" ? "inactive" : "active"
    });

    res.status(201).json({ data: category });
  } catch (err) {
    console.error("CREATE CATEGORY ERROR:", err);
    next(err);
  }
};

/* ---------------- GET CATEGORIES (LIST) ---------------- */
export const getCategories = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status
    } = req.query;

    const query = { isDeleted: false };

    // ✅ SAFE STATUS FILTER
    if (status === "active" || status === "inactive") {
      query.status = status;
    }

    // ✅ SAFE SEARCH
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Category.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),

      Category.countDocuments(query)
    ]);

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    next(err);
  }
};

/* ---------------- GET CATEGORY TREE ---------------- */
export const getCategoryTree = async (req, res, next) => {
  try {
    const categories = await Category.find({
      isDeleted: false
    }).lean();

    const tree = buildTree(categories);

    res.json({ data: tree });
  } catch (err) {
    console.error("GET CATEGORY TREE ERROR:", err);
    next(err);
  }
};

/* ---------------- UPDATE CATEGORY ---------------- */
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, parentId, status } = req.body || {};

    // ✅ VALIDATE NAME IF PROVIDED
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        message: "Category name cannot be empty"
      });
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(status === "active" || status === "inactive"
          ? { status }
          : {})
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    res.json({ data: updated });
  } catch (err) {
    console.error("UPDATE CATEGORY ERROR:", err);
    next(err);
  }
};

/* ---------------- DELETE CATEGORY (SOFT DELETE) ---------------- */
export const deleteCategory = async (req, res, next) => {
  try {
    const deleted = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("DELETE CATEGORY ERROR:", err);
    next(err);
  }
};
