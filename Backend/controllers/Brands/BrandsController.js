import Brand from "../../models/Brands/BrandsSchema.js";
import slugify from "slugify";

// ============================================================================
// HELPERS
// ============================================================================

// Clean empty/null values
const cleanValue = (val) => {
  if (val === "undefined" || val === undefined || val === null || val === "null") return "";
  return val;
};

// Parse boolean from string/boolean
const parseBoolean = (val) => {
  return val === true || val === "true";
};

// ============================================================================
// CREATE
// ============================================================================
export const createBrand = async (req, res) => {
  try {
    const {
      name,
      description,
      isFeatured,
      status,
      showInNav,
      priority,
      metaTitle,
      metaDescription,
      metaKeywords
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Brand name required" });
    }

    // Auto-generate slug if not provided? Or just from name always?
    // Usually auto-generate from name, but ensure unique.
    let slug = slugify(name, { lower: true, strict: true });

    // Check for duplicates
    const existing = await Brand.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: "Brand with this name already exists" });
    }

    const brandData = {
      name: name.trim(),
      slug,
      description: cleanValue(description),
      status: status || 'active', // Default to active
      isFeatured: parseBoolean(isFeatured),
      showInNav: parseBoolean(showInNav),
      priority: parseInt(priority) || 0,

      // visual
      logo: req.files?.logo?.[0]?.filename || "",
      banner: req.files?.banner?.[0]?.filename || "",

      // seo
      metaTitle: cleanValue(metaTitle),
      metaDescription: cleanValue(metaDescription),
      metaKeywords: cleanValue(metaKeywords),
    };

    const brand = await Brand.create(brandData);

    res.status(201).json({ success: true, message: "Brand created successfully", data: brand });
  } catch (err) {
    console.error("Create Brand Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// GET ALL (Pagination, Search, Filter)
// ============================================================================
export const getAllBrands = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      status = "",
      isFeatured = "",
      isDeleted = "false" // Default to show active only
    } = req.query;

    const query = {};

    // Filter by deletion status (Soft Delete)
    // If isDeleted='true', show only deleted. If 'all', show everything. Else show non-deleted.
    if (isDeleted === 'true') {
      query.isDeleted = true;
    } else if (isDeleted !== 'all') {
      query.isDeleted = false;
    }

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } }
      ];
    }

    // Filters
    if (status) query.status = status;
    if (isFeatured !== "") query.isFeatured = parseBoolean(isFeatured);

    const brands = await Brand.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Brand.countDocuments(query);

    res.json({
      success: true,
      data: brands,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get Brands Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// GET SINGLE
// ============================================================================
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// UPDATE
// ============================================================================
export const updateBrand = async (req, res, next) => {
  console.log('UPDATE BRAND CALLED', req.params.id);
  try {
    const {
      name,
      description,
      status,
      isFeatured,
      showInNav,
      priority,
      metaTitle,
      metaDescription,
      metaKeywords
    } = req.body;

    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });

    // Update fields
    if (name) {
      brand.name = name.trim();
    }

    if (description !== undefined) brand.description = description;
    if (status) brand.status = status;
    if (isFeatured !== undefined) brand.isFeatured = parseBoolean(isFeatured);
    if (showInNav !== undefined) brand.showInNav = parseBoolean(showInNav);
    if (priority !== undefined) brand.priority = parseInt(priority);

    // SEO
    if (metaTitle !== undefined) brand.metaTitle = metaTitle;
    if (metaDescription !== undefined) brand.metaDescription = metaDescription;
    if (metaKeywords !== undefined) brand.metaKeywords = metaKeywords;

    // Files
    if (req.files?.logo?.[0]) brand.logo = req.files.logo[0].filename;
    if (req.files?.banner?.[0]) brand.banner = req.files.banner[0].filename;

    brand.updatedBy = "admin";

    await brand.save();

    res.json({ success: true, message: "Brand updated successfully", data: brand });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// DELETE (Soft)
// ============================================================================
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });

    // Optional: Check for products attached? 
    // Ideally yes, but for now we just soft delete.

    brand.isDeleted = true;
    brand.deletedAt = new Date();
    await brand.save();

    res.json({ success: true, message: "Brand moved to trash" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// RESTORE
// ============================================================================
export const restoreBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });

    brand.isDeleted = false;
    brand.deletedAt = null;
    await brand.save();

    res.json({ success: true, message: "Brand restored successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// TOGGLE STATUS
// ============================================================================
export const toggleBrandStatus = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });

    brand.status = brand.status === 'active' ? 'inactive' : 'active';
    await brand.save();

    res.json({ success: true, message: "Brand status updated", data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// STATS
// ============================================================================
export const getBrandStats = async (req, res) => {
  try {
    const [total, active, inactive, featured] = await Promise.all([
      Brand.countDocuments({ isDeleted: false }),
      Brand.countDocuments({ isDeleted: false, status: 'active' }),
      Brand.countDocuments({ isDeleted: false, status: 'inactive' }),
      Brand.countDocuments({ isDeleted: false, isFeatured: true })
    ]);

    res.json({
      success: true,
      data: { total, active, inactive, featured }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
