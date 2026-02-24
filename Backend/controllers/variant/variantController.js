/**
 * VARIANT CONTROLLER — REFACTORED
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes served:
 *   POST  /api/v1/variants                          → createVariant (Admin)
 *   GET   /api/v1/products/:productGroupId/variants → getVariantsByProductGroup (Customer)
 *   GET   /api/v1/variants/:id                      → getVariantById
 *   PUT   /api/v1/variants/:id                      → updateVariant (Admin)
 *   DELETE /api/v1/variants/:id                     → setVariantInactive (soft)
 */

import VariantMaster from '../../models/masters/VariantMaster.enterprise.js';
import SizeMaster from '../../models/masters/SizeMaster.enterprise.js';
import ColorMaster from '../../models/masters/ColorMaster.enterprise.js';
import AttributeValue from '../../models/AttributeValue.model.js';
import ProductGroupSnapshot from '../../models/Product/ProductGroupSnapshot.js';
import { SnapshotService } from '../../services/snapshot.service.js';
import { generateConfigHash } from '../../utils/configHash.util.js';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Step 3 — GET PRODUCT GROUP SNAPSHOT (Customer Website / High-Scale Optimized)
 * GET /api/v1/product-group/:id/snapshot
 */
export async function getProductGroupSnapshot(req, res) {
  try {
    const { id } = req.params;
    let snapshot = await SnapshotService.getSnapshot(id);

    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'Snapshot not found.' });
    }

    return res.status(200).json({
      success: true,
      data: snapshot,
      source: 'SNAPSHOT_ENGINE'
    });
  } catch (err) {
    console.error('[getProductGroupSnapshot]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch snapshot.', error: err.message });
  }
}

/**
 * ✅ 6.3 Matrix Visualization Tool (Admin)
 * GET /api/v1/product-group/:id/matrix
 * Returns a 2D/3D grid view of generated variants to spot missing holes.
 */
export async function getMatrixPreview(req, res) {
  try {
    const { id } = req.params;
    let snapshot = await SnapshotService.getSnapshot(id);

    if (!snapshot || !snapshot.dimensions) {
      return res.status(404).json({ success: false, message: 'No snapshot available to build matrix.' });
    }

    const { dimensions, variantMap } = snapshot;
    const colors = dimensions.colors || [];
    const sizes = dimensions.sizes || [];

    // Build the grid: Rows = Colors, Cols = Sizes
    const grid = [];

    // Handle products with NO colors or NO sizes gracefully
    if (colors.length === 0 && sizes.length > 0) {
      const row = { id: 'default', label: 'Default Color', cells: [] };
      for (const size of sizes) {
        // Find matching variant
        const found = Object.values(variantMap).find(v => v.sku && v.sku.includes(size._id)); // simplistic match
        // Realistically, variantMap keys are configHash. 
        // Since we don't have the hash builder here easily, we do a lookup.
        // A better way is matching variants directly.
      }
    }

    // Since variantMap keys are hashes, let's fetch raw simplified variants to build the matrix cleanly
    const variants = await VariantMaster.find({ productGroupId: id })
      .select('_id status inventory.quantityOnHand colorId sizes')
      .populate('colorId', 'name hexCode')
      .populate('sizes.sizeId', 'value')
      .lean();

    // Map by color -> size
    const matrix = {};
    const colorAxes = new Map();
    const sizeAxes = new Map();

    variants.forEach(v => {
      const cId = v.colorId ? v.colorId._id.toString() : 'NONE';
      const cName = v.colorId ? v.colorId.name : 'Default';

      const sId = (v.sizes && v.sizes[0] && v.sizes[0].sizeId) ? v.sizes[0].sizeId._id.toString() : 'NONE';
      const sName = (v.sizes && v.sizes[0] && v.sizes[0].sizeId) ? v.sizes[0].sizeId.value : 'Default';

      if (!colorAxes.has(cId)) colorAxes.set(cId, { id: cId, label: cName });
      if (!sizeAxes.has(sId)) sizeAxes.set(sId, { id: sId, label: sName });

      if (!matrix[cId]) matrix[cId] = {};
      matrix[cId][sId] = {
        variantId: v._id,
        status: v.status,
        stock: v.inventory?.quantityOnHand || 0
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        yAxis: Array.from(colorAxes.values()), // Rows
        xAxis: Array.from(sizeAxes.values()),  // Columns
        matrix
      }
    });

  } catch (err) {
    console.error('[getMatrixPreview]', err);
    return res.status(500).json({ success: false, message: 'Failed to build matrix.', error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flatten a raw VariantMaster lean document into a clean customer-facing shape.
 * Called inside the controller — never inside a Mongoose virtual to stay lean().
 */
function flattenVariant(v) {
  const sizeObj = v.sizeId || (v.sizes && v.sizes[0] ? v.sizes[0].sizeId : null);
  return {
    _id: v._id,
    status: v.status,
    price: v.price ? parseFloat(v.price.toString()) : null,
    compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice.toString()) : null,
    imageGallery: v.imageGallery ?? [],

    size: sizeObj
      ? {
        _id: sizeObj._id,
        displayName: sizeObj.displayName,
        value: sizeObj.value,
        category: sizeObj.category,
        gender: sizeObj.gender,
        // Expose common measurement fields without duplicating the master
        measurements: sizeObj.measurements ?? null,
      }
      : null,

    color: v.colorId
      ? {
        _id: v.colorId._id,
        name: v.colorId.name,
        displayName: v.colorId.displayName ?? v.colorId.name,
        hex: v.colorId.hexCode,          // ColorMaster field
        rgb: v.colorId.rgbCode ?? null,
        colorFamily: v.colorId.colorFamily ?? null,
        visualCategory: v.colorId.visualCategory ?? null,
      }
      : null,

    // Flatten attribute values: [{type, value}]
    attributes: (v.attributeValueIds ?? []).map((av) => ({
      _id: av._id,
      type: av.attributeType?.name ?? av.attributeType?.displayName ?? null,
      typeId: av.attributeType?._id ?? null,
      value: av.name ?? av.displayName,
      code: av.code,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE VARIANT
// POST /api/v1/variants
// ─────────────────────────────────────────────────────────────────────────────

export async function createVariant(req, res) {
  try {
    const {
      productGroupId,
      sizeId,
      colorId,
      attributeValueIds = [],
      price,
      compareAtPrice,
      imageGallery = [],
      status = 'INACTIVE',
    } = req.body;

    // ── 1. Required field guard ──────────────────────────────────────────
    if (!productGroupId || !sizeId || !colorId || price == null) {
      return res.status(400).json({
        success: false,
        message: 'productGroupId, sizeId, colorId, and price are required.',
      });
    }

    // ── 2. Validate references exist in parallel ─────────────────────────
    const [size, color, attrValues] = await Promise.all([
      SizeMaster.findById(sizeId).select('_id displayName lifecycleState').lean(),
      ColorMaster.findById(colorId).select('_id name lifecycleState').lean(),
      attributeValueIds.length
        ? AttributeValue.find({
          _id: { $in: attributeValueIds },
          isDeleted: false,
        })
          .select('_id')
          .lean()
        : Promise.resolve([]),
    ]);

    if (!size) {
      return res.status(400).json({ success: false, message: `Size not found: ${sizeId}` });
    }
    if (!color) {
      return res.status(400).json({ success: false, message: `Color not found: ${colorId}` });
    }
    if (attrValues.length !== attributeValueIds.length) {
      return res.status(400).json({
        success: false,
        message: `One or more attributeValueIds are invalid or deleted.`,
      });
    }

    // ── 3. Generate deterministic configHash ─────────────────────────────
    const configHash = generateConfigHash({ productGroupId, sizeId, colorId, attributeValueIds });

    // ── 4. Persist ───────────────────────────────────────────────────────
    const variant = await VariantMaster.create({
      productGroupId,
      sizeId,
      colorId,
      attributeValueIds,
      price,
      compareAtPrice: compareAtPrice ?? undefined,
      imageGallery,
      status,
      configHash,
      governance: { createdBy: req.user?._id },
    });

    // ✅ Recompute Snapshot (Debounced)
    SnapshotService.triggerRecompute(productGroupId);

    return res.status(201).json({
      success: true,
      message: 'Variant created successfully.',
      data: variant,
    });
  } catch (err) {
    // ── E11000: duplicate configHash ─────────────────────────────────────
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Variant with this combination already exists.',
        detail: 'A variant with the same productGroup + size + color + attributes is already registered.',
      });
    }

    console.error('[createVariant]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create variant.',
      error: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH VARIANTS FOR PRODUCT GROUP (Customer Website)
// GET /api/v1/products/:productGroupId/variants
// ─────────────────────────────────────────────────────────────────────────────

export async function getVariantsByProductGroup(req, res) {
  try {
    const { productGroupId } = req.params;

    // Fetch only ACTIVE variants — single query, fully populated, lean for performance
    const variants = await VariantMaster.find({ productGroupId, status: 'ACTIVE' })
      .select('price compareAtPrice status imageGallery sizes colorId attributeValueIds configHash')
      .populate('sizes.sizeId', 'displayName value category gender measurements normalizedRank')
      .populate('colorId', 'name displayName hexCode rgbCode colorFamily visualCategory')
      .populate({
        path: 'attributeValueIds',
        select: 'name displayName code attributeType',
        // Nested populate: pull attributeType.name so we can show "Processor: A18 Pro"
        populate: {
          path: 'attributeType',
          select: 'name displayName code',
          model: 'AttributeType',
        },
      })
      .lean({ virtuals: false }); // virtuals=false for lean perf; we flatten manually

    if (!variants.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No active variants found for this product group.',
      });
    }

    // ── Flatten into clean frontend-optimised payload ────────────────────
    const data = variants.map(flattenVariant);

    // ── Build selector maps (extract unique sizes / colors / attributes) ─
    // The frontend can use these to render pickers without further API calls.
    const sizes = dedupeById(data.map(v => v.size).filter(Boolean));
    const colors = dedupeById(data.map(v => v.color).filter(Boolean));
    const attrMap = {};
    data.forEach(v =>
      (v.attributes ?? []).forEach(a => {
        if (!a.typeId) return;
        const key = a.typeId.toString();
        if (!attrMap[key]) attrMap[key] = { typeId: key, type: a.type, values: [] };
        if (!attrMap[key].values.some(x => x._id?.toString() === a._id?.toString())) {
          attrMap[key].values.push({ _id: a._id, value: a.value, code: a.code });
        }
      })
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      // Selector maps for instant client-side UI rendering
      selectors: {
        sizes,
        colors,
        attributes: Object.values(attrMap),
      },
      data,
    });
  } catch (err) {
    console.error('[getVariantsByProductGroup]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch variants.',
      error: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE VARIANT BY ID
// GET /api/v1/variants/:id
// ─────────────────────────────────────────────────────────────────────────────

export async function getVariantById(req, res) {
  try {
    const variant = await VariantMaster.findById(req.params.id)
      .populate('sizes.sizeId', 'displayName value category gender measurements')
      .populate('colorId', 'name displayName hexCode imageUrl colorFamily')
      .populate({
        path: 'attributeValueIds',
        select: 'name displayName code attributeType',
        populate: { path: 'attributeType', select: 'name displayName code', model: 'AttributeType' },
      })
      .lean();

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    return res.status(200).json({ success: true, data: flattenVariant(variant) });
  } catch (err) {
    console.error('[getVariantById]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch variant.', error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE VARIANT (Admin)
// PUT /api/v1/variants/:id
// ─────────────────────────────────────────────────────────────────────────────

export async function updateVariant(req, res) {
  try {
    const { id } = req.params;
    const { version: directVersion, governance } = req.body;
    const version = directVersion !== undefined ? directVersion : governance?.version;

    if (version === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Optimistic Concurrency Control requires "version" in request body.'
      });
    }

    // Strip identity fields — they must never be patched directly
    const { configHash, sizeId, colorId, productGroup, productGroupId, attributeValueIds, attributeDimensions, sizes, ...safeUpdates } = req.body;

    // Check if any identity modifying fields are passed
    if (attributeValueIds || attributeDimensions || configHash || productGroup || productGroupId || sizeId || colorId || sizes) {
      return res.status(400).json({
        success: false,
        message: 'Variant identity is immutable. Archive and recreate instead.',
      });
    }

    safeUpdates['governance.updatedBy'] = req.user?._id;

    // ✅ Step 3 — Require Version Match on Update (Optimistic Locking)
    const updated = await VariantMaster.findOneAndUpdate(
      { _id: id, 'governance.version': version },
      {
        $set: safeUpdates,
        $inc: { 'governance.version': 1 }
      },
      {
        new: true,
        runValidators: true
      }
    ).lean();

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Variant was modified by another admin or version mismatch.',
        error: 'CONFLICT'
      });
    }

    // ✅ Recompute Snapshot (Debounced)
    SnapshotService.triggerRecompute(updated.productGroupId);

    return res.status(200).json({ success: true, message: 'Variant updated.', data: updated });
  } catch (err) {
    console.error('[updateVariant]', err);
    return res.status(500).json({ success: false, message: 'Failed to update variant.', error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOFT-DELETE VARIANT (sets INACTIVE)
// DELETE /api/v1/variants/:id
// ─────────────────────────────────────────────────────────────────────────────

export async function setVariantInactive(req, res) {
  try {
    const variant = await VariantMaster.findByIdAndUpdate(
      req.params.id,
      { status: 'ARCHIVED', 'governance.updatedBy': req.user?._id },
      { new: true }
    ).lean();

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    return res.status(200).json({ success: true, message: 'Variant set to ARCHIVED.', data: variant });
  } catch (err) {
    console.error('[setVariantInactive]', err);
    return res.status(500).json({ success: false, message: 'Failed to deactivate variant.', error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL UTILS
// ─────────────────────────────────────────────────────────────────────────────

function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const key = item?._id?.toString();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLONE VARIANT (Archive-to-Edit Flow)
// POST /api/v1/variants/:id/clone
// ─────────────────────────────────────────────────────────────────────────────

export async function cloneVariant(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    // 1. Fetch original variant
    const originalVariant = await VariantMaster.findById(id).lean().session(session);
    if (!originalVariant) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    // 2. Prepare new payload by merging original and updates
    const cloneData = { ...originalVariant, ...req.body };
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.__v;
    delete cloneData.configHash; // Will regenerate
    delete cloneData.sku; // Will regenerate
    delete cloneData.generationBatchId;

    // Optional inventory copying
    let activeQty = 0;
    const WarehouseMaster = mongoose.models.WarehouseMaster;
    const VariantInventory = mongoose.models.VariantInventory;
    let defaultWarehouse = null;

    if (req.body.copyInventory && WarehouseMaster && VariantInventory) {
      defaultWarehouse = await WarehouseMaster.findOne({ isDefault: true }).session(session);
      if (defaultWarehouse) {
        const oldInv = await VariantInventory.findOne({ variant: originalVariant._id, warehouse: defaultWarehouse._id }).session(session);
        if (oldInv) {
          activeQty = oldInv.quantity;
        }
      }
    }

    // New SKU generation using legacy strategy, or we let the model generate one.
    cloneData.skuStrategy = 'AUTO';
    cloneData.sku = undefined;

    // For now we set status to DRAFT
    cloneData.status = 'DRAFT';
    if (req.user && req.user._id) {
      cloneData.governance = cloneData.governance || {};
      cloneData.governance.createdBy = req.user._id;
      cloneData.governance.updatedBy = req.user._id;
      cloneData.governance.isLocked = false;
      cloneData.governance.version = 1;
    }

    // 3. Create
    const newVariant = new VariantMaster(cloneData);
    await newVariant.save({ session });

    // 4. Update usage stats if necessary
    const sizeIds = cloneData.sizes?.map(s => s.sizeId).filter(Boolean) || (cloneData.sizeId ? [cloneData.sizeId] : []);
    if (sizeIds.length > 0 && mongoose.models.SizeMaster) {
      await Promise.all(
        sizeIds.map(sId => mongoose.models.SizeMaster.incrementUsage(sId).session(session))
      );
    }

    // 5. Create Inventory record if requested
    if (req.body.copyInventory && defaultWarehouse && VariantInventory) {
      await VariantInventory.create([{
        variant: newVariant._id,
        warehouse: defaultWarehouse._id,
        quantity: activeQty,
        reservedQuantity: 0
      }], { session });
    }

    await session.commitTransaction();

    // ✅ Recompute Snapshot (Debounced)
    SnapshotService.triggerRecompute(newVariant.productGroupId);

    return res.status(201).json({
      success: true,
      message: 'Variant cloned successfully. Old variant is untouched.',
      data: newVariant
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('[cloneVariant]', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Clone would result in a duplicate variant.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to clone variant.', error: err.message });
  } finally {
    session.endSession();
  }
}
