// src/controllers/category.controller.js
import Category from "../../models/Category/CategorySchema.js";
import { slugify } from "../../utils/slugify.js";

export const createCategory = async (req, res) => {
  const slug = slugify(req.body.name);
  const exists = await Category.findOne({ slug });
  if (exists) return res.status(400).json({ message: "Category exists" });

  const category = await Category.create({
    ...req.body,
    slug,
    icon: req.files?.icon?.[0]?.path,
    thumbnail: req.files?.thumbnail?.[0]?.path,
    banner: req.files?.banner?.[0]?.path
  });

  res.status(201).json(category);
};

export const getCategories = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = {
    isDeleted: false,
    name: { $regex: search, $options: "i" }
  };

  const categories = await Category.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ priority: 1 });

  const total = await Category.countDocuments(query);

  res.json({ data: categories, total });
};

export const getCategoryTree = async (_, res) => {
  const categories = await Category.find({ isDeleted: false }).lean();

  const buildTree = (parent = null) =>
    categories
      .filter(c => String(c.parent) === String(parent))
      .map(c => ({ ...c, children: buildTree(c._id) }));

  res.json(buildTree());
};

export const softDelete = async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.json({ message: "Category deleted" });
};
