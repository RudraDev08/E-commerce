const VariantMaster = require('../models/VariantMaster');
const VariantInventory = require('../models/VariantInventory');
const ColorMaster = require('../models/ColorMaster');
const SizeMaster = require('../models/SizeMaster');
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
 * Get available configurations for a product group
 * GET /api/variants/group/:productGroup/configurations
 */
exports.getConfigurations = async (req, res) => {
    try {
        const { productGroup } = req.params;

        const variants = await VariantMaster.find({
            productGroup,
            status: 'active'
        })
            .populate('color')
            .populate('sizes.sizeId')
            .lean();

        if (variants.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No variants found for this product group'
            });
        }

        // Extract unique configurations
        const configurations = {
            sizes: {},
            colors: [],
            attributes: {},
            productInfo: {
                name: variants[0].productName,
                brand: variants[0].brand,
                category: variants[0].category,
                subcategory: variants[0].subcategory
            }
        };

        const colorMap = new Map();
        const sizeMap = {};

        variants.forEach(variant => {
            // Extract sizes by category
            variant.sizes?.forEach(size => {
                if (!sizeMap[size.category]) {
                    sizeMap[size.category] = new Map();
                }
                const sizeKey = size.sizeId._id.toString();
                if (!sizeMap[size.category].has(sizeKey)) {
                    sizeMap[size.category].set(sizeKey, {
                        id: size.sizeId._id,
                        value: size.value,
                        displayName: size.sizeId.displayName,
                        sortOrder: size.sizeId.sortOrder
                    });
                }
            });

            // Extract unique colors
            if (variant.color) {
                const colorKey = variant.color._id.toString();
                if (!colorMap.has(colorKey)) {
                    colorMap.set(colorKey, {
                        id: variant.color._id,
                        name: variant.color.name,
                        hexCode: variant.color.hexCode,
                        category: variant.color.category
                    });
                }
            }
        });

        // Convert maps to sorted arrays
        Object.keys(sizeMap).forEach(category => {
            configurations.sizes[category] = Array.from(sizeMap[category].values())
                .sort((a, b) => a.sortOrder - b.sortOrder);
        });

        configurations.colors = Array.from(colorMap.values());

        res.json({
            success: true,
            data: configurations
        });
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
    try {
        const variantData = req.body;

        // Validate required fields
        if (!variantData.productGroup || !variantData.productName || !variantData.price) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: productGroup, productName, price'
            });
        }

        // Generate SKU if not provided
        if (!variantData.sku) {
            const sizeValues = variantData.sizes?.map(s => s.value) || [];
            const color = variantData.color ? await ColorMaster.findById(variantData.color) : null;

            variantData.sku = await VariantMaster.generateSKU(
                variantData.brand,
                variantData.productGroup,
                sizeValues,
                color?.name
            );
        }

        // Create variant
        const variant = new VariantMaster(variantData);
        await variant.save();

        // Initialize inventory for default warehouse
        const defaultWarehouse = await WarehouseMaster.findOne({ isDefault: true });
        if (defaultWarehouse) {
            await VariantInventory.create({
                variant: variant._id,
                warehouse: defaultWarehouse._id,
                quantity: 0,
                reservedQuantity: 0
            });
        }

        res.status(201).json({
            success: true,
            message: 'Variant created successfully',
            data: variant
        });
    } catch (error) {
        console.error('Error creating variant:', error);

        // Handle duplicate errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `Duplicate ${field}. This configuration already exists.`,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create variant',
            error: error.message
        });
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
    try {
        const { id } = req.params;

        const variant = await VariantMaster.findByIdAndUpdate(
            id,
            { status: 'deleted' },
            { new: true }
        );

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        res.json({
            success: true,
            message: 'Variant deleted successfully',
            data: variant
        });
    } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete variant',
            error: error.message
        });
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
