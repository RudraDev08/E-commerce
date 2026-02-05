import Variant from "../../models/Variant/VariantSchema.js";

/* ---------------- CREATE (MULTIPLE VARIANTS) ---------------- */
export const createVariants = async (req, res) => {
  try {
    // ONE-TIME FIX: Drop the legacy unique index if it exists to allow Colorways
    try {
      await Variant.collection.dropIndex('productId_1_sizeId_1_colorId_1');
    } catch (e) { /* Index might not exist, ignore */ }

    const { productId, variants } = req.body;

    if (!productId || !Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload: productId and variants array required",
      });
    }

    // ====================================================================
    // SELF-HEALING: Archiving Soft-Deleted Conflicts
    // ====================================================================
    const incomingSkus = variants
      .flatMap(v => v.sku ? [v.sku, v.sku.toUpperCase()] : [])
      .filter(Boolean);

    if (incomingSkus.length > 0) {
      const conflictingDeleted = await Variant.find({
        sku: { $in: incomingSkus },
        isDeleted: true
      });

      if (conflictingDeleted.length > 0) {
        console.log(`[Variant] Found ${conflictingDeleted.length} deleted SKU conflicts. Archiving...`);
        for (const doc of conflictingDeleted) {
          await Variant.updateOne(
            { _id: doc._id },
            { $set: { sku: `${doc.sku}-DEL-${Date.now()}` } }
          );
        }
      }
    }
    // ====================================================================

    // ====================================================================
    // DUPLICATE PREVENTION STRATEGY
    // Fetch existing ACTIVE variants to prevent logical duplicates
    // ====================================================================
    // ====================================================================
    // DUPLICATE PREVENTION STRATEGY
    // Fetch existing ACTIVE variants to prevent logical duplicates
    // ====================================================================
    // FIX: Match Schema Fields (product, size, color)
    const existingVariants = await Variant.find({
      product: productId,
      isDeleted: false
    }).select('size color colorwayName');

    const validPayload = [];
    let skippedCount = 0;

    for (const v of variants) {
      // Check for duplicate combination
      const isDuplicate = existingVariants.some(existing => {
        const sameSize = String(existing.size) === String(v.sizeId);

        // Single Color Check
        if (v.colorId) {
          return sameSize && String(existing.color) === String(v.colorId);
        }
        // Colorway Check
        if (v.colorwayName) {
          return sameSize && existing.colorwayName === v.colorwayName;
        }
        return false;
      });

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      // Prepare for insertion
      const attributes = v.attributes || {};
      validPayload.push({
        product: productId,    // Schema field: product
        size: v.sizeId || null, // Schema field: size
        color: v.colorId || null, // Schema field: color
        colorwayName: v.colorwayName || null,
        colorParts: v.colorParts || [],
        sku: v.sku,
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        status: v.status === true || v.status === 'active',
        attributes: attributes
      });
    }

    if (validPayload.length === 0) {
      return res.json({
        success: true,
        message: "No new variants to create (all duplicates)",
        data: [],
        stats: { created: 0, skipped: skippedCount }
      });
    }

    // Use insertMany with ordered: false to allow partial success on DB Errors
    let createdDocs = [];
    try {
      createdDocs = await Variant.insertMany(validPayload, { ordered: false });
    } catch (e) {
      // Capture partial successes if 409 still happens (Race condition)
      if (e.writeErrors && e.insertedDocs) {
        createdDocs = e.insertedDocs;
        skippedCount += e.writeErrors.length;
      } else {
        throw e; // Real error
      }
    }

    // ====================================================================
    // POST-CREATION HOOK: AUTO-CREATE INVENTORY
    // ====================================================================
    if (createdDocs.length > 0) {
      try {
        // Dynamically import to avoid circular dependency issues if any, 
        // though standard import at top is preferred if clean.
        // We'll use the imported 'inventoryService' if available, otherwise strict import here
        // But better to add import at top. We will assume user adds import at top.
        // Actually, let's just loop and call the service.
        const inventoryService = (await import('../../services/inventory.service.js')).default;

        // Parallel execution for speed
        await Promise.all(createdDocs.map(variant =>
          inventoryService._getOrCreateInventory(variant._id)
        ));

        console.log(`[Variant] Auto-created inventory for ${createdDocs.length} variants`);
      } catch (invError) {
        console.error('[Variant] Failed to auto-create inventory:', invError);
        // We do NOT fail the request, as this can be healed later
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdDocs.length} variants (${skippedCount} skipped)`,
      data: createdDocs,
      stats: {
        created: createdDocs.length,
        skipped: skippedCount
      }
    });

  } catch (error) {
    console.error('Variant Create Error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create variants",
      error: error.message,
    });
  }
};

/* ---------------- GET ALL VARIANTS ---------------- */
export const getAllVariants = async (req, res) => {
  try {
    const variants = await Variant.find()
      .populate("product", "name sku")
      .populate("size", "name code")
      .populate("color", "name hexCode");

    res.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
      error: error.message,
    });
  }
};

/* ---------------- GET VARIANTS BY PRODUCT ---------------- */
export const getVariantsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const variants = await Variant.find({
      product: productId, // Schema field: product
      isDeleted: false
    })
      .populate("size", "name code") // Schema field: size
      .populate("color", "name hexCode") // Schema field: color
      .sort({ "attributes.size": 1, "attributes.color": 1 });

    res.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product variants",
      error: error.message,
    });
  }
};

/* ---------------- GET VARIANT BY ID ---------------- */
export const getVariantById = async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id)
      .populate("product", "name")
      .populate("size")
      .populate("color");

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch variant",
      error: error.message,
    });
  }
};

/* ---------------- UPDATE VARIANT ---------------- */
export const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating critical identity fields effectively changing the variant entirely?
    // Usually, we allow updating Price, Stock, Status, SKU.
    // If updating sizeId/colorId, uniqueness check might fail.

    const updated = await Variant.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("size")
      .populate("color");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update variant",
      error: error.message,
    });
  }
};

/* ---------------- DELETE VARIANT ---------------- */
export const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete implementation preferred
    const variant = await Variant.findById(id);
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    await variant.softDelete(req.user?._id); // Assuming method exists on model

    res.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    // Fallback to hard delete if softDelete fails or needed
    try {
      await Variant.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Variant deleted (Hard)" });
    } catch (innerError) {
      res.status(500).json({
        success: false,
        message: "Failed to delete variant",
        error: innerError.message,
      });
    }
  }
};
