import ProductVariant from "../../models/variant/variantSchema.js";
import VariantMaster from "../../models/masters/VariantMaster.enterprise.js";
import inventoryService from "../../services/inventory.service.js";
import mongoose from "mongoose";

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

/* READ (TABLE + FILTER) — ALIGNED WITH ENTERPRISE VariantMaster */
export const getVariants = async (req, res) => {
  try {
    const { productId, status } = req.query;

    // ── 1. Handle Listing without Product ID (Admin Legacy Support) ──────────
    if (!productId) {
      const query = status ? { status } : {};
      const data = await ProductVariant.find(query)
        .populate("product", "name")
        .populate("size", "code name")
        .populate("color", "name hexCode");
      return res.json({ success: true, data });
    }

    // ── 2. Alignment Fix: VariantMaster uses productGroupId ──────────────────
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Canonical query for VariantMaster
    const query = {
      productGroupId: productId,
      // Status in VariantMaster matches uppercase enums (ACTIVE, INACTIVE, etc.)
      status: status ? String(status).toUpperCase() : 'ACTIVE',
    };

    const variants = await VariantMaster.find(query)
      .populate('colorId', 'name displayName hexCode rgbCode colorFamily')
      .populate({
        path: 'attributeValueIds',
        select: 'name displayName code attributeType',
        populate: {
          path: 'attributeType',
          select: 'name displayName code',
          model: 'AttributeType'
        }
      })
      .lean();

    // Note: VariantMaster uses 'sizes' array.
    // For hydration backwards-compatibility, we can expose sizeId from the first entry if needed.
    const mappedData = variants.map(v => {
      // Safely extract the primary sizeId for frontend hydration
      const primarySizeObj = v.sizes?.[0];
      const sizeId = primarySizeObj?.sizeId?._id || primarySizeObj?.sizeId || null;

      return {
        ...v,
        sizeId
      };
    });

    return res.json({
      success: true,
      count: mappedData.length,
      data: mappedData
    });

  } catch (error) {
    console.error("getVariants Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
      error: error.message
    });
  }
};

/* UPDATE */
export const updateVariant = async (req, res) => {
  try {
    const variantId = req.params.id;
    const incomingVersion = req.body['governance.version'];

    // 1. Differentiate Error Types - Malformed ID / Missing fields (400)
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        success: false,
        message: "Invalid variant ID format."
      });
    }

    // Handle status boolean-to-string conversion if present in req.body
    const updatePayload = { ...req.body };
    if (updatePayload.status !== undefined && typeof updatePayload.status === 'boolean') {
      updatePayload.status = updatePayload.status ? 'ACTIVE' : 'ARCHIVED';
    }

    // Prevent manual manipulation of the version field itself
    delete updatePayload['governance.version'];

    // 2. OCC PATH — Enterprise variant with governance.version present
    if (incomingVersion !== undefined && incomingVersion !== null) {
      const variant = await VariantMaster.findOneAndUpdate(
        {
          _id: variantId,
          "governance.version": incomingVersion
        },
        updatePayload,
        { new: true, runValidators: true }
      );

      if (!variant) {
        // Distinguish 404 from OCC version mismatch
        const existing = await VariantMaster.findById(variantId).lean();
        if (!existing) {
          return res.status(404).json({ success: false, message: "Variant not found." });
        }

        // Log the exact conflict cause
        console.error(`[OCC_CONFLICT] variantId=${variantId} incomingVersion=${incomingVersion} currentVersion=${existing.governance?.version}`);

        return res.status(409).json({
          code: "OCC_CONFLICT",
          success: false,
          message: "Version conflict: this variant was modified by another session. Refresh to get the latest state.",
          variantId
        });
      }

      return res.json({ success: true, data: variant });
    }

    // 3. LEGACY FALLBACK PATH — No governance.version (legacy variantSchema.js model)
    const legacyVariant = await ProductVariant.findById(variantId);
    if (!legacyVariant) {
      return res.status(404).json({ success: false, message: "Variant not found." });
    }

    Object.assign(legacyVariant, updatePayload);
    await legacyVariant.save();

    await legacyVariant.populate('product', 'name');
    await legacyVariant.populate('size', 'code name');
    if (legacyVariant.color) await legacyVariant.populate('color', 'name hexCode');

    return res.json({ success: true, data: legacyVariant });

  } catch (error) {
    console.error("Update Variant Error:", error);

    // Duplicate key (configHash / combinationKey collision) → 409
    if (error.code === 11000) {
      console.error(`[OCC_CONFLICT] Duplicate key on Variant ${req.params.id}`);
      return res.status(409).json({
        code: "OCC_CONFLICT",
        success: false,
        message: "Conflict: this combination already exists as another variant.",
        variantId: req.params.id
      });
    }

    // Mongoose schema validation failure → 400
    if (error.name === 'ValidationError') {
      const fields = Object.keys(error.errors);
      console.error(`[VALIDATION_ERROR] Fields: ${fields.join(', ')} on Variant ${req.params.id}`);
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        success: false,
        message: error.message,
        fields
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
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
