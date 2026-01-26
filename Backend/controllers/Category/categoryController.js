// Enhanced Category Controller with Full CRUD Operations
import Category from "../../models/Category/CategorySchema.js";
import { slugify } from "../../utils/slugify.js";

// Create Category
export const createCategory = async (req, res) => {
  try {
    console.log('📝 Create category request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const { name, slug: customSlug, parentId, tags, customFields, ...otherFields } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    // Generate slug
    const slug = customSlug || slugify(name);

    // Check if category with same slug exists
    const exists = await Category.findOne({ slug, isDeleted: false });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists"
      });
    }

    // Parse JSON fields if they're strings
    let parsedTags = [];
    let parsedCustomFields = {};

    try {
      parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
    } catch (e) {
      console.log('Tags parsing error:', e);
      parsedTags = [];
    }

    try {
      parsedCustomFields = customFields ? (typeof customFields === 'string' ? JSON.parse(customFields) : customFields) : {};
    } catch (e) {
      console.log('Custom fields parsing error:', e);
      parsedCustomFields = {};
    }

    // Validate parentId to prevent CastError
    let validParentId = null;
    if (parentId && parentId !== 'null' && parentId !== '') {
      if (mongoose.Types.ObjectId.isValid(parentId)) {
        validParentId = parentId;
      } else {
        console.warn(`⚠️ Invalid parentId received: ${parentId} - treating as root`);
      }
    }

    // Prepare category data
    const categoryData = {
      name: name.trim(),
      slug,
      parentId: validParentId,
      tags: parsedTags,
      customFields: parsedCustomFields,
      ...otherFields,
      image: req.files?.image?.[0]?.path || '',
      banner: req.files?.banner?.[0]?.path || '',
      createdBy: req.user?.name || 'admin',
      updatedBy: req.user?.name || 'admin'
    };

    console.log('Creating category with data:', categoryData);

    // Create category
    const category = await Category.create(categoryData);

    console.log('✅ Category created successfully:', category._id);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category
    });
  } catch (error) {
    console.error('❌ Create category error:', error);
    res.status(500).json({
      success: false,
      message: error.message + (process.env.NODE_ENV === 'development' ? ` Stack: ${error.stack}` : "")
    });
  }
};

// Get All Categories (with pagination and filters)
export const getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      status = "",
      isFeatured = "",
      parentId = ""
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (status) query.status = status;
    if (isFeatured !== "") query.isFeatured = isFeatured === 'true';
    if (parentId) query.parentId = parentId;

    // Execute query
    const categories = await Category.find(query)
      .populate('parentId', 'name slug')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ priority: 1, name: 1 });

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      data: categories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories"
    });
  }
};

// Get Category Tree (Hierarchical)
export const getCategoryTree = async (req, res) => {
  try {
    console.log('📊 Fetching category tree...');

    const categories = await Category.find({ isDeleted: false })
      .sort({ priority: 1, name: 1 })
      .lean();

    console.log(`Found ${categories.length} categories`);

    // Debug: Log each category's parentId
    categories.forEach(cat => {
      console.log(`Category: ${cat.name}, parentId: ${cat.parentId} (type: ${typeof cat.parentId})`);
    });

    // Build tree structure
    const buildTree = (parentId = null) => {
      const filtered = categories.filter(cat => {
        // Handle null/undefined parentId for root categories
        if (parentId === null) {
          const isRoot = cat.parentId === null || cat.parentId === undefined;
          if (isRoot) {
            console.log(`✅ Found root category: ${cat.name}`);
          }
          return isRoot;
        }
        // For non-root categories, compare IDs
        return String(cat.parentId) === String(parentId);
      });

      return filtered.map(cat => ({
        ...cat,
        children: buildTree(cat._id)
      }));
    };

    const tree = buildTree();

    console.log(`✅ Built tree with ${tree.length} root categories`);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('❌ Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category tree"
    });
  }
};

// Get Single Category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false
    }).populate('parentId', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category"
    });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug: customSlug, tags, ...otherFields } = req.body;

    // Find existing category
    const category = await Category.findOne({ _id: id, isDeleted: false });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Generate slug if name changed
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = customSlug || slugify(name);

      // Check if new slug conflicts with another category
      const slugExists = await Category.findOne({
        slug,
        _id: { $ne: id },
        isDeleted: false
      });

      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: "Category with this slug already exists"
        });
      }
    }

    // Parse tags if it's a string
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;

    // Update fields
    const updateData = {
      ...otherFields,
      updatedBy: req.user?.name || 'admin'
    };

    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (parsedTags) updateData.tags = parsedTags;
    if (req.files?.image?.[0]) updateData.image = req.files.image[0].path;
    if (req.files?.banner?.[0]) updateData.banner = req.files.banner[0].path;

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentId', 'name slug');

    res.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update category"
    });
  }
};

// Toggle Category Status
export const toggleStatus = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    category.status = category.status === 'active' ? 'inactive' : 'active';
    category.updatedBy = req.user?.name || 'admin';
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle status"
    });
  }
};

// Toggle Featured
export const toggleFeatured = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    category.isFeatured = !category.isFeatured;
    category.updatedBy = req.user?.name || 'admin';
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isFeatured ? 'marked as featured' : 'unmarked as featured'}`,
      data: category
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle featured"
    });
  }
};

// Soft Delete Category
export const softDelete = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Check if category has children
    const hasChildren = await Category.findOne({
      parentId: req.params.id,
      isDeleted: false
    });

    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with subcategories. Please delete subcategories first."
      });
    }

    category.isDeleted = true;
    category.updatedBy = req.user?.name || 'admin';
    await category.save();

    res.json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete category"
    });
  }
};

// Get Category Stats
export const getCategoryStats = async (req, res) => {
  try {
    const [totalCategories, activeCategories, featuredCategories, inactiveCategories] = await Promise.all([
      Category.countDocuments({ isDeleted: false }),
      Category.countDocuments({ isDeleted: false, status: 'active' }),
      Category.countDocuments({ isDeleted: false, isFeatured: true }),
      Category.countDocuments({ isDeleted: false, status: 'inactive' })
    ]);

    res.json({
      success: true,
      data: {
        total: totalCategories,
        active: activeCategories,
        inactive: inactiveCategories,
        featured: featuredCategories
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stats"
    });
  }
};

// DEBUG: View raw category data
export const debugCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).lean();

    console.log('\n🔍 DEBUG: Raw category data:');
    categories.forEach(cat => {
      console.log(`- ${cat.name}: parentId=${cat.parentId} (type: ${typeof cat.parentId}), isDeleted=${cat.isDeleted}`);
    });

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// FIX: Reset all categories to root level
export const fixCategories = async (req, res) => {
  try {
    console.log('🔧 Fixing categories - setting all parentId to null...');

    const result = await Category.updateMany(
      { isDeleted: false },
      { $set: { parentId: null } }
    );

    console.log(`✅ Fixed ${result.modifiedCount} categories`);

    res.json({
      success: true,
      message: `Fixed ${result.modifiedCount} categories - all are now root categories`,
      data: result
    });
  } catch (error) {
    console.error('Fix categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
