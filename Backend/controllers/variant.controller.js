const mongoose = require('mongoose');
const VariantMaster = require('../models/masters/VariantMaster.enterprise.js').default || require('../models/masters/VariantMaster.enterprise.js');
const VariantInventory = require('../models/VariantInventory');
const ColorMaster = require('../models/masters/ColorMaster.enterprise.js').default || require('../models/masters/ColorMaster.enterprise.js');
const SizeMaster = require('../models/masters/SizeMaster.enterprise.js').default;
const WarehouseMaster = require('../models/WarehouseMaster');

/**
 * Get all variants for a product group (for PDP)
 * GET /api/variants/group/:productGroup
 */
exports.getByProductGroup = async (req, res) => {
    try {
        const { productGroup } = req.params;

        const variants = await VariantMaster.getByProductGroup(productGroup, true);

        res.json({
            success: true,
            count: variants.length,
            data: variants
        });
    } catch (error) {
        console.error('Error fetching variants:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch variants',
            error: error.message
        });
    }
};

/**
 * SINGLEFLIGHT PATTERN: Anti-Stampede Lock
 * Ensures only one PDP matrix generation runs per ProductGroup at a time across concurrent Node requests.
 */
const pdpMatrixLocks = new Map();

/**
 * Get available configurations for a product group
 * GET /api/variants/group/:productGroupId/configurations
 */
exports.getConfigurations = async (req, res) => {
    try {
        const { productGroupId } = req.params;

        // Ensure we don't stampede the database during high-concurrency cache misses
        if (pdpMatrixLocks.has(productGroupId)) {
            const data = await pdpMatrixLocks.get(productGroupId);
            return res.json({ success: true, data });
        }

        const buildMatrixPromise = (async () => {
            // OPTIMIZATION: Projection ensures we don't drag 10KB of description/content data per variant over the wire
            const variants = await VariantMaster.find({
                productGroupId,
                status: 'ACTIVE'
            })
                .select('sku price imageGallery inventory colorId sizes')
                .populate('colorId', 'name hexCode category')
                .populate('sizes.sizeId', 'value displayName sortOrder')
                .lean();

            if (variants.length === 0) {
                return null;
            }

            // Initialize output format
            const responseData = {
                productGroupId: productGroupId,
                defaultVariantId: variants[0]._id.toString(), // Prevents invalid initial selections on frontend
                selectors: {},
                matrix: {},
                variantDictionary: {}
            };

            const colorMap = new Map();
            const sizeMaps = {};

            variants.forEach(variant => {
                const tokenKeys = [];

                // 1) Color Token
                if (variant.colorId) {
                    const cId = variant.colorId._id.toString();
                    tokenKeys.push(cId);
                    if (!colorMap.has(cId)) {
                        colorMap.set(cId, {
                            id: cId,
                            label: variant.colorId.name,
                            hex: variant.colorId.hexCode
                        });
                    }
                }

                // 2) Size Tokens
                if (variant.sizes && variant.sizes.length > 0) {
                    variant.sizes.forEach(sz => {
                        const sId = sz.sizeId._id.toString();
                        tokenKeys.push(sId);

                        if (!sizeMaps[sz.category]) sizeMaps[sz.category] = new Map();
                        if (!sizeMaps[sz.category].has(sId)) {
                            sizeMaps[sz.category].set(sId, {
                                id: sId,
                                label: sz.sizeId.displayName || sz.sizeId.value,
                                sortOrder: sz.sizeId.sortOrder
                            });
                        }
                    });
                }

                // Generate deterministic key for combination matrix
                const combinationKey = tokenKeys.sort().join('.');
                responseData.matrix[combinationKey] = variant._id.toString();

                // Populate Dicionary
                responseData.variantDictionary[variant._id.toString()] = {
                    sku: variant.sku,
                    price: parseFloat(variant.price?.toString() || 0),
                    images: variant.imageGallery || [],
                    inventory: variant.inventory?.quantityOnHand || 0
                };
            });

            // 3) Format Selectors Array for React
            if (colorMap.size > 0) {
                responseData.selectors['Color'] = Array.from(colorMap.values());
            }
            Object.entries(sizeMaps).forEach(([cat, sMap]) => {
                const titleCase = cat.charAt(0).toUpperCase() + cat.slice(1);
                responseData.selectors[titleCase] = Array.from(sMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
            });

            return responseData;
        })();

        pdpMatrixLocks.set(productGroupId, buildMatrixPromise);

        try {
            const data = await buildMatrixPromise;
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'No variants found for this product group'
                });
            }
            res.json({ success: true, data });
        } finally {
            // Always remove the lock once computation resolves or rejects
            pdpMatrixLocks.delete(productGroupId);
        }
    } catch (error) {
        console.error('Error fetching configurations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch configurations',
            error: error.message
        });
    }
};

/**
 * Get single variant by ID
 * GET /api/variants/:variantId
 */
exports.getById = async (req, res) => {
    try {
        const { variantId } = req.params;

        const variant = await VariantMaster.findById(variantId)
            .populate('color')
            .populate('sizes.sizeId');

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        // Get stock information
        const stock = await VariantInventory.getTotalStock(variantId);

        res.json({
            success: true,
            data: {
                ...variant.toObject(),
                stock
            }
        });
    } catch (error) {
        console.error('Error fetching variant:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch variant',
            error: error.message
        });
    }
};

/**
 * Get stock for a variant
 * GET /api/variants/:variantId/stock
 */
exports.getStock = async (req, res) => {
    try {
        const { variantId } = req.params;

        const stock = await VariantInventory.getTotalStock(variantId);

        // Get warehouse-wise breakdown
        const warehouseStock = await VariantInventory.find({ variant: variantId })
            .populate('warehouse', 'name code')
            .lean();

        res.json({
            success: true,
            data: {
                total: stock,
                warehouses: warehouseStock.map(inv => ({
                    warehouse: inv.warehouse,
                    quantity: inv.quantity,
                    reserved: inv.reservedQuantity,
                    available: inv.quantity - inv.reservedQuantity
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stock',
            error: error.message
        });
    }
};

/**
 * Create a new variant (Admin)
 * POST /api/admin/variants
 */
exports.create = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const body = req.body;
        const variantsToCreate = Array.isArray(body.variants) ? body.variants : [body];
        const createdVariants = [];

        for (const variantData of variantsToCreate) {
            // Support both legacy "productGroup" and enterprise "productGroupId"
            const productGroupId = variantData.productGroupId || variantData.productGroup || body.productId || body.productGroupId;

            if (!productGroupId || !variantData.price) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields for one or more variants (productGroupId/price). SKU: ${variantData.sku || 'N/A'}`
                });
            }

            variantData.productGroupId = productGroupId;

            if (!variantData.sku) {
                const sizeValues = variantData.sizes?.map(s => s.value) || [];
                const color = variantData.colorId ? await ColorMaster.findById(variantData.colorId).session(session) : null;
                variantData.sku = await VariantMaster.generateSKU(
                    variantData.brand || variantData.brandId || body.brandId,
                    productGroupId,
                    sizeValues,
                    color?.name || variantData.displayColorName
                );
            }

            const variant = new VariantMaster(variantData);
            await variant.save({ session });

            // Increment usageCount for every size assigned to this variant
            const sizeIds = variantData.sizes?.map(s => s.sizeId).filter(Boolean) || (variantData.sizeId ? [variantData.sizeId] : []);
            if (sizeIds.length > 0) {
                await Promise.all(
                    sizeIds.map(sizeId => SizeMaster.incrementUsage(sizeId).session(session))
                );
            }

            const defaultWarehouse = await WarehouseMaster.findOne({ isDefault: true }).session(session);
            if (defaultWarehouse) {
                await VariantInventory.create([{
                    variant: variant._id,
                    warehouse: defaultWarehouse._id,
                    quantity: 0,
                    reservedQuantity: 0
                }], { session });
            }
            createdVariants.push(variant);
        }

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: `${createdVariants.length} Variant(s) created successfully`,
            data: createdVariants.length === 1 ? createdVariants[0] : createdVariants
        });


    } catch (error) {
        await session.abortTransaction();
        console.error('[variant.create] error:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            return res.status(409).json({
                success: false,
                message: `Duplicate ${field}. This configuration already exists.`
            });
        }
        return res.status(500).json({ success: false, message: 'Failed to create variant', error: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Update a variant (Admin)
 * PUT /api/admin/variants/:id
 */
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating critical fields
        delete updates.sku;
        delete updates.configHash;
        delete updates._id;

        const variant = await VariantMaster.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        )
            .populate('color')
            .populate('sizes.sizeId');

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        res.json({
            success: true,
            message: 'Variant updated successfully',
            data: variant
        });
    } catch (error) {
        console.error('Error updating variant:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update variant',
            error: error.message
        });
    }
};

/**
 * Soft delete a variant (Admin)
 * DELETE /api/admin/variants/:id
 */
exports.delete = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;

        const variant = await VariantMaster.findById(id).session(session);
        if (!variant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        // Soft delete
        variant.status = 'deleted';
        await variant.save({ session });

        // Decrement usageCount for all sizes this variant held
        const sizeIds = variant.sizes?.map(s => s.sizeId).filter(Boolean) || [];
        if (sizeIds.length > 0) {
            await Promise.all(
                sizeIds.map(sizeId => SizeMaster.decrementUsage(sizeId).session(session))
            );
        }

        await session.commitTransaction();

        return res.json({
            success: true,
            message: 'Variant deleted successfully',
            data: variant
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('[variant.delete] error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete variant', error: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Adjust inventory (Admin)
 * POST /api/admin/inventory/adjust
 */
exports.adjustInventory = async (req, res) => {
    try {
        const { variantId, warehouseId, adjustment, transactionType, referenceId, notes } = req.body;

        if (!variantId || !warehouseId || adjustment === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: variantId, warehouseId, adjustment'
            });
        }

        const inventory = await VariantInventory.adjustStock(
            variantId,
            warehouseId,
            adjustment,
            transactionType || 'adjustment',
            referenceId,
            notes
        );

        res.json({
            success: true,
            message: 'Inventory adjusted successfully',
            data: inventory
        });
    } catch (error) {
        console.error('Error adjusting inventory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to adjust inventory',
            error: error.message
        });
    }
};

/**
 * Add images to variant (Admin)
 * POST /api/admin/variants/:id/images
 */
exports.addImages = async (req, res) => {
    try {
        const { id } = req.params;
        const { images } = req.body;

        if (!images || !Array.isArray(images)) {
            return res.status(400).json({
                success: false,
                message: 'Images array is required'
            });
        }

        const variant = await VariantMaster.findById(id);

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        variant.images.push(...images);
        await variant.save();

        res.json({
            success: true,
            message: 'Images added successfully',
            data: variant
        });
    } catch (error) {
        console.error('Error adding images:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add images',
            error: error.message
        });
    }
};
