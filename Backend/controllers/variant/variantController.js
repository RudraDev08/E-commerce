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
import { generateConfigHash } from '../../utils/configHash.util.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flatten a raw VariantMaster lean document into a clean customer-facing shape.
 * Called inside the controller — never inside a Mongoose virtual to stay lean().
 */
function flattenVariant(v) {
  return {
    _id: v._id,
    status: v.status,
    price: v.price ? parseFloat(v.price.toString()) : null,
    compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice.toString()) : null,
    imageGallery: v.imageGallery ?? [],

    size: v.sizeId
      ? {
        _id: v.sizeId._id,
        displayName: v.sizeId.displayName,
        value: v.sizeId.value,
        category: v.sizeId.category,
        gender: v.sizeId.gender,
        // Expose common measurement fields without duplicating the master
        measurements: v.sizeId.measurements ?? null,
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
      .select('price compareAtPrice status imageGallery sizeId colorId attributeValueIds configHash')
      .populate('sizeId', 'displayName value category gender measurements normalizedRank')
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
      .populate('sizeId', 'displayName value category gender measurements')
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

    // Strip identity fields — they must never be patched directly
    const { configHash, sizeId, colorId, productGroupId, attributeValueIds, ...safeUpdates } = req.body;
    if (sizeId || colorId || productGroupId || attributeValueIds || configHash) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update sizeId, colorId, productGroupId, attributeValueIds, or configHash. Create a new variant instead.',
      });
    }

    safeUpdates['governance.updatedBy'] = req.user?._id;

    const variant = await VariantMaster.findByIdAndUpdate(id, safeUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    return res.status(200).json({ success: true, message: 'Variant updated.', data: variant });
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
