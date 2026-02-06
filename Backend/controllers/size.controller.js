import Size from '../models/Size.model.js';
import slugify from 'slugify';

// ... (comments)

export const createSize = async (req, res) => {
    try {
        console.log('Create size request body:', req.body);
        const {
            name,
            code,
            value,
            fullName,
            abbreviation,
            category,
            sizeGroup,
            gender,
            displayOrder,
            measurements,
            internationalConversions,
            sizeChartMetadata,
            ram,
            storage,
            storageUnit,
            applicableCategories,
            status,
            priority,
            description
        } = req.body;

        // Generate slug from name if not provided
        let slug = req.body.slug;
        if (!slug && name) {
            slug = slugify(name, { lower: true, strict: true });
        }

        // Ensure slug is present
        if (!slug) {
            return res.status(400).json({ success: false, message: 'Could not generate slug from name' });
        }

        // Check if size code already exists (including deleted)
        const existingSize = await Size.findOne({ code: code.toUpperCase() });
        if (existingSize) {
            if (existingSize.isDeleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Size with this code exists but is deleted. Please restore it from the trash.'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Size code already exists'
            });
        }

        // Create size
        const size = await Size.create({
            name,
            slug,
            code: code.toUpperCase(),
            value,
            fullName,
            abbreviation,
            category: category || 'generic',
            sizeGroup,
            gender: gender || 'unisex',
            displayOrder: displayOrder || 0,
            measurements,
            internationalConversions,
            sizeChartMetadata,
            ram,
            storage,
            storageUnit,
            applicableCategories,
            status: status || 'active',
            priority: priority || 0,
            description,
            createdBy: req.user?._id
        });

        res.status(201).json({
            success: true,
            message: 'Size created successfully',
            data: size
        });
    } catch (error) {
        console.error('Create size error:', error);
        console.error(error.stack);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Size code or name (slug) already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create size'
        });
    }
};

// @desc    Get all sizes
// @route   GET /api/sizes
// @access  Public
export const getSizes = async (req, res) => {
    try {
        const {
            status,
            category,
            sizeCategory, // New: clothing_alpha, shoe_uk, etc.
            sizeGroup,    // New: "Men's Clothing"
            gender,       // New: men, women, unisex
            search,
            page = 1,
            limit = 50,
            sort = 'priority'
        } = req.query;

        // Build query
        const query = { isDeleted: false };

        if (status) {
            query.status = status;
        }

        if (category) {
            query.applicableCategories = category;
        }

        if (sizeCategory) {
            query.category = sizeCategory;
        }

        if (sizeGroup) {
            query.sizeGroup = sizeGroup;
        }

        if (gender) {
            query.gender = gender;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sort options
        let sortOption = {};
        switch (sort) {
            case 'name':
                sortOption = { name: 1 };
                break;
            case 'priority':
                sortOption = { priority: 1, displayOrder: 1, name: 1 };
                break;
            case 'displayOrder':
                sortOption = { displayOrder: 1, name: 1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            default:
                sortOption = { priority: 1, displayOrder: 1, name: 1 };
        }

        // Execute query
        const sizes = await Size.find(query)
            .populate('applicableCategories', 'name slug')
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip);

        // Get total count
        const total = await Size.countDocuments(query);

        res.status(200).json({
            success: true,
            data: sizes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get sizes error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch sizes'
        });
    }
};

// @desc    Get single size
// @route   GET /api/sizes/:id
// @access  Public
export const getSize = async (req, res) => {
    try {
        const size = await Size.findOne({ _id: req.params.id, isDeleted: false })
            .populate('applicableCategories', 'name slug')
            .populate('productCount');

        if (!size) {
            return res.status(404).json({
                success: false,
                message: 'Size not found'
            });
        }

        res.status(200).json({
            success: true,
            data: size
        });
    } catch (error) {
        console.error('Get size error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch size'
        });
    }
};

// @desc    Update size
// @route   PUT /api/sizes/:id
// @access  Admin
export const updateSize = async (req, res) => {
    try {
        const {
            name,
            code,
            value,
            fullName,
            abbreviation,
            category,
            sizeGroup,
            gender,
            displayOrder,
            measurements,
            internationalConversions,
            sizeChartMetadata,
            ram,
            storage,
            storageUnit,
            applicableCategories,
            status,
            priority,
            description
        } = req.body;

        // Find size
        const size = await Size.findOne({ _id: req.params.id, isDeleted: false });
        if (!size) {
            return res.status(404).json({
                success: false,
                message: 'Size not found'
            });
        }

        // Check if code is being changed and if new code exists
        if (code && code.toUpperCase() !== size.code) {
            const existingSize = await Size.findOne({
                code: code.toUpperCase(),
                _id: { $ne: req.params.id },
                isDeleted: false
            });

            if (existingSize) {
                return res.status(400).json({
                    success: false,
                    message: 'Size code already exists'
                });
            }
        }

        // Update fields
        if (name) {
            size.name = name;
            size.slug = slugify(name, { lower: true, strict: true });
        }
        if (code) size.code = code.toUpperCase();
        if (value !== undefined) size.value = value;
        if (fullName !== undefined) size.fullName = fullName;
        if (abbreviation !== undefined) size.abbreviation = abbreviation;
        if (category) size.category = category;
        if (sizeGroup !== undefined) size.sizeGroup = sizeGroup;
        if (gender) size.gender = gender;
        if (displayOrder !== undefined) size.displayOrder = displayOrder;
        if (measurements) size.measurements = measurements;
        if (internationalConversions) size.internationalConversions = internationalConversions;
        if (sizeChartMetadata) size.sizeChartMetadata = sizeChartMetadata;
        if (ram !== undefined) size.ram = ram;
        if (storage !== undefined) size.storage = storage;
        if (storageUnit) size.storageUnit = storageUnit;
        if (applicableCategories) size.applicableCategories = applicableCategories;
        if (status) size.status = status;
        if (priority !== undefined) size.priority = priority;
        if (description !== undefined) size.description = description;
        size.updatedBy = req.user?._id;

        await size.save();

        res.status(200).json({
            success: true,
            message: 'Size updated successfully',
            data: size
        });
    } catch (error) {
        console.error('Update size error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Size code or name (slug) already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update size'
        });
    }
};

// @desc    Delete size (soft delete)
// @route   DELETE /api/sizes/:id
// @access  Admin
export const deleteSize = async (req, res) => {
    try {
        const size = await Size.findOne({ _id: req.params.id, isDeleted: false });

        if (!size) {
            return res.status(404).json({
                success: false,
                message: 'Size not found'
            });
        }

        // Soft delete
        await size.softDelete(req.user?._id);

        res.status(200).json({
            success: true,
            message: 'Size deleted successfully'
        });
    } catch (error) {
        console.error('Delete size error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete size'
        });
    }
};

// @desc    Toggle size status
// @route   PATCH /api/sizes/:id/toggle-status
// @access  Admin
export const toggleStatus = async (req, res) => {
    try {
        const size = await Size.findOne({ _id: req.params.id, isDeleted: false });

        if (!size) {
            return res.status(404).json({
                success: false,
                message: 'Size not found'
            });
        }

        // Toggle status
        size.status = size.status === 'active' ? 'inactive' : 'active';
        size.updatedBy = req.user?._id;
        await size.save();

        res.status(200).json({
            success: true,
            message: `Size ${size.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: size
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to toggle status'
        });
    }
};

// @desc    Bulk create sizes
// @route   POST /api/sizes/bulk
// @access  Admin
export const bulkCreateSizes = async (req, res) => {
    try {
        const { sizes } = req.body;

        if (!Array.isArray(sizes) || sizes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of sizes'
            });
        }

        // Validate and prepare sizes
        const preparedSizes = sizes.map(size => ({
            ...size,
            code: size.code.toUpperCase(),
            createdBy: req.user?._id
        }));

        // Insert sizes
        const createdSizes = await Size.insertMany(preparedSizes, { ordered: false });

        res.status(201).json({
            success: true,
            message: `${createdSizes.length} sizes created successfully`,
            data: createdSizes
        });
    } catch (error) {
        console.error('Bulk create sizes error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create sizes'
        });
    }
};

// @desc    Restore deleted size
// @route   PATCH /api/sizes/:id/restore
// @access  Admin
export const restoreSize = async (req, res) => {
    try {
        const size = await Size.findOne({ _id: req.params.id, isDeleted: true });

        if (!size) {
            return res.status(404).json({
                success: false,
                message: 'Deleted size not found'
            });
        }

        await size.restore();

        res.status(200).json({
            success: true,
            message: 'Size restored successfully',
            data: size
        });
    } catch (error) {
        console.error('Restore size error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to restore size'
        });
    }
};

// @desc    Get all size groups
// @route   GET /api/sizes/groups
// @access  Public
export const getSizeGroups = async (req, res) => {
    try {
        const groups = await Size.getSizeGroups();

        res.status(200).json({
            success: true,
            data: groups
        });
    } catch (error) {
        console.error('Get size groups error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch size groups'
        });
    }
};

// @desc    Get sizes by size category (clothing_alpha, shoe_uk, etc.)
// @route   GET /api/sizes/category/:sizeCategory
// @access  Public
export const getSizesByCategory = async (req, res) => {
    try {
        const { sizeCategory } = req.params;
        const { sizeGroup, gender } = req.query;

        const sizes = await Size.findBySizeCategory(sizeCategory, { sizeGroup, gender });

        res.status(200).json({
            success: true,
            data: sizes
        });
    } catch (error) {
        console.error('Get sizes by category error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch sizes by category'
        });
    }
};

// @desc    Reorder sizes (drag & drop)
// @route   PUT /api/sizes/reorder
// @access  Admin
export const reorderSizes = async (req, res) => {
    try {
        const { reorderData } = req.body;

        if (!Array.isArray(reorderData) || reorderData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide reorder data array'
            });
        }

        // Bulk update display orders
        const bulkOps = reorderData.map(({ sizeId, newDisplayOrder }) => ({
            updateOne: {
                filter: { _id: sizeId },
                update: { displayOrder: newDisplayOrder, updatedBy: req.user?._id }
            }
        }));

        await Size.bulkWrite(bulkOps);

        res.status(200).json({
            success: true,
            message: 'Sizes reordered successfully'
        });
    } catch (error) {
        console.error('Reorder sizes error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reorder sizes'
        });
    }
};

// @desc    Convert size (UK ⇄ US ⇄ EU)
// @route   GET /api/sizes/convert
// @access  Public
export const convertSize = async (req, res) => {
    try {
        const { fromSize, fromSystem, toSystem } = req.query;

        if (!fromSize || !fromSystem || !toSystem) {
            return res.status(400).json({
                success: false,
                message: 'Please provide fromSize, fromSystem, and toSystem parameters'
            });
        }

        const convertedSize = await Size.convertSize(fromSize, fromSystem, toSystem);

        if (!convertedSize) {
            return res.status(404).json({
                success: false,
                message: 'Size conversion not available'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                from: fromSize,
                to: convertedSize,
                fromSystem,
                toSystem
            }
        });
    } catch (error) {
        console.error('Convert size error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to convert size'
        });
    }
};
