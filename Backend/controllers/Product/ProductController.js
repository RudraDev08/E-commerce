import Product from '../../src/modules/product/product.model.js';
import Category from '../../models/Category/CategorySchema.js';
import Brand from '../../models/Brands/BrandsSchema.js';
import Variant from '../../models/variant/variantSchema.js';
import InventoryMaster from '../../models/inventory/InventoryMaster.model.js';
import slugify from 'slugify';
import VariantMaster from '../../models/masters/VariantMaster.enterprise.js';

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
const parseJSON = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return undefined;
    }
  }
  return value;
};

const cleanBody = (body, files) => {
  // Parse JSON strings
  const attributes = parseJSON(body.attributes);
  const keyFeatures = parseJSON(body.keyFeatures);
  const technicalSpecifications = parseJSON(body.technicalSpecifications);
  const gallery = parseJSON(body.gallery);
  const videos = parseJSON(body.videos);
  const badges = parseJSON(body.badges);
  const tags = parseJSON(body.tags);
  const searchKeywords = parseJSON(body.searchKeywords);
  const material = parseJSON(body.material);
  const subCategories = parseJSON(body.subCategories);
  const seo = parseJSON(body.seo);
  const featuredImage = parseJSON(body.featuredImage);
  const dimensions = parseJSON(body.dimensions);
  const weight = parseJSON(body.weight);
  const visibility = parseJSON(body.visibility);

  const payload = {
    ...body,

    // Core pricing
    price: Number(body.price || 0),
    basePrice: Number(body.basePrice || 0),
    costPrice: Number(body.costPrice || 0),
    discount: Number(body.discount || 0),
    tax: Number(body.tax || 18),

    // Legacy stock (REMOVED)
    // stock: Number(body.stock || 0),
    // minStock: Number(body.minStock || 5),

    // Variant configuration
    hasVariants: body.hasVariants === 'true' || body.hasVariants === true,

    // Featured flag
    featured: body.featured === 'true' || body.featured === true,
    isFeatured: body.isFeatured === 'true' || body.isFeatured === true,

    // Display priority
    displayPriority: Number(body.displayPriority || 0),

    // Version
    version: Number(body.version || 1),

    // Arrays
    ...(keyFeatures && { keyFeatures }),
    ...(technicalSpecifications && { technicalSpecifications }),
    ...(badges && { badges }),
    ...(tags && { tags }),
    ...(searchKeywords && { searchKeywords }),
    ...(material && { material }),
    ...(subCategories && { subCategories }),
    ...(attributes && { attributes }),

    // Objects
    ...(seo && { seo }),
    ...(dimensions && { dimensions }),
    ...(weight && { weight }),
    ...(visibility && { visibility }),

    // Media - Featured Image
    // Only update featuredImage if it was provided in body (JSON edit) or files (upload)
    ...(featuredImage && { featuredImage }),

    // Legacy image support
    // IMPORTANT: Only update 'image' if a new file is uploaded or explicitly provided in body
    // If files.image exists, use it.
    // If body.image exists (e.g. keeping existing string), use it.
    // If neither, DO NOT include 'image' key so Mongoose doesn't unset it (unless we want to support explicit removal, which usually requires a separate flag like removeImage)
    ...((files?.image?.[0]?.filename || body.image) && { image: files?.image?.[0]?.filename || body.image }),

    // Gallery
    gallery: [
      ...(Array.isArray(gallery) ? gallery : (gallery ? [gallery] : [])),
      ...(files?.gallery ? files.gallery.map(f => ({ url: f.filename, alt: '', sortOrder: 0 })) : [])
    ],

    // Videos
    ...(videos && { videos })
  };

  // Sanitize ObjectIds (remove null/undefined strings)
  if (!payload.productType || payload.productType === 'null' || payload.productType === 'undefined') {
    delete payload.productType;
  }
  if (!payload.category || payload.category === 'null' || payload.category === 'undefined') {
    delete payload.category;
  }
  if (!payload.brand || payload.brand === 'null' || payload.brand === 'undefined') {
    delete payload.brand;
  }

  // Remove empty arrays
  if (payload.gallery && payload.gallery.length === 0) delete payload.gallery;
  if (payload.keyFeatures && payload.keyFeatures.length === 0) delete payload.keyFeatures;
  if (payload.badges && payload.badges.length === 0) delete payload.badges;
  if (payload.tags && payload.tags.length === 0) delete payload.tags;

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
      isDeleted = 'false',
      configured
    } = req.query;

    const query = {};

    // For configured logic, fetch productGroupIds that have at least one valid ACTIVE variant
    const activeVariants = await VariantMaster.find({
      status: 'ACTIVE',
      isDeleted: { $ne: true },
      // Price is required at schema level, so we just check for status ACTIVE
    }).select('productGroupId price status').lean();

    // Map and deduplicate product group IDs
    const activeProductIdsStr = activeVariants
      .filter(v => v.price && parseFloat(v.price.toString()) > 0) // Variant has valid price
      .map(v => v.productGroupId.toString());

    const uniqueActiveProductIds = [...new Set(activeProductIdsStr)];

    if (configured === 'true') {
      query._id = { $in: uniqueActiveProductIds };
    }

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

    // Stock - Removed from Product Service (Use Inventory Service)
    // if (stockStatus === 'in_stock') query.stock = { $gt: 0 };
    // if (stockStatus === 'out_of_stock') query.stock = 0;

    // Sort
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'name-asc') sortOption = { name: 1 };
    // if (sort === 'stock-asc') sortOption = { stock: 1 };

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .populate('productType', 'name')
      .populate('variantCount')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    const productsWithConfiguredFlag = products.map(p => {
      const pObj = p.toObject ? p.toObject() : p;
      pObj.configured = uniqueActiveProductIds.includes(p._id.toString());
      return pObj;
    });

    res.json({
      success: true,
      data: productsWithConfiguredFlag,
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
// GET BY SLUG (For Customer Website)
// --------------------------------------------------------------------------
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isDeleted: false })
      .populate({
        path: 'category',
        select: 'name slug parentId',
        populate: { path: 'parentId', select: 'name slug' }
      })
      .populate('brand', 'name slug logo')
      .populate('productType', 'name');

    if (!product) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// CREATE (Enhanced with Validations)
// --------------------------------------------------------------------------
export const createProduct = async (req, res) => {
  try {
    // ===== VALIDATION 1: Required Fields =====
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    if (!req.body.category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    if (!req.body.brand) {
      return res.status(400).json({ success: false, message: 'Brand is required' });
    }

    // ===== VALIDATION 2: Price Validation =====
    const price = Number(req.body.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    // Note: Stock is managed via Variant -> InventoryMaster auto-creation.
    // No manual 'stock' field needed on Product level anymore.

    // ===== VALIDATION 4: Category & Brand Existence =====
    const [categoryExists, brandExists] = await Promise.all([
      Category.findById(req.body.category),
      Brand.findById(req.body.brand)
    ]);

    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    if (!brandExists) {
      return res.status(400).json({ success: false, message: 'Invalid brand ID' });
    }

    // ===== VALIDATION 5: Image Requirement =====
    if (!req.files?.image && !req.body.image) {
      return res.status(400).json({ success: false, message: 'At least one product image is required' });
    }

    // ===== SKU Auto-generation =====
    let sku = req.body.sku;
    if (!sku) {
      const random = Math.floor(1000 + Math.random() * 9000);
      sku = `PROD-${new Date().getFullYear()}-${random}`;
    }

    // ===== Check SKU Uniqueness =====
    const existSku = await Product.findOne({ sku: sku.toUpperCase() });
    if (existSku) {
      if (!req.body.sku) {
        sku = `PROD-${Date.now()}`;
      } else {
        return res.status(400).json({ success: false, message: `SKU ${sku} already exists` });
      }
    }

    // ===== Calculate Discount Price =====
    const basePrice = Number(req.body.basePrice || price);
    const discount = Number(req.body.discount || 0);
    const discountPrice = discount > 0 ? price - (price * discount / 100) : price;

    // ===== Prepare Payload =====
    const payload = cleanBody({ ...req.body, sku, discountPrice }, req.files || {});
    delete payload.stock; // Ensure stock doesn't leak into Product document

    // ===== Create Product =====
    const product = await Product.create(payload);

    res.status(201).json({
      success: true,
      message: MSG.CREATED,
      data: {
        productId: product._id,
        slug: product.slug,
        product
      }
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    // MongoDB Duplicate Key Error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}: ${error.keyValue[field]} already exists`
      });
    }

    // Mongoose Validation Error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${messages.join(', ')}`
      });
    }

    // Mongoose Cast Error (Invalid ID)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid Data Type: ${error.message}`
      });
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

    // Optimistic Concurrency Control
    if (req.body.version) {
      const currentProduct = await Product.findById(req.params.id);
      if (currentProduct && currentProduct.version !== Number(req.body.version)) {
        return res.status(409).json({
          success: false,
          message: 'Conflict: Product has been modified by another user. Please reload.',
          currentVersion: currentProduct.version,
          yourVersion: Number(req.body.version)
        });
      }
    }

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

    // CASCADE HARD DELETE: Variants
    await Variant.deleteMany({ product: product._id });

    // CASCADE HARD DELETE: Inventory
    await InventoryMaster.deleteMany({ productId: product._id });

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
    const [total, active, draft] = await Promise.all([
      Product.countDocuments({ isDeleted: false }),
      Product.countDocuments({ isDeleted: false, status: 'active' }),
      Product.countDocuments({ isDeleted: false, status: 'draft' })
    ]);
    res.json({ success: true, data: { total, active, draft } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// GET FEATURED PRODUCTS (For Customer Website)
// --------------------------------------------------------------------------
export const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      featured: true,
      status: 'active',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, data: products });
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

    // CASCADE BULK HARD DELETE: Variants
    await Variant.deleteMany({ product: { $in: ids } });

    // CASCADE BULK HARD DELETE: Inventory
    await InventoryMaster.deleteMany({ productId: { $in: ids } });

    res.json({ success: true, message: `${ids.length} products permanently deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// SOFT DELETE (Move to Trash)
// --------------------------------------------------------------------------
export const softDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });

    await product.softDelete('admin');

    // CASCADE: Delete Variants
    await Variant.updateMany(
      { product: product._id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: false // inactive
        }
      }
    );

    // CASCADE: Delete Inventory
    await InventoryMaster.updateMany(
      { productId: product._id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: 'DISCONTINUED'
        }
      }
    );

    res.json({
      success: true,
      message: MSG.DELETED_SOFT,
      data: { productId: product._id }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// BULK SOFT DELETE
// --------------------------------------------------------------------------
export const bulkSoftDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: "No items selected" });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids } },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: 'admin',
        status: 'archived'
      }
    );

    // CASCADE BULK: Delete Variants
    await Variant.updateMany(
      { product: { $in: ids } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: false
        }
      }
    );

    // CASCADE BULK: Delete Inventory
    await InventoryMaster.updateMany(
      { productId: { $in: ids } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: 'DISCONTINUED'
        }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} products moved to trash`,
      data: { count: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// PUBLISH PRODUCT
// --------------------------------------------------------------------------
export const publishProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });

    await product.publish();

    res.json({
      success: true,
      message: 'Product published successfully',
      data: {
        productId: product._id,
        publishStatus: product.publishStatus,
        publishDate: product.publishDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// UNPUBLISH PRODUCT
// --------------------------------------------------------------------------
export const unpublishProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });

    await product.unpublish();

    res.json({
      success: true,
      message: 'Product unpublished successfully',
      data: {
        productId: product._id,
        publishStatus: product.publishStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// DUPLICATE PRODUCT
// --------------------------------------------------------------------------
export const duplicateProduct = async (req, res) => {
  try {
    const original = await Product.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: MSG.NOT_FOUND });

    const duplicate = await original.duplicate();
    await duplicate.save();

    res.status(201).json({
      success: true,
      message: 'Product duplicated successfully',
      data: {
        originalId: original._id,
        duplicateId: duplicate._id,
        duplicate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// BULK UPDATE STATUS
// --------------------------------------------------------------------------
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: "No items selected" });
    }

    if (!['active', 'inactive', 'draft', 'archived', 'discontinued'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { status }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} products updated to ${status}`,
      data: { count: result.modifiedCount, status }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// BULK UPDATE PUBLISH STATUS
// --------------------------------------------------------------------------
export const bulkUpdatePublishStatus = async (req, res) => {
  try {
    const { ids, publishStatus } = req.body;

    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: "No items selected" });
    }

    if (!['draft', 'published', 'scheduled', 'archived'].includes(publishStatus)) {
      return res.status(400).json({ success: false, message: "Invalid publish status" });
    }

    const updateData = { publishStatus };
    if (publishStatus === 'published') {
      updateData.publishDate = new Date();
    }

    const result = await Product.updateMany(
      { _id: { $in: ids } },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} products ${publishStatus}`,
      data: { count: result.modifiedCount, publishStatus }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// GET PRODUCTS BY PUBLISH STATUS
// --------------------------------------------------------------------------
export const getProductsByPublishStatus = async (req, res) => {
  try {
    const { publishStatus } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = {
      publishStatus,
      isDeleted: false
    };

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .sort({ createdAt: -1 })
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
// SEARCH PRODUCTS (Enhanced with Full-Text Search)
// --------------------------------------------------------------------------
export const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const products = await Product.search(q)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      data: products,
      query: q,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};