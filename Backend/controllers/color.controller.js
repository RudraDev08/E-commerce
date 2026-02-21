import Color from '../models/masters/ColorMaster.enterprise.js';

/**
 * Expand 3-digit hex shorthand to 6-digit.
 * #FFF  →  #FFFFFF
 * #FFFFFF  →  #FFFFFF   (no-op)
 * Invalid  →  returned as-is (schema match will reject it cleanly)
 */
const expandHex = (raw = '') => {
    const hex = raw.trim().toUpperCase();
    if (/^#[0-9A-F]{3}$/.test(hex)) {
        const [, r, g, b] = hex.split('');
        return `#${r}${r}${g}${g}${b}${b}`;
    }
    return hex; // already 6-digit or invalid
};

// @desc    Create new color
// @route   POST /api/colors
// @access  Admin
export const createColor = async (req, res) => {
    try {
        const {
            name,
            displayName,
            code,
            hexCode,
            colorFamily,
            visualCategory,
            status,
            priority,
            description
        } = req.body;

        // 1. Basic presence check (Pre-validation)
        // Note: 'code' and 'colorFamily' can now be auto-generated/detected by the model
        const requiredFields = ['name', 'displayName', 'hexCode'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                errors: missingFields.reduce((acc, field) => ({ ...acc, [field]: 'This field is required' }), {})
            });
        }

        // 2. Normalize hex for the uniqueness check
        const normalizedHex = expandHex(hexCode);

        // 3. Collision Check (Pre-emptive)
        const existingColor = await Color.findOne({ hexCode: normalizedHex });

        if (existingColor) {
            return res.status(409).json({
                success: false,
                message: 'A color with this hex code already exists'
            });
        }

        // 4. Persistence
        const color = await Color.create({
            name,
            displayName,
            code: code ? code.toUpperCase() : undefined,
            hexCode: normalizedHex,
            colorFamily: colorFamily ? colorFamily.toUpperCase() : undefined,
            visualCategory: visualCategory || 'SOLID',
            priority: priority || 0,
            description,
            lifecycleState: 'DRAFT',
            createdBy: 'admin'
        });

        return res.status(201).json({
            success: true,
            message: 'Color created successfully',
            data: color
        });

    } catch (error) {
        console.error('CREATE_COLOR_ERROR:', error);

        // A. Handle Mongoose Validation Errors (HTTP 400)
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).reduce((acc, err) => ({
                ...acc,
                [err.path]: err.message
            }), {});

            return res.status(400).json({
                success: false,
                message: 'Validation Failed',
                errors
            });
        }

        // B. Handle Duplicate Key Errors (HTTP 409)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate record found: Data conflicts with an existing color.'
            });
        }

        // C. Fallback (HTTP 500)
        return res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message
        });
    }
};

// @desc    Get all colors
// @route   GET /api/colors
// @access  Public
export const getColors = async (req, res) => {
    try {
        const {
            search,
            page = 1,
            limit = 50,
            sort = 'priority'
        } = req.query;

        // Build query
        const query = {};

        // Support filtering by lifecycleState
        if (req.query.lifecycleState && req.query.lifecycleState !== 'all') {
            query.lifecycleState = req.query.lifecycleState;
        } else if (req.query.lifecycleState !== 'all') {
            // If explicit "all" is NOT sent, hide archives by default to keep the main view clean
            query.lifecycleState = { $ne: 'ARCHIVED' };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
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
        const color = await Color.findOne({ _id: req.params.id, lifecycleState: { $ne: 'ARCHIVED' } });

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
        const {
            name,
            displayName,
            code,
            hexCode,
            colorFamily,
            visualCategory,
            lifecycleState,
            priority,
            description
        } = req.body;

        // 1. Find the resource (ARCHIVED colors are editable — metadata only)
        const color = await Color.findById(req.params.id);

        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Color not found'
            });
        }

        // Block lifecycle changes on ARCHIVED via this endpoint — use POST /restore instead
        if (lifecycleState && color.lifecycleState === 'ARCHIVED' && lifecycleState !== 'ARCHIVED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change lifecycle of an ARCHIVED color via update. Use the restore endpoint.'
            });
        }

        // 2. Handle Hex Change & Duplicate Check
        if (hexCode) {
            const normalizedHex = expandHex(hexCode);
            if (normalizedHex !== color.hexCode) {
                const existingColor = await Color.findOne({
                    hexCode: normalizedHex,
                    _id: { $ne: req.params.id }
                });

                if (existingColor) {
                    return res.status(409).json({
                        success: false,
                        message: 'Another color with this hex code already exists'
                    });
                }
                color.hexCode = normalizedHex;
            }
        }

        // 3. Update fields (Governance and hooks will handle the rest)
        if (name) color.name = name;
        if (displayName) color.displayName = displayName;
        if (code) color.code = code.toUpperCase();
        if (colorFamily) color.colorFamily = colorFamily.toUpperCase();
        if (visualCategory) color.visualCategory = visualCategory;
        if (lifecycleState) color.lifecycleState = lifecycleState;
        if (priority !== undefined) color.priority = priority;
        if (description !== undefined) color.description = description;

        color.updatedBy = 'admin';

        // 4. Save and return (this triggers pre-save hooks)
        await color.save();

        res.status(200).json({
            success: true,
            message: 'Color updated successfully',
            data: color
        });
    } catch (error) {
        console.error('UPDATE_COLOR_ERROR:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update color'
        });
    }
};

// @desc    Delete or Archive color
// @route   DELETE /api/colors/:id
// @access  Admin
export const deleteColor = async (req, res) => {
    try {
        const color = await Color.findById(req.params.id);
        const { force } = req.query;

        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Color not found'
            });
        }

        if (force === 'true' || color.lifecycleState === 'ARCHIVED') {
            // Hard delete if already archived or if force flag is present
            await color.deleteOne();
            return res.status(200).json({
                success: true,
                message: 'Color permanently deleted'
            });
        }

        // Enterprise soft delete: Move to ARCHIVED state
        color.lifecycleState = 'ARCHIVED';
        color.updatedBy = 'admin';
        await color.save();

        res.status(200).json({
            success: true,
            message: 'Color archived successfully'
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
        const color = await Color.findOne({ _id: req.params.id, lifecycleState: { $ne: 'ARCHIVED' } });

        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Color not found'
            });
        }

        // State Machine Logic
        // ACTIVE -> DEPRECATED
        // DEPRECATED/DRAFT -> ACTIVE
        if (color.lifecycleState === 'ACTIVE') {
            color.lifecycleState = 'DEPRECATED';
            color.isActive = false;
        } else {
            color.lifecycleState = 'ACTIVE';
            color.isActive = true;
        }

        color.updatedBy = 'admin';
        await color.save();

        res.status(200).json({
            success: true,
            message: `Color is now ${color.lifecycleState}`,
            data: color
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(400).json({
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
        const color = await Color.findOne({ _id: req.params.id, lifecycleState: 'ARCHIVED' });

        if (!color) {
            return res.status(404).json({
                success: false,
                message: 'Deleted color not found'
            });
        }

        // Enterprise Restore: Move back to DRAFT state
        color.lifecycleState = 'DRAFT';
        color.isActive = true;
        color.updatedBy = 'admin';
        await color.save();

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
