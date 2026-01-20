import Product from "../../models/Product/ProductSchema.js";
import slugify from "slugify";

/* CREATE */
export const createProduct = async (req, res) => {
  try {
    const { name, price, stock, brandId, description, status, isFeatured } = req.body;

    if (!name || !price || !brandId) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const slug = slugify(name, { lower: true });

    const product = await Product.create({
      name,
      slug,
      price,
      stock: Number(stock || 0),
      brandId,
      description,
      status: status === "true" || status === true,
      isFeatured: isFeatured === "true" || isFeatured === true,
      image: req.file?.filename || "",
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* READ ALL */
export const getProducts = async (req, res) => {
  const products = await Product.find().populate("brandId", "name");
  res.json({ success: true, data: products });
};

/* READ ONE */
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Not found" });
  res.json({ success: true, data: product });
};

/* UPDATE */
export const updateProduct = async (req, res) => {
  const updates = req.body;
  if (req.file) updates.image = req.file.filename;

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
  });

  res.json({ success: true, data: product });
};

/* DELETE */
export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Product deleted" });
};
