import Product from '../../models/Product/ProductSchema.js';
import slugify from 'slugify';

// --------------------------------------------------------------------------
// MESSAGES
// --------------------------------------------------------------------------
const MSG = {
  NOT_FOUND: 'Product not found',
  CREATED: 'Product created successfully',
  UPDATED: 'Product updated successfully',
  DELETED_SOFT: 'Product moved to trash',
  RESTORED: 'Product restored successfully',
  ERROR: 'Operation failed'
};

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------
const cleanBody = (body, files) => {
  let attributes = body.attributes;
  if (typeof attributes === 'string') {
    try {
      attributes = JSON.parse(attributes);
    } catch (e) {
      // If parsing fails, maybe it's not JSON, ignore or set empty
      attributes = undefined;
    }
  }

  const payload = {
    ...body,
    price: Number(body.price),
    basePrice: Number(body.basePrice || 0),
    stock: Number(body.stock || 0),
    minStock: Number(body.minStock || 5),
    hasVariants: body.hasVariants === 'true' || body.hasVariants === true,
    // Files
    image: files?.image?.[0]?.filename || body.image || "",
    gallery: [
      ...(Array.isArray(body.gallery) ? body.gallery : (body.gallery ? [body.gallery] : [])),
      ...(files?.gallery ? files.gallery.map(f => f.filename) : [])
    ]
  };

  if (attributes) payload.attributes = attributes;

  // Sanitize ObjectIds
  if (!payload.productType || payload.productType === 'null' || payload.productType === 'undefined') delete payload.productType;
  if (!payload.category || payload.category === 'null' || payload.category === 'undefined') delete payload.category;
  if (!payload.brand || payload.brand === 'null' || payload.brand === 'undefined') delete payload.brand;

  return payload;
};

// --------------------------------------------------------------------------
// GET ALL (with Filters, Sort, Pagination)
// --------------------------------------------------------------------------
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      brand,
      status,
      stockStatus,
      sort,
      isDeleted = 'false'
    } = req.query;

    const query = {};

    // Soft Delete
    if (isDeleted === 'true') {
      query.isDeleted = true;
    } else if (isDeleted !== 'all') {
      query.isDeleted = false;
    }

    // Search (Name or SKU)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (category && category !== 'all') query.category = category;
    if (brand && brand !== 'all') query.brand = brand;
    if (status && status !== 'all') query.status = status;

    // Stock
    if (stockStatus === 'in_stock') query.stock = { $gt: 0 };
    if (stockStatus === 'out_of_stock') query.stock = 0;

    // Sort
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'name-asc') sortOption = { name: 1 };
    if (sort === 'stock-asc') sortOption = { stock: 1 };

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .populate('productType', 'name')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// GET SINGLE
// --------------------------------------------------------------------------
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('productType', 'name');

    if (!product) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// CREATE
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// CREATE
// --------------------------------------------------------------------------
export const createProduct = async (req, res) => {
  try {
    // Handle SKU Auto-generation if empty
    let sku = req.body.sku;
    if (!sku) {
      // Robust SKU Generation: PROD-YEAR-RANDOM4
      const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
      sku = `PROD-${new Date().getFullYear()}-${random}`;
    }

    const payload = cleanBody({ ...req.body, sku }, req.files || {});

    // Check SKU uniqueness
    const existSku = await Product.findOne({ sku: payload.sku });
    if (existSku) {
      // If auto-generated one failed (rare), try one more time with timestamp
      if (!req.body.sku) {
        payload.sku = `PROD-${Date.now()}`;
      } else {
        return res.status(400).json({ success: false, message: `SKU ${payload.sku} already exists` });
      }
    }

    const product = await Product.create(payload);
    res.status(201).json({ success: true, message: MSG.CREATED, data: product });
  } catch (error) {
    console.error("Create Product Error:", error);
    // MongoDB Duplicate Key Error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate key error (Name or SKU)' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// UPDATE
// --------------------------------------------------------------------------
export const updateProduct = async (req, res) => {
  try {
    console.log("Update Payload Body:", req.body); // Debug Log
    console.log("Update Payload Files:", req.files ? Object.keys(req.files) : "No files");

    const payload = cleanBody(req.body, req.files || {});

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });
    res.json({ success: true, message: MSG.UPDATED, data: product });
  } catch (error) {
    console.error("Update Product Error:", error);

    // Mongoose Validation Error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: `Validation Error: ${messages.join(', ')}` });
    }

    // Mongoose Cast Error (Invalid ID)
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: `Invalid Data Type: ${error.message}` });
    }

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate key error (Name or SKU)' });
    }

    // Return detailed error for debugging
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// --------------------------------------------------------------------------
// HARD DELETE
// --------------------------------------------------------------------------
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });
    res.json({ success: true, message: 'Product permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// RESTORE
// --------------------------------------------------------------------------
export const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });
    res.json({ success: true, message: MSG.RESTORED });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// STATS
// --------------------------------------------------------------------------
export const getProductStats = async (req, res) => {
  try {
    const [total, active, lowStock, draft] = await Promise.all([
      Product.countDocuments({ isDeleted: false }),
      Product.countDocuments({ isDeleted: false, status: 'active' }),
      Product.countDocuments({ isDeleted: false, stock: { $lte: 5 } }),
      Product.countDocuments({ isDeleted: false, status: 'draft' })
    ]);
    res.json({ success: true, data: { total, active, lowStock, draft } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// BULK DELETE (HARD)
// --------------------------------------------------------------------------
export const bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, message: "No items selected" });

    await Product.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} products permanently deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};