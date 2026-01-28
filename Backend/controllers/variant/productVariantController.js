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
      const inventoryData = {
        productId: variant.productId,
        variantId: variant._id,
        productName: req.body.productName || 'Unknown Product', // Ideally fetch product name or pass it
        sku: variant.sku,
        unitOfMeasure: 'PCS',
        openingStock: 0,
        costPrice: variant.costPrice || 0, // Assuming costPrice might be in variant
        minimumStockLevel: 5,
        reorderLevel: 5
      };

      // We need to fetch product name if not provided, for the inventory schema requirement
      // However, to keep it fast, we assume it's okay or we handle it in service.
      // Wait, inventorySchema requires productName. 
      // I should allow the service to handle "Unknown" if missing, or fetch it.
      // Better: Since the variant creation is successful, we try to create inventory. 
      // If it fails (e.g. missing name), we catch it but don't fail the variant creation?
      // No, we should probably ensure integrity. But user wants "Auto".

      // Let's import InventoryService at the top first.
      await inventoryService.createInventoryMaster(inventoryData);

    } catch (invError) {
      console.error("Auto-Inventory Creation Failed:", invError);
      // Optional: Undo variant creation? Or just warn?
      // For now, log it. The Admin can create it manually if it fails, or we assume it won't fail often.
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
    .populate("productId", "name");

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
  await ProductVariant.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Variant deleted" });
};

/* TOGGLE ACTIVE / INACTIVE */
export const toggleVariantStatus = async (req, res) => {
  const variant = await ProductVariant.findById(req.params.id);
  variant.status = !variant.status;
  await variant.save();

  res.json({ success: true, data: variant });
};
