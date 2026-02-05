import ProductVariant from "../../models/variant/variantSchema.js";
import inventoryService from "../../services/inventory.service.js";

/* CREATE */
/* CREATE (Fixed & Robust) */
export const createVariant = async (req, res) => {
  try {
    // 1. Destructure to safely check fields before saving
    const { productId, size, color, price, sku, mrp, isDefault } = req.body;

    // 2. Manual Validation
    if (!productId || !sku || price === undefined || !size || !color) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: productId, sku, price, size, and color are mandatory."
      });
    }

    // 3. Attempt to Create
    // Convert productId -> product for schema consistency if needed, allowed by Mongoose loose matching
    const variantData = {
      product: productId,
      size,
      color,
      price,
      sku,
      mrp: mrp || 0,
      isDefault: isDefault || false,
      ...req.body
    };

    const variant = await ProductVariant.create(variantData);

    // ✅ FIX: Populate references correctly
    await variant.populate('product', 'name');
    await variant.populate('size', 'code name');
    await variant.populate('color', 'name hexCode');

    // 4. Inventory Creation
    // Inventory is managed strictly by the Inventory Service. 
    // Listeners/Triggers should handle stock record creation based on Variant Created events.

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
  if (productId) query.product = productId;
  if (status !== undefined) query.status = status;

  const data = await ProductVariant
    .find(query)
    .populate("product", "name")
    .populate("size", "code name")
    .populate("color", "name hexCode");

  res.json({ success: true, data });
};

/* UPDATE */
export const updateVariant = async (req, res) => {
  // ✅ FIX: Add .populate() to return populated data and prevent color disappearing in UI
  const data = await ProductVariant.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )
    .populate('product', 'name')
    .populate('size', 'code name')
    .populate('color', 'name hexCode');

  res.json({ success: true, data });
};

/* DELETE */
export const deleteVariant = async (req, res) => {
  const variantId = req.params.id;
  await ProductVariant.findByIdAndDelete(variantId);

  res.json({ success: true, message: "Variant deleted" });
};

/* TOGGLE ACTIVE / INACTIVE */
export const toggleVariantStatus = async (req, res) => {
  const variant = await ProductVariant.findById(req.params.id);
  variant.status = !variant.status;
  await variant.save();

  // ✅ FIX: Populate references before returning to prevent color disappearing in UI
  // ✅ FIX: Populate references
  await variant.populate('product', 'name');
  await variant.populate('size', 'code name');
  await variant.populate('color', 'name hexCode');

  res.json({ success: true, data: variant });
};
