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
import { VariantIntegrityService } from '../../services/variantIntegrity.service.js';
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
      sizes, // NEW: Accepts array of sizes to match enterprise format
      colorId,
      attributeValueIds = [],
      price,
      compareAtPrice,
      imageGallery = [],
      status = 'INACTIVE',
    } = req.body;

    const actualSizeId = sizeId || (sizes && sizes.length > 0 ? sizes[0].sizeId : null);

    // ── 1. Required field guard ──────────────────────────────────────────
    if (!productGroupId || !actualSizeId || !colorId || price == null) {
      return res.status(400).json({
        success: false,
        message: 'productGroupId, sizeId/sizes, colorId, and price are required.',
      });
    }

    // ── 2. Validate references exist in parallel ─────────────────────────
    const [size, color, attrValues] = await Promise.all([
      SizeMaster.findById(actualSizeId).select('_id displayName category lifecycleState').lean(),
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
      return res.status(400).json({ success: false, message: `Size not found: ${actualSizeId}` });
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
    const configHash = generateConfigHash({ productGroupId, sizeId: actualSizeId, colorId, attributeValueIds });

    // ── 4. Persist ───────────────────────────────────────────────────────
    const variant = await VariantMaster.create({
      productGroupId,
      sizes: sizes || [{ sizeId: actualSizeId, category: size.category || 'DIMENSION' }],
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
    const productGroupId = req.params.productGroupId || req.query.productId;
    const filter = { productGroupId };

    // Support PDP frontend explicitly requesting ACTIVE only
    if (req.query.status === 'ACTIVE') {
      filter.status = 'ACTIVE';
    }

    // Fetch variants — single query, fully populated, lean for performance
    const variants = await VariantMaster.find(filter)
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

    // ── Admin Bypass (Raw unflattened data) ─────────────────────
    if (req.query.raw === 'true') {
      return res.status(200).json({
        success: true,
        count: variants.length,
        data: variants,
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

    // Single destructure — extracts version/governance for OCC check, strips all identity
    // fields  and governance from the safe update payload in one pass.
    // ⚠️ governance MUST NOT be in $set — it would conflict with $inc: {'governance.version': 1}
    const {
      version: directVersion,
      governance,
      configHash,
      sizeId,
      colorId,
      productGroup,
      productGroupId,
      attributeValueIds,
      attributeDimensions,
      sizes,
      ...safeUpdates
    } = req.body;

    const version = directVersion !== undefined ? directVersion : governance?.version;

    if (version === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Optimistic Concurrency Control requires "version" in request body.',
      });
    }

    // ✅ Step 3 — Refactored to .save() for hook support (Image Gallery, Validations)
    const variantDoc = await VariantMaster.findById(id);

    if (!variantDoc) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found.',
      });
    }

    // Check if any identity modifying fields are passed and if they differ from current
    const identityFields = {
      productGroupId,
      sizeId,
      colorId,
      configHash,
    };

    const violations = [];
    Object.entries(identityFields).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        const currentVal = variantDoc[key]?.toString();
        const newVal = val?.toString();
        if (currentVal !== newVal) {
          console.warn(`[updateVariant] Identity violation on ${key}: current='${currentVal}' new='${newVal}'`);
          violations.push(key);
        }
      }
    });

    // Deep check for attributeDimensions if provided
    if (attributeDimensions && Array.isArray(attributeDimensions)) {
      const currentDims = JSON.stringify(variantDoc.attributeDimensions || []);
      const newDims = JSON.stringify(attributeDimensions);
      if (currentDims !== newDims) {
        console.warn(`[updateVariant] Identity violation on attributeDimensions: current='${currentDims}' new='${newDims}'`);
        violations.push('attributeDimensions');
      }
    }

    if (violations.length > 0) {
      console.warn(`[updateVariant] Returning 400. Body:`, req.body);
      return res.status(400).json({
        success: false,
        message: `Variant identity is immutable. Fields changed: ${violations.join(', ')}. Archive and recreate instead.`,
      });
    }

    // ✅ Step 3 — Require Version Match on Update (Optimistic Locking)
    //
    // MongoDB RULES on path conflicts in a single update:
    //   ✅ ALLOWED:  $set: { 'governance.updatedBy': x } + $inc: { 'governance.version': 1 }
    //      (dot-notation sub-fields of same parent in DIFFERENT operators = OK)
    //   ❌ BLOCKED:  $set: { governance: {...} } + $inc: { 'governance.version': 1 }
    //      (full object key conflicts with dot-notation sub-key = WriteConflict)
    //
    // safeUpdates is safe — 'governance' object was stripped during destructure above.
    // We add governance sub-fields as explicit dot-notation keys (never the full object).
    console.log('[updateVariant] safeUpdates:', JSON.stringify(safeUpdates));

    // Check OCC version manually (redundant if optimisticConcurrency is on, but keeps logic explicit)
    // Note: variantDoc.governance.version is the DB value. 'version' is the value from the UI.
    const currentVersion = variantDoc.governance?.version ?? 1;
    if (currentVersion !== version) {
      return res.status(409).json({
        success: false,
        message: `Version mismatch. UI has version ${version} but DB has ${currentVersion}. Please refresh.`,
        error: 'CONFLICT',
        code: 'OCC_CONFLICT'
      });
    }

    // ✅ Apply safe business field updates using .set() for better Mongoose tracking
    if (safeUpdates.price !== undefined) variantDoc.set('price', safeUpdates.price);
    if (safeUpdates.sku !== undefined) variantDoc.set('sku', safeUpdates.sku);
    if (safeUpdates.status !== undefined) variantDoc.set('status', safeUpdates.status);
    if (safeUpdates.imageGallery !== undefined) variantDoc.set('imageGallery', safeUpdates.imageGallery);
    if (safeUpdates.compareAtPrice !== undefined) variantDoc.set('compareAtPrice', safeUpdates.compareAtPrice);

    // Accept array repairs
    if (sizes !== undefined) variantDoc.set('sizes', sizes);
    if (attributeValueIds !== undefined) variantDoc.set('attributeValueIds', attributeValueIds);

    // Apply any other safe non-governance fields
    Object.entries(safeUpdates).forEach(([k, v]) => {
      const skipped = ['id', 'price', 'sku', 'status', 'imageGallery', 'compareAtPrice', 'governance', '_id', '__v'];
      if (!skipped.includes(k) && !k.startsWith('governance')) {
        variantDoc.set(k, v);
      }
    });

    // Auditor metadata
    if (!variantDoc.governance) variantDoc.governance = {};
    if (req.user?._id) {
      variantDoc.set('governance.updatedBy', req.user._id);
    }
    variantDoc.set('governance.updatedAt', new Date());

    // Save triggers pre('save') hooks. 
    // Since optimisticConcurrency: true is set in schema, this will throw VersionError if version changed.
    const updated = await variantDoc.save();
    console.log("STEP 5 - Saved Document:", updated);

    // ✅ Recompute Snapshot (Debounced)
    SnapshotService.triggerRecompute(updated.productGroupId);

    return res.status(200).json({ success: true, message: 'Variant updated.', data: updated });
  } catch (err) {
    // ── DIAGNOSTIC LOG: always log name + message so we know the real cause ──
    console.error('[updateVariant] Error caught — name:', err.name, '| code:', err.code, '| statusCode:', err.statusCode, '| message:', err.message);

    // 1. Mongoose OCC VersionError or duplicate key (E11000)
    if (err.name === 'VersionError' || err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: This variant was modified elsewhere. Please refresh and try again.',
        error: 'CONFLICT',
        code: 'OCC_CONFLICT'
      });
    }

    // 2. Mongoose built-in ValidationError (schema field validators)
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: 'VALIDATION_ERROR',
        code: 'VALIDATION_ERROR'
      });
    }

    // 3. Custom ApiError subclasses (ValidationError, NotFoundError, ConflictError, etc.)
    //    thrown by assertCategoryScope() and other service helpers.
    //    These have err.name === 'ApiError' and err.statusCode set.
    if (err.name === 'ApiError' && err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err.code || 'API_ERROR',
        code: err.code || 'API_ERROR',
        ...(err.details ? { details: err.details } : {})
      });
    }

    // 4. Generic Error throws from pre-save hooks (e.g., compareAtPrice guard,
    //    size category duplication check, status transition guard).
    //    These have err.name === 'Error' — surface as 400 Bad Request.
    if (err.name === 'Error') {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: 'VALIDATION_ERROR',
        code: 'VALIDATION_ERROR'
      });
    }

    // 5. Fallback — truly unexpected errors
    return res.status(500).json({
      success: false,
      message: 'Internal Server error during variant update.',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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

/**
 * ✅ 10. PRODUCT DATA INTEGRITY REPAIR
 * Manual trigger for fixing broken variants.
 */
export async function repairVariant(req, res) {
  try {
    const { id } = req.params;
    const variant = await VariantMaster.findById(id);

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    const result = await VariantIntegrityService.validateAndRepairVariant(variant);

    if (result.success) {
      // ✅ Recompute Snapshot
      if (variant.productGroupId) {
        SnapshotService.triggerRecompute(variant.productGroupId);
      }
      return res.json(result);
    } else {
      return res.status(422).json(result);
    }
  } catch (err) {
    console.error('[repairVariant]', err);
    return res.status(500).json({ success: false, message: 'Repair processing failed', error: err.message });
  }
}
/**
 * ✅ 11. BULK DATA INTEGRITY REPAIR (Product Group Level)
 * Repaires all variants linked to a specific product group.
 */
export async function repairProductGroupVariants(req, res) {
  try {
    const { id } = req.params; // productGroupId
    const variants = await VariantMaster.find({ productGroupId: id });

    if (!variants.length) {
      return res.status(404).json({ success: false, message: 'No variants found for this product group' });
    }

    const results = await Promise.all(
      variants.map(v => VariantIntegrityService.validateAndRepairVariant(v))
    );

    const totalIssues = results.reduce((acc, r) => acc + r.issuesFound.length, 0);
    const totalFixes = results.reduce((acc, r) => acc + r.fixesApplied.length, 0);

    // ✅ Recompute Snapshot
    SnapshotService.triggerRecompute(id);

    return res.json({
      success: true,
      message: `Processed ${variants.length} variants.`,
      summary: {
        totalIssues,
        totalFixes,
        variantsProcessed: variants.length
      }
    });

  } catch (err) {
    console.error('[repairProductGroupVariants]', err);
    return res.status(500).json({ success: false, message: 'Bulk repair failed', error: err.message });
  }
}
