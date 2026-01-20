import Product from '../../models/Product/ProductSchema.js';

// Get all products with filters
export const getProducts = async (req, res) => {
  try {
    const { search, category, brand, stockStatus, sort } = req.query;
    
    let query = {};
    
    // Search filter
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Brand filter
    if (brand && brand !== 'all') {
      query.brand = brand;
    }
    
    // Stock status filter
    if (stockStatus === 'in-stock') {
      query.stock = { $gt: 0 };
    } else if (stockStatus === 'out-of-stock') {
      query.stock = 0;
    }
    
    // Sort options
    let sortOption = {};
    switch(sort) {
      case 'price-asc':
        sortOption.price = 1;
        break;
      case 'price-desc':
        sortOption.price = -1;
        break;
      case 'name-asc':
        sortOption.name = 1;
        break;
      case 'newest':
        sortOption.createdAt = -1;
        break;
      default:
        sortOption.createdAt = -1;
    }
    
    const products = await Product.find(query).sort(sortOption);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    // Log the body to see exactly what arrived from React
    console.log("📥 Received Payload:", req.body);

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    // 🚨 Log the actual error to your terminal so you can read it!
    console.error("❌ BACKEND CRASH:", error);

    // Send a helpful message back to React
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Bulk update products
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.body;
    
    await Product.updateMany(
      { _id: { $in: productIds } },
      updates
    );
    
    res.json({
      success: true,
      message: 'Products updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update products',
      error: error.message
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Bulk delete products
export const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    await Product.deleteMany({ _id: { $in: productIds } });
    
    res.json({
      success: true,
      message: 'Products deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete products',
      error: error.message
    });
  }
};

// Get categories and brands for filters
export const getFilterOptions = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');
    
    res.json({
      success: true,
      data: {
        categories,
        brands
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};