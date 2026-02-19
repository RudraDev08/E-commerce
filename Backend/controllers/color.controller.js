import Color from '../models/masters/ColorMaster.enterprise.js';

// @desc    Create new color
// @route   POST /api/colors
// @access  Admin
export const createColor = async (req, res) => {
    try {
        const { name, hexCode, status, priority, description } = req.body;

        // Check if hex code already exists
        const existingColor = await Color.findOne({ hexCode: hexCode.toUpperCase() });
        if (existingColor) {
            if (existingColor.isDeleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Color with this hex code exists but is deleted. Please restore it.'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Color with this hex code already exists'
            });
        }

        if (!hexCode) {
            return res.status(400).json({ success: false, message: 'Hex code is required' });
        }

        // Generate slug
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Format hex code
        let formattedHex = hexCode.toUpperCase();
        if (!formattedHex.startsWith('#')) {
            formattedHex = '#' + formattedHex;
        }

        // Create color
        const color = await Color.create({
            name,
            slug,
            hexCode: formattedHex,
            status: status || 'active',
            priority: priority || 0,
            description,
            createdBy: 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'Color created successfully',
            data: color
        });
    } catch (error) {
        console.error('Create color error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Color with this name, slug, or hex code already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create color'
        });
    }
};

// @desc    Get all colors
// @route   GET /api/colors
// @access  Public
export const getColors = async (req, res) => {
    try {
        const {
            status,
            category,
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

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hexCode: { $regex: search, $options: 'i' } }
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
                sortOption = { priority: 1, name: 1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            default:
                sortOption = { priority: 1, name: 1 };
        }

        // Execute query
        const colors = await Color.find(query)
            .populate('applicableCategories', 'name slug')
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip);

        // Get total count
        const total = await Color.countDocuments(query);

        res.status(200).json({
            success: true,
            data: colors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get colors error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch colors'
        });
    }
};

// @desc    Get single color
// @route   GET /api/colors/:id
// @access  Public
export const getColor = async (req, res) => {
    try {
        const color = await Color.findOne({ _id: req.params.id, isDeleted: false })
            .populate('applicableCategories', 'name slug')
            .populate('productCount');

        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Color not found'
            });
        }

        res.status(200).json({
            success: true,
            data: color
        });
    } catch (error) {
        console.error('Get color error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch color'
        });
    }
};

// @desc    Update color
// @route   PUT /api/colors/:id
// @access  Admin
export const updateColor = async (req, res) => {
    try {
        const { name, hexCode, status, priority, description } = req.body;

        // Find color
        const color = await Color.findOne({ _id: req.params.id, isDeleted: false });
        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Color not found'
            });
        }

        // Check if hex code is being changed and if new code exists
        if (hexCode && hexCode.toUpperCase() !== color.hexCode) {
            const existingColor = await Color.findOne({
                hexCode: hexCode.toUpperCase(),
                _id: { $ne: req.params.id },
                isDeleted: false
            });

            if (existingColor) {
                return res.status(400).json({
                    success: false,
                    message: 'Color with this hex code already exists'
                });
            }
        }

        // Update fields
        if (name) color.name = name;
        if (hexCode) color.hexCode = hexCode.toUpperCase();
        if (status) color.status = status;
        if (priority !== undefined) color.priority = priority;
        if (description !== undefined) color.description = description;
        color.updatedBy = 'admin';

        await color.save();

        res.status(200).json({
            success: true,
            message: 'Color updated successfully',
            data: color
        });
    } catch (error) {
        console.error('Update color error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update color'
        });
    }
};

// @desc    Delete color (soft delete)
// @route   DELETE /api/colors/:id
// @access  Admin
export const deleteColor = async (req, res) => {
    try {
        const color = await Color.findOne({ _id: req.params.id, isDeleted: false });

        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Color not found'
            });
        }

        // Soft delete
        await color.softDelete('admin');

        res.status(200).json({
            success: true,
            message: 'Color deleted successfully'
        });
    } catch (error) {
        console.error('Delete color error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete color'
        });
    }
};

// @desc    Toggle color status
// @route   PATCH /api/colors/:id/toggle-status
// @access  Admin
export const toggleStatus = async (req, res) => {
    try {
        const color = await Color.findOne({ _id: req.params.id, isDeleted: false });

        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Color not found'
            });
        }

        // Toggle status
        color.status = color.status === 'active' ? 'inactive' : 'active';
        color.updatedBy = 'admin';
        await color.save();

        res.status(200).json({
            success: true,
            message: `Color ${color.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: color
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to toggle status'
        });
    }
};

// @desc    Bulk create colors
// @route   POST /api/colors/bulk
// @access  Admin
export const bulkCreateColors = async (req, res) => {
    try {
        const { colors } = req.body;

        if (!Array.isArray(colors) || colors.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of colors'
            });
        }

        // Validate and prepare colors
        const preparedColors = colors.map(color => ({
            ...color,
            hexCode: color.hexCode.toUpperCase(),
            createdBy: 'admin'
        }));

        // Insert colors
        const createdColors = await Color.insertMany(preparedColors, { ordered: false });

        res.status(201).json({
            success: true,
            message: `${createdColors.length} colors created successfully`,
            data: createdColors
        });
    } catch (error) {
        console.error('Bulk create colors error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create colors'
        });
    }
};

// @desc    Restore deleted color
// @route   PATCH /api/colors/:id/restore
// @access  Admin
export const restoreColor = async (req, res) => {
    try {
        const color = await Color.findOne({ _id: req.params.id, isDeleted: true });

        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Deleted color not found'
            });
        }

        await color.restore();

        res.status(200).json({
            success: true,
            message: 'Color restored successfully',
            data: color
        });
    } catch (error) {
        console.error('Restore color error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to restore color'
        });
    }
};
