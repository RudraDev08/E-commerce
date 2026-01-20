import Brand from "../../models/Brands/BrandsSchema.js";
import slugify from "slugify";

const cleanValue = (val) => {
  if (val === "undefined" || val === undefined || val === null) return "";
  return val;
};


/* ================= CREATE ================= */
export const createBrand = async (req, res) => {
  try {
    console.log("BODY:", req.body);   // ✅ should now be correct
    console.log("FILE:", req.file);   // ✅ file present

    const { name, description, isFeatured, status, showOnHomepage } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Brand name required" });
    }

    const brand = await Brand.create({
      name,
      slug: slugify(name, { lower: true }),
      description,
      isFeatured: isFeatured === "true",
      status: status === "true",
      showOnHomepage: showOnHomepage === "true",
      logo: req.file?.filename || "",
    });

    res.status(201).json({ success: true, data: brand });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


/* ================= GET ALL ================= */
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ONE ================= */
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE ================= */
export const updateBrand = async (req, res) => {
  try {
    const { name, description, status, isFeatured } = req.body;

    const updates = {};

    if (name) {
      updates.name = name;
      updates.slug = slugify(name, { lower: true, strict: true });
    }
    if (description !== undefined) updates.description = description;
    if (typeof status !== "undefined") updates.status = status;
    if (typeof isFeatured !== "undefined") updates.isFeatured = isFeatured;
    if (req.file) updates.logo = req.file.filename;

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!brand) return res.status(404).json({ message: "Brand not found" });

    res.json({ success: true, data: brand });
  } catch (error) {
    console.error("UPDATE BRAND ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE ================= */
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    res.json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
