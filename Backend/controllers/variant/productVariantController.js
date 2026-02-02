import ProductVariant from "../../models/variant/productVariantSchema.js";
import inventoryService from "../../services/inventory.service.js";

/* CREATE */
/* CREATE (Fixed & Robust) */
export const createVariant = async (req, res) => {
  try {
    // 1. Destructure to safely check fields before saving
    const { productId, attributes, price, sku } = req.body;

    // 2. Manual Validation (Optional but recommended)
    if (!productId || !sku || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: productId, sku, and price are mandatory."
      });
    }

    if (!attributes || Object.keys(attributes).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Attributes cannot be empty. Please select options like Size or Color."
      });
    }

    // 3. Attempt to Create
    const variant = await ProductVariant.create(req.body);

    // 4. Auto-Create Inventory Record
    try {
      await inventoryService.autoCreateInventoryForVariant(variant, 'SYSTEM');
      console.log(`✅ Inventory auto-created for variant ${variant.sku}`);
    } catch (invError) {
      console.error("❌ Auto-Inventory Creation Failed:", invError);
      // Log error but don't fail variant creation
      // Admin can manually create inventory if needed
    }

    res.status(201).json({ success: true, data: variant });

  } catch (error) {
    // 4. Handle Duplicate SKU Error (Mongoose Error Code 11000)
    if (error.code === 11000) {
      // Check which field caused the duplicate (usually SKU or Variant Combination)
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'sku'
        ? `The SKU '${req.body.sku}' is already taken.`
        : `This variant combination already exists for this product.`;

      return res.status(400).json({ success: false, message });
    }

    // 5. Handle Validation Errors (e.g., wrong data types)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    // 6. Generic Server Error
    console.error("Create Variant Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/* READ (TABLE + FILTER) */
export const getVariants = async (req, res) => {
  const { productId, status } = req.query;

  let query = {};
  if (productId) query.productId = productId;
  if (status !== undefined) query.status = status;

  const data = await ProductVariant
    .find(query)
    .populate("productId", "name")
    .populate("sizeId", "code name")           // Populate size details
    .populate("colorId", "name hexCode")       // Populate single color (for SINGLE_COLOR variants)
    .populate("colorParts", "name hexCode");   // Populate colorway palette (for COLORWAY variants)

  res.json({ success: true, data });
};

/* UPDATE */
export const updateVariant = async (req, res) => {
  const data = await ProductVariant.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json({ success: true, data });
};

/* DELETE */
export const deleteVariant = async (req, res) => {
  const variantId = req.params.id;
  await ProductVariant.findByIdAndDelete(variantId);

  // Also delete associated inventory
  try {
    const InventoryMaster = (await import("../../models/inventory/InventoryMaster.model.js")).default;
    await InventoryMaster.findOneAndDelete({ variantId });
  } catch (err) {
    console.error("Error deleting inventory for variant:", err);
  }

  res.json({ success: true, message: "Variant deleted" });
};

/* TOGGLE ACTIVE / INACTIVE */
export const toggleVariantStatus = async (req, res) => {
  const variant = await ProductVariant.findById(req.params.id);
  variant.status = !variant.status;
  await variant.save();

  res.json({ success: true, data: variant });
};
