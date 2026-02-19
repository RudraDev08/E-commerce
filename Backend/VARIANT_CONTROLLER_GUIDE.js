/**
 * VARIANT SYSTEM - QUICK IMPLEMENTATION GUIDE
 * 
 * This file shows how to use the new Variant.model.js in your controllers
 */

import Variant from '../models/masters/VariantMaster.enterprise.js';
import Size from '../models/masters/SizeMaster.enterprise.js';
import Color from '../models/masters/ColorMaster.enterprise.js';
import Product from '../src/modules/product/product.model.js';

// ============================================================================
// 1. CREATE VARIANT (Admin Panel)
// ============================================================================

export const createVariant = async (req, res) => {
    try {
        const { productId, sizeId, colorId, price, sellingPrice, stock, image } = req.body;

        // Validate product exists and is active
        const product = await Product.findOne({
            _id: productId,
            status: 'active',
            isDeleted: false
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or inactive'
            });
        }

        // Validate size (if provided)
        if (sizeId) {
            const size = await Size.findOne({
                _id: sizeId,
                status: 'active',
                isDeleted: false
            });

            if (!size) {
                return res.status(400).json({
                    success: false,
                    message: 'Size is inactive or deleted'
                });
            }
        }

        // Validate color (if provided)
        if (colorId) {
            const color = await Color.findOne({
                _id: colorId,
                status: 'active',
                isDeleted: false
            });

            if (!color) {
                return res.status(400).json({
                    success: false,
                    message: 'Color is inactive or deleted'
                });
            }
        }

        // Check if variant already exists
        const exists = await Variant.exists(productId, sizeId, colorId);
        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Variant already exists for this combination'
            });
        }

        // Create variant (SKU auto-generated)
        const variant = await Variant.create({
            productId,
            sizeId: sizeId || null,
            colorId: colorId || null,
            price,
            sellingPrice: sellingPrice || price,
            stock: stock || 0,
            image: image || '',
            createdBy: req.user?._id
        });

        // Populate references
        await variant.populate('sizeId', 'name code value');
        await variant.populate('colorId', 'name hexCode slug');

        res.status(201).json({
            success: true,
            message: 'Variant created successfully',
            data: variant
        });

    } catch (error) {
        console.error('Create variant error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Variant already exists for this combination'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create variant',
            error: error.message
        });
    }
};

// ============================================================================
// 2. BULK CREATE VARIANTS (Admin Panel)
// ============================================================================

export const bulkCreateVariants = async (req, res) => {
    try {
        const { productId, sizeIds, colorIds, basePrice, baseStock } = req.body;

        // Validate product
        const product = await Product.findOne({
            _id: productId,
            status: 'active',
            isDeleted: false
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or inactive'
            });
        }

        const createdVariants = [];
        const errors = [];

        // Create all combinations
        for (const sizeId of sizeIds) {
            for (const colorId of colorIds) {
                try {
                    // Check if exists
                    const exists = await Variant.exists(productId, sizeId, colorId);
                    if (exists) {
                        errors.push({
                            sizeId,
                            colorId,
                            error: 'Variant already exists'
                        });
                        continue;
                    }

                    // Create variant
                    const variant = await Variant.create({
                        productId,
                        sizeId,
                        colorId,
                        price: basePrice,
                        sellingPrice: basePrice,
                        stock: baseStock || 0,
                        createdBy: req.user?._id
                    });

                    createdVariants.push(variant);

                } catch (err) {
                    errors.push({
                        sizeId,
                        colorId,
                        error: err.message
                    });
                }
            }
        }

        res.status(201).json({
            success: true,
            message: `Created ${createdVariants.length} variants`,
            data: {
                created: createdVariants.length,
                failed: errors.length,
                variants: createdVariants,
                errors: errors
            }
        });

    } catch (error) {
        console.error('Bulk create variants error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create variants',
            error: error.message
        });
    }
};

// ============================================================================
// 3. GET VARIANTS BY PRODUCT (Customer Website)
// ============================================================================

export const getVariantsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // Fetch active variants with populated references
        const variants = await Variant.find({
            productId,
            status: true,
            isDeleted: false
        })
            .populate('sizeId', 'name code value priority')
            .populate('colorId', 'name hexCode slug priority')
            .sort({ 'sizeId.priority': 1, 'colorId.priority': 1 })
            .lean();

        // Calculate inventory summary
        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
        const totalReserved = variants.reduce((sum, v) => sum + (v.reserved || 0), 0);
        const sellableStock = totalStock - totalReserved;

        res.json({
            success: true,
            data: variants,
            meta: {
                count: variants.length,
                totalStock,
                sellableStock,
                inStockCount: variants.filter(v => v.stock > 0).length
            }
        });

    } catch (error) {
        console.error('Get variants error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch variants',
            error: error.message
        });
    }
};

// ============================================================================
// 4. GET VARIANT BY COMBINATION (Customer Website)
// ============================================================================

export const getVariantByCombo = async (req, res) => {
    try {
        const { productId, sizeId, colorId } = req.query;

        const variant = await Variant.findByCombo(productId, sizeId, colorId);

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found for this combination'
            });
        }

        res.json({
            success: true,
            data: variant
        });

    } catch (error) {
        console.error('Get variant by combo error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch variant',
            error: error.message
        });
    }
};

// ============================================================================
// 5. UPDATE VARIANT (Admin Panel)
// ============================================================================

export const updateVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, sellingPrice, stock, image, status } = req.body;

        const variant = await Variant.findOne({
            _id: id,
            isDeleted: false
        });

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        // Update fields
        if (price !== undefined) variant.price = price;
        if (sellingPrice !== undefined) variant.sellingPrice = sellingPrice;
        if (stock !== undefined) variant.stock = stock;
        if (image !== undefined) variant.image = image;
        if (status !== undefined) variant.status = status;

        variant.updatedBy = req.user?._id;

        await variant.save();

        // Populate references
        await variant.populate('sizeId', 'name code value');
        await variant.populate('colorId', 'name hexCode slug');

        res.json({
            success: true,
            message: 'Variant updated successfully',
            data: variant
        });

    } catch (error) {
        console.error('Update variant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update variant',
            error: error.message
        });
    }
};

// ============================================================================
// 6. DELETE VARIANT (Admin Panel - Soft Delete)
// ============================================================================

export const deleteVariant = async (req, res) => {
    try {
        const { id } = req.params;

        const variant = await Variant.findOne({
            _id: id,
            isDeleted: false
        });

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        // Soft delete
        await variant.softDelete(req.user?._id);

        res.json({
            success: true,
            message: 'Variant deleted successfully'
        });

    } catch (error) {
        console.error('Delete variant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete variant',
            error: error.message
        });
    }
};

// ============================================================================
// 7. UPDATE STOCK (Inventory Management)
// ============================================================================

export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

        const variant = await Variant.findOne({
            _id: id,
            isDeleted: false
        });

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        // Update stock
        await variant.updateStock(quantity, operation);

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: {
                variantId: variant._id,
                sku: variant.sku,
                stock: variant.stock,
                sellable: variant.sellable,
                stockStatus: variant.stockStatus
            }
        });

    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stock',
            error: error.message
        });
    }
};

// ============================================================================
// 8. RESERVE STOCK (Cart/Order)
// ============================================================================

export const reserveStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        const variant = await Variant.findOne({
            _id: id,
            isDeleted: false,
            status: true
        });

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found or inactive'
            });
        }

        // Check sellable stock
        if (variant.sellable < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
                data: {
                    requested: quantity,
                    available: variant.sellable
                }
            });
        }

        // Reserve stock
        await variant.reserve(quantity);

        res.json({
            success: true,
            message: 'Stock reserved successfully',
            data: {
                variantId: variant._id,
                reserved: variant.reserved,
                sellable: variant.sellable
            }
        });

    } catch (error) {
        console.error('Reserve stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reserve stock',
            error: error.message
        });
    }
};

// ============================================================================
// 9. GET INVENTORY SUMMARY (Dashboard)
// ============================================================================

export const getInventorySummary = async (req, res) => {
    try {
        const { productId } = req.params;

        const summary = await Variant.aggregate([
            {
                $match: {
                    productId: mongoose.Types.ObjectId(productId),
                    status: true,
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    totalVariants: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    totalReserved: { $sum: '$reserved' },
                    inStockVariants: {
                        $sum: {
                            $cond: [{ $gt: ['$stock', 0] }, 1, 0]
                        }
                    },
                    outOfStockVariants: {
                        $sum: {
                            $cond: [{ $eq: ['$stock', 0] }, 1, 0]
                        }
                    },
                    lowStockVariants: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gt: ['$stock', 0] },
                                        { $lte: ['$stock', '$minStock'] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const data = summary[0] || {
            totalVariants: 0,
            totalStock: 0,
            totalReserved: 0,
            inStockVariants: 0,
            outOfStockVariants: 0,
            lowStockVariants: 0
        };

        data.sellableStock = data.totalStock - data.totalReserved;

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Get inventory summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory summary',
            error: error.message
        });
    }
};

// ============================================================================
// 10. PREVENT SIZE/COLOR DELETION IF USED
// ============================================================================

export const checkSizeUsage = async (req, res) => {
    try {
        const { sizeId } = req.params;

        const count = await Variant.countDocuments({
            sizeId,
            isDeleted: false
        });

        res.json({
            success: true,
            data: {
                sizeId,
                variantCount: count,
                canDelete: count === 0
            }
        });

    } catch (error) {
        console.error('Check size usage error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check size usage',
            error: error.message
        });
    }
};

export const checkColorUsage = async (req, res) => {
    try {
        const { colorId } = req.params;

        const count = await Variant.countDocuments({
            colorId,
            isDeleted: false
        });

        res.json({
            success: true,
            data: {
                colorId,
                variantCount: count,
                canDelete: count === 0
            }
        });

    } catch (error) {
        console.error('Check color usage error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check color usage',
            error: error.message
        });
    }
};

export default {
    createVariant,
    bulkCreateVariants,
    getVariantsByProduct,
    getVariantByCombo,
    updateVariant,
    deleteVariant,
    updateStock,
    reserveStock,
    getInventorySummary,
    checkSizeUsage,
    checkColorUsage
};
