import ProductVariant from "../../models/variant/variantSchema.js";
import VariantMaster from "../../models/masters/VariantMaster.enterprise.js";
import inventoryService from "../../services/inventory.service.js";
import { SnapshotService } from "../../services/snapshot.service.js";
import mongoose from "mongoose";

/* CREATE — Enterprise bulk (VariantMaster) or legacy single (ProductVariant) */
export const createVariant = async (req, res) => {
  try {
    // ── BULK MODE: Enterprise payload from VariantBuilder ────────────────────
    if (req.body.variants && Array.isArray(req.body.variants)) {
      const { productId, productGroupId, variants } = req.body;

      // Accept either productGroupId (enterprise) or productId (legacy) for the group key
      const groupId = productGroupId || productId;
      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'productGroupId is required for bulk creation.'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid productGroupId format.'
        });
      }

      const createdVariants = [];
      const stats = { created: 0, skipped: 0, errors: [] };

      for (const vData of variants) {
        try {
          // Skip duplicates by SKU (check in VariantMaster)
          const exists = await VariantMaster.findOne({ sku: vData.sku }).lean();
          if (exists) {
            stats.skipped++;
            continue;
          }

          // Extract sizeId correctly from enterprise sizes array
          const primarySize = Array.isArray(vData.sizes) ? vData.sizes[0] : null;
          const sizeId = primarySize?.sizeId || vData.sizeId || null;

          // Build enterprise VariantMaster payload
          const variantPayload = {
            productGroupId: groupId,
            sku: vData.sku,
            price: vData.price,
            status: vData.status || 'DRAFT',
            // Enterprise size structure
            sizes: Array.isArray(vData.sizes) ? vData.sizes : (sizeId ? [{ sizeId, category: 'DIMENSION' }] : []),
            // Color: single colorId or colorway
            colorId: vData.colorId || null,
            colorwayName: vData.colorwayName || null,
            colorParts: vData.colorParts || [],
            // Attributes
            attributeValueIds: vData.attributeValueIds || [],
            // Media
            imageGallery: vData.imageGallery || [],
            // Legacy attributes mirror for search
            attributes: vData.attributes || {}
          };

          const newVariant = await VariantMaster.create(variantPayload);
          createdVariants.push(newVariant);
          stats.created++;

        } catch (itemErr) {
          // Capture per-item errors without aborting the whole batch
          const msg = itemErr.name === 'ValidationError'
            ? Object.values(itemErr.errors).map(e => e.message).join(', ')
            : itemErr.message;
          stats.errors.push({ sku: vData.sku, error: msg });
          console.error(`[createVariant] Bulk item error (SKU: ${vData.sku}):`, msg);
        }
      }

      return res.status(201).json({
        success: true,
        message: `Processed ${variants.length} variants: ${stats.created} created, ${stats.skipped} skipped.`,
        stats,
        data: createdVariants
      });
    }

    // ── SINGLE MODE: Legacy admin form (ProductVariant) ──────────────────────
    const { productId, size, color, price, sku, mrp, isDefault, colorwayName, colorParts } = req.body;

    const isColorway = !!colorwayName;
    if (!productId || !sku || price === undefined || !size || (!color && !isColorway)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productId, sku, price, size, and color (or colorwayName) are mandatory.'
      });
    }

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
    await variant.populate('product', 'name');
    await variant.populate('size', 'code name');
    if (variant.color) await variant.populate('color', 'name hexCode');
    if (variant.colorParts?.length > 0) await variant.populate('colorParts', 'name hexCode');
    await inventoryService.initializeInventory(variant._id);

    return res.status(201).json({ success: true, data: variant });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'sku'
        ? `The SKU '${req.body.sku}' is already taken.`
        : 'This variant combination already exists.';
      return res.status(400).json({ success: false, message });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('[createVariant] Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/* READ (TABLE + FILTER) — ENTERPRISE VariantMaster ONLY */
export const getVariants = async (req, res) => {
  try {
    const { productId, status } = req.query;

    // ── 1. Admin listing: no productId, use legacy ProductVariant for admin table ──
    if (!productId) {
      const query = status ? { status } : {};
      const data = await ProductVariant.find(query)
        .populate('product', 'name')
        .populate('size', 'code name')
        .populate('color', 'name hexCode');
      return res.json({ success: true, data });
    }

    // ── 2. Strict ObjectId validation and casting ─────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid productId: must be a 24-character MongoDB ObjectId'
      });
    }

    const objectId = new mongoose.Types.ObjectId(productId);

    // ── 3. Enterprise canonical query — VariantMaster only ───────────────────
    // Admin panel shows ALL statuses (DRAFT, ACTIVE, OUT_OF_STOCK, etc.) unless
    // explicitly filtered. If a status query param is provided, respect it.
    const query = {
      productGroupId: objectId,
      ...(status ? { status: String(status).toUpperCase() } : {}),
      isDeleted: { $ne: true }
    };

    const variants = await VariantMaster.find(query)
      .populate('colorId', 'name displayName hexCode rgbCode colorFamily')
      .populate('sizes.sizeId', 'value displayName category')
      .populate({
        path: 'attributeValueIds',
        select: 'name displayName code attributeType',
        populate: {
          path: 'attributeType',
          select: 'name displayName _id',
          model: 'AttributeType'
        }
      })
      .lean();

    console.log("STEP 6 - DB Variants (Sample):", variants.length > 0 ? variants[0] : 'None');

    // ── 4. Expose flattened sizeId + normalize attributeValueIds + build
    //       structured attributeDimensions for stable frontend identity keys ──
    const mappedData = variants.map(v => {
      const primarySizeObj = v.sizes?.[0];
      const sizeId = primarySizeObj?.sizeId?._id || primarySizeObj?.sizeId || null;

      // Normalize attributeValueIds: could be populated objects or plain ID strings.
      // Sort for deterministic identity key comparison on frontend.
      const rawAttrIds = Array.isArray(v.attributeValueIds) ? v.attributeValueIds : [];
      const normalizedAttrValueIds = rawAttrIds
        .map(entry => {
          if (!entry) return null;
          if (typeof entry === 'object' && entry._id) return entry._id.toString();
          return entry.toString();
        })
        .filter(Boolean)
        .sort();

      // ── STRUCTURAL METADATA: attributeDimensions ─────────────────────────
      // This is the canonical representation the frontend uses so it can rebuild
      // identity keys WITHOUT reverse-scanning allAttributes client-side.
      // Format: [{ attributeId, attributeName, valueId }]
      // Works even when an attribute type has ZERO values configured in the DB.
      const attributeDimensions = rawAttrIds
        .map(entry => {
          if (!entry) return null;

          // ── Case A: fully populated — value doc exists + type ref exists ──────
          if (typeof entry === 'object' && entry._id && entry.attributeType) {
            return {
              attributeId: entry.attributeType._id?.toString() ?? null,
              attributeName: entry.attributeType.name ?? entry.attributeType.displayName ?? null,
              valueId: entry._id.toString(),  // always use _id, never entry.toString()
            };
          }

          // ── Case B: value doc exists but attributeType ref was deleted ────────
          // entry = { _id: ObjectId, name: ..., attributeType: null }
          // entry.toString() would return "[object Object]" — must use _id explicitly
          if (typeof entry === 'object' && entry._id) {
            return {
              attributeId: null,
              attributeName: null,
              valueId: entry._id.toString(),  // correct hex string
            };
          }

          // ── Case C: raw ObjectId string (populate silently missed) ────────────
          if (typeof entry === 'string' && entry.length === 24) {
            return { attributeId: null, attributeName: null, valueId: entry };
          }

          // Fallback: unknown shape — skip
          return null;
        })
        .filter(Boolean);

      return {
        ...v,
        sizeId,
        attributeValueIds: rawAttrIds,
        attributeDimensions,     // ← NEW: stable structured identity metadata
      };
    });

    return res.json({
      success: true,
      count: mappedData.length,
      data: mappedData
    });

  } catch (error) {
    console.error('[getVariants] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch variants',
      error: error.message
    });
  }
};

/* UPDATE — Enterprise OCC path only */
export const updateVariant = async (req, res) => {
  try {
    const variantId = req.params.id;
    // Extract version from nested governance object (matches frontend payload structure)
    const incomingVersion = req.body.governance?.version;

    // 1. Validate variant ID format
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        success: false,
        message: 'Invalid variant ID format.'
      });
    }

    // 2. Require governance.version — reject early if missing
    if (incomingVersion === undefined || incomingVersion === null) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        success: false,
        message: 'governance.version is required for updates. Refresh and retry.'
      });
    }

    // 3. Build sanitized update payload — strip governance to prevent manual version manipulation
    const updatePayload = { ...req.body };
    delete updatePayload.governance;
    delete updatePayload['governance.version'];
    delete updatePayload.id; // strip echoed id field if present

    // Normalize boolean status to string enum
    if (updatePayload.status !== undefined && typeof updatePayload.status === 'boolean') {
      updatePayload.status = updatePayload.status ? 'ACTIVE' : 'ARCHIVED';
    }

    // 4. Atomic OCC findOneAndUpdate — matches on _id + version, increments version
    const variant = await VariantMaster.findOneAndUpdate(
      {
        _id: variantId,
        'governance.version': incomingVersion
      },
      {
        $set: updatePayload,
        $inc: { 'governance.version': 1 }
      },
      { new: true, runValidators: true }
    );

    // 5. null result = either not found or version mismatch → 409
    if (!variant) {
      const existing = await VariantMaster.findById(variantId).lean();
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Variant not found.' });
      }
      console.error(`[OCC_CONFLICT] variantId=${variantId} incomingVersion=${incomingVersion} currentVersion=${existing.governance?.version}`);
      return res.status(409).json({
        code: 'OCC_CONFLICT',
        success: false,
        message: 'Data changed by another session. Refresh to get the latest state.',
        variantId
      });
    }

    return res.json({ success: true, data: variant });

  } catch (error) {
    console.error('[updateVariant] Error:', error);

    // Duplicate key (configHash / combinationKey collision) → 409
    if (error.code === 11000) {
      console.error(`[OCC_CONFLICT] Duplicate key on Variant ${req.params.id}`);
      return res.status(409).json({
        code: 'OCC_CONFLICT',
        success: false,
        message: 'Conflict: this combination already exists as another variant.',
        variantId: req.params.id
      });
    }

    // Mongoose validation failure → 400
    if (error.name === 'ValidationError') {
      const fields = Object.keys(error.errors);
      console.error(`[VALIDATION_ERROR] Fields: ${fields.join(', ')} on Variant ${req.params.id}`);
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
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
  try {
    const variantId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ success: false, message: 'Invalid variant ID format.' });
    }

    // 1. Identify valid productGroupId for snapshot recompute BEFORE deletion
    const [legacy, enterprise] = await Promise.all([
      ProductVariant.findById(variantId).select('product').lean(),
      VariantMaster.findById(variantId).select('productGroupId').lean()
    ]);

    const productGroupId = enterprise?.productGroupId || legacy?.product;

    // 2. Hard delete from both collections
    const [delLegacy, delEnterprise] = await Promise.all([
      ProductVariant.findByIdAndDelete(variantId),
      VariantMaster.findByIdAndDelete(variantId)
    ]);

    if (!delLegacy && !delEnterprise) {
      return res.status(404).json({ success: false, message: 'Variant not found in any collection.' });
    }

    // 3. Trigger Snapshot Recompute (Critical for cache consistency)
    if (productGroupId) {
      SnapshotService.triggerRecompute(productGroupId);
    }

    // 4. Cleanup high-volume secondary data (Inventory)
    try {
      await inventoryService.softDeleteInventory(variantId, 'SYSTEM_DELETE');
    } catch (invErr) {
      // Non-fatal: inventory might not have been initialized yet
      console.warn(`[deleteVariant] Inventory cleanup skipped/failed for ${variantId}:`, invErr.message);
    }

    return res.json({ success: true, message: "Variant permanently deleted." });
  } catch (error) {
    console.error('[deleteVariant] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error during deletion.', error: error.message });
  }
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
