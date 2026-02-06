import ProductVariant from "../../models/variant/variantSchema.js";
import inventoryService from "../../services/inventory.service.js";

/* CREATE */
/* CREATE (Supports Bulk & Single) */
export const createVariant = async (req, res) => {
  try {
    // CHECK FOR BULK MODE
    if (req.body.variants && Array.isArray(req.body.variants)) {
      const { productId, variants } = req.body;
      if (!productId) {
        return res.status(400).json({ success: false, message: "productId is required for bulk creation" });
      }

      const createdVariants = [];
      const stats = { created: 0, skipped: 0 };

      // Process sequentially to handle errors gracefully (or Promise.all for speed)
      for (const vData of variants) {
        // Check for duplicates
        const exists = await ProductVariant.findOne({ sku: vData.sku });
        if (exists) {
          stats.skipped++;
          continue;
        }

        // Prepare Data
        const variantPayload = {
          product: productId,
          sku: vData.sku,
          size: vData.sizeId || vData.size, // Handle both ID formats
          color: vData.colorId || vData.color,
          price: vData.price,
          status: vData.status,

          // Colorway Fields
          colorwayName: vData.colorwayName,
          colorParts: vData.colorParts, // Array of IDs

          // Defaults
          mrp: vData.mrp || 0,
          isDefault: false,
          images: vData.images || []
        };

        const newVariant = await ProductVariant.create(variantPayload);

        // Auto-Initialize Inventory
        await inventoryService.initializeInventory(newVariant._id);

        createdVariants.push(newVariant);
        stats.created++;
      }

      return res.status(201).json({
        success: true,
        message: `Processed ${variants.length} items`,
        stats,
        data: createdVariants
      });
    }

    // SINGLE MODE (Legacy Support)
    // 1. Destructure to safely check fields
    const { productId, size, color, price, sku, mrp, isDefault, colorwayName, colorParts } = req.body;

    // 2. Manual Validation
    const isColorway = !!colorwayName;
    if (!productId || !sku || price === undefined || !size || (!color && !isColorway)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: productId, sku, price, size, and color (or colorwayName) are mandatory."
      });
    }

    // 3. Create
    const variantData = {
      product: productId,
      size,
      color,
      price,
      sku,
      mrp: mrp || 0,
      isDefault: isDefault || false,
      colorwayName,
      colorParts,
      ...req.body
    };

    const variant = await ProductVariant.create(variantData);

    // Populate
    await variant.populate('product', 'name');
    await variant.populate('size', 'code name');
    if (variant.color) await variant.populate('color', 'name hexCode');
    if (variant.colorParts && variant.colorParts.length > 0) await variant.populate('colorParts', 'name hexCode');

    // 4. Inventory Creation
    await inventoryService.initializeInventory(variant._id);

    res.status(201).json({ success: true, data: variant });

  } catch (error) {
    // Handle Duplicate SKU Error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'sku'
        ? `The SKU '${req.body.sku}' is already taken.`
        : `This variant combination already exists for this product.`;
      return res.status(400).json({ success: false, message });
    }

    // Handle Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

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
