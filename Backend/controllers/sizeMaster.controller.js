import SizeMaster from '../models/masters/SizeMaster.enterprise.js';
import mongoose from 'mongoose';

// ============================================================================
// ENTERPRISE SIZE MASTER CONTROLLER
// Feature Set: Cursor Pagination, Text Search, Optimistic Locking
// ============================================================================

/**
 * @desc    Get all sizes with enterprise cursor pagination
 * @route   GET /api/sizes
 * @access  Public
 */
export const getSizes = async (req, res) => {
    try {
        const {
            category,
            gender,
            region,
            status,
            search,
            cursor,
            limit: rawLimit,
            sort = 'normalizedRank'
        } = req.query;

        // 1. Sanitization & Defaults
        const limit = Math.min(Math.max(parseInt(rawLimit) || 20, 1), 100); // Clamp 1-100
        const safeUpper = (val) => (typeof val === 'string' ? val.toUpperCase() : null);

        // 2. Query Construction
        const query = {};
        if (category) query.category = safeUpper(category);
        if (gender) query.gender = safeUpper(gender);
        if (region) query.primaryRegion = safeUpper(region);
        if (status) query.lifecycleState = safeUpper(status);

        // 3. Text Search (Scalable)
        if (search && typeof search === 'string' && search.trim().length > 0) {
            query.$text = { $search: search };
        }

        // 4. Sort Configuration
        const validSortFields = ['normalizedRank', 'displayName', 'createdAt', 'updatedAt', 'value'];
        const sortField = validSortFields.includes(sort) ? sort : 'normalizedRank';
        // For text search to be relevant, we might want to sort by score, but usually users want deterministic sort.
        // If searching, we usually prioritize score, but here strict sorting is requested.

        const sortDir = (sortField === 'createdAt' || sortField === 'updatedAt') ? -1 : 1;
        // Logic: Dates usually DESC, Rank usually ASC.
        // Can be overridden by query param if needed, but enforcing defaults for consistency.

        // 5. Cursor Pagination Logic (Directional)
        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
                if (decoded.val === undefined || !decoded.id) throw new Error('Invalid cursor');

                // Directional Operator Selection
                const op = sortDir === 1 ? '$gt' : '$lt';

                query.$or = [
                    { [sortField]: { [op]: decoded.val } },
                    {
                        [sortField]: decoded.val,
                        _id: { [op]: decoded.id }
                    }
                ];
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid pagination cursor. Please refresh the page.'
                });
            }
        }

        // 6. Execute Query
        // Use leand() for performance.
        const docs = await SizeMaster.find(query)
            .sort({ [sortField]: sortDir, _id: sortDir }) // Stable Sort
            .limit(limit + 1) // Fetch one extra to check hasNextPage
            .lean();

        // 7. Pagination Meta
        const hasNextPage = docs.length > limit;
        const data = hasNextPage ? docs.slice(0, limit) : docs;

        let nextCursor = null;
        if (hasNextPage && data.length > 0) {
            const lastDoc = data[data.length - 1];
            nextCursor = Buffer.from(JSON.stringify({
                val: lastDoc[sortField],
                id: lastDoc._id
            })).toString('base64');
        }

        res.status(200).json({
            success: true,
            data,
            pageInfo: {
                hasNextPage,
                nextCursor,
                limit
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

/**
 * @desc    Get single size
 * @route   GET /api/sizes/:id
 */
export const getSize = async (req, res) => {
    try {
        const size = await SizeMaster.findById(req.params.id).lean();
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });
        res.status(200).json({ success: true, data: size });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create size
 * @route   POST /api/sizes
 */
export const createSize = async (req, res) => {
    try {
        // Strict Input Allowlisting
        const {
            value, displayName, category, gender, primaryRegion,
            normalizedRank, lifecycleState, measurements, conversions
        } = req.body;

        const size = new SizeMaster({
            value, displayName, category, gender, primaryRegion,
            normalizedRank, lifecycleState, measurements, conversions,
            createdBy: req.user?._id
        });

        await size.save();

        res.status(201).json({
            success: true,
            message: 'Size created successfully',
            data: size
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate size definition detected.',
                error: 'DUPLICATE_ENTRY'
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update size
 * @route   PUT /api/sizes/:id
 * @access  Admin
 */
export const updateSize = async (req, res) => {
    try {
        // 1. Fetch document (Not lean, we need save() for middleware)
        const size = await SizeMaster.findById(req.params.id);
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });

        // 2. Apply updates
        const allowedUpdates = [
            'value', 'displayName', 'category', 'gender', 'primaryRegion',
            'normalizedRank', 'lifecycleState', 'measurements', 'conversions'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                // Formatting handled by setters/middleware if strictly typed
                // Helper to ensure upper case for enums
                if (['category', 'gender', 'primaryRegion', 'lifecycleState', 'value'].includes(field)) {
                    size[field] = req.body[field].toUpperCase();
                } else {
                    size[field] = req.body[field];
                }
            }
        });

        size.updatedBy = req.user?._id;

        // 3. Save with Optimistic Concurrency
        await size.save();

        res.status(200).json({
            success: true,
            message: 'Size updated successfully',
            data: size
        });

    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({
                success: false,
                message: 'Conflict: This record was modified by another user. Please refresh and try again.'
            });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Duplicate entry detected.' });
        }
        if (error.message.includes('locked')) {
            return res.status(403).json({ success: false, message: error.message });
        }

        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete size
 * @route   DELETE /api/sizes/:id
 */
export const deleteSize = async (req, res) => {
    try {
        const size = await SizeMaster.findById(req.params.id);
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });

        // Check Logic is now in Pre-Delete Middleware for safety
        // But we can fail fast here too
        if (size.usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete active size with ${size.usageCount} references.`
            });
        }

        await size.deleteOne(); // Triggers middleware

        res.status(200).json({
            success: true,
            message: 'Size deleted successfully'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Toggle lock
 * @route   PATCH /api/sizes/:id/lock
 */
export const toggleLock = async (req, res) => {
    try {
        const size = await SizeMaster.findById(req.params.id);
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });

        size.isLocked = !size.isLocked;
        size.updatedBy = req.user?._id;
        await size.save();

        res.status(200).json({
            success: true,
            message: `Size ${size.isLocked ? 'locked' : 'unlocked'}`,
            data: size
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Toggle Status
 * @route   PATCH /api/sizes/:id/toggle-status
 */
export const toggleStatus = async (req, res) => {
    try {
        const size = await SizeMaster.findById(req.params.id);
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });

        // State Machine Logic
        const transitionMap = {
            'DRAFT': 'ACTIVE',
            'ACTIVE': 'DEPRECATED',
            'DEPRECATED': 'ACTIVE',
            'ARCHIVED': 'DEPRECATED'
        };

        const newState = transitionMap[size.lifecycleState];
        if (!newState) {
            return res.status(400).json({
                success: false,
                message: `Cannot toggle from state ${size.lifecycleState}`
            });
        }

        size.lifecycleState = newState;
        size.updatedBy = req.user?._id;
        await size.save();

        res.status(200).json({
            success: true,
            message: `Size moved to ${newState}`,
            data: size
        });

    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({
                success: false,
                message: 'Conflict: State changed by another user.'
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Bulk Create
 * @route   POST /api/sizes/bulk
 */
export const bulkCreateSizes = async (req, res) => {
    try {
        const { sizes } = req.body;
        if (!Array.isArray(sizes) || !sizes.length) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        // Sanitized Map
        const docs = sizes.map(s => ({
            ...s,
            value: s.value?.toUpperCase(),
            category: s.category?.toUpperCase(),
            gender: s.gender?.toUpperCase(),
            primaryRegion: s.primaryRegion?.toUpperCase(),
            lifecycleState: s.lifecycleState?.toUpperCase() || 'DRAFT',
            createdBy: req.user?._id
        }));

        const result = await SizeMaster.insertMany(docs, { ordered: false });

        res.status(201).json({
            success: true,
            message: `${result.length} sizes created`,
            data: result
        });

    } catch (error) {
        // Partial success handling could be added here
        res.status(500).json({ success: false, message: error.message });
    }
};
