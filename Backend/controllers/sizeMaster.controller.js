import SizeMaster from '../models/masters/SizeMaster.enterprise.js';
import mongoose from 'mongoose';

// ============================================================================
// ENTERPRISE SIZE MASTER CONTROLLER
// Feature Set: Cursor Pagination, Text Search, Optimistic Locking, Audit Log
// ============================================================================

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */
const safeUpper = (val) => (typeof val === 'string' ? val.toUpperCase() : null);

/**
 * Compute a field-level diff between old and new values.
 * Returns only the keys that actually changed.
 */
const diffFields = (oldDoc, newValues) => {
    const changes = {};
    for (const [key, next] of Object.entries(newValues)) {
        const prev = oldDoc[key];
        // Shallow compare — deep objects (measurements, conversions) are captured as-is
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
            changes[key] = { from: prev, to: next };
        }
    }
    return changes;
};

/* ─────────────────────────────────────────────────────────────────────────────
   CURSOR PAGINATION CONSTANTS
   ───────────────────────────────────────────────────────────────────────────── */
// Allowlisted sort fields — prevents injection via sort param
const VALID_SORT_FIELDS = ['normalizedRank', 'displayName', 'createdAt', 'value'];

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
            lifecycleState,
            status,       // alias for lifecycleState for backward compat
            isLocked,
            search,
            cursor,
            limit: rawLimit,
            sort = 'normalizedRank'
        } = req.query;

        // 1. Sanitization & Defaults
        const limit = Math.min(Math.max(parseInt(rawLimit) || 20, 1), 100);

        // 2. Query Construction
        const query = {};
        if (category) query.category = safeUpper(category);
        if (gender) query.gender = safeUpper(gender);
        if (region) query.primaryRegion = safeUpper(region);
        // Accept both ?lifecycleState= and legacy ?status=
        const lc = lifecycleState || status;
        if (lc) query.lifecycleState = safeUpper(lc);
        if (isLocked !== undefined && isLocked !== '') {
            query.isLocked = isLocked === 'true' || isLocked === true;
        }

        // 3. Text Search (MongoDB Atlas / standard text index)
        if (search && typeof search === 'string' && search.trim().length > 0) {
            query.$text = { $search: search.trim() };
        }

        // 4. Sort Configuration — allowlisted only
        const sortField = VALID_SORT_FIELDS.includes(sort) ? sort : 'normalizedRank';
        // Dates DESC, everything else ASC
        const sortDir = (sortField === 'createdAt' || sortField === 'updatedAt') ? -1 : 1;

        // 5. Cursor Pagination — directional with _id tie-breaker for stability
        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
                if (decoded.val === undefined || !decoded.id) throw new Error('Malformed cursor payload');

                const op = sortDir === 1 ? '$gt' : '$lt';
                query.$or = [
                    { [sortField]: { [op]: decoded.val } },
                    // Tie-breaker: same sortField value, but different _id
                    { [sortField]: decoded.val, _id: { [op]: new mongoose.Types.ObjectId(decoded.id) } }
                ];
            } catch {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid pagination cursor. Please refresh the page.'
                });
            }
        }

        // 6. Execute — lean() for read performance
        const docs = await SizeMaster.find(query)
            .sort({ [sortField]: sortDir, _id: sortDir }) // stable sort
            .limit(limit + 1)                             // +1 to detect next page
            .lean();

        // 7. Pagination Meta
        const hasNextPage = docs.length > limit;
        const data = hasNextPage ? docs.slice(0, limit) : docs;

        let nextCursor = null;
        if (hasNextPage && data.length > 0) {
            const last = data[data.length - 1];
            nextCursor = Buffer.from(JSON.stringify({
                val: last[sortField],
                id: last._id.toString()
            })).toString('base64');
        }

        return res.status(200).json({
            success: true,
            data,
            pageInfo: { hasNextPage, nextCursor, limit, count: data.length }
        });

    } catch (error) {
        console.error('[getSizes] error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch sizes' });
    }
};

/**
 * @desc    Get single size by ID
 * @route   GET /api/sizes/:id
 */
export const getSize = async (req, res) => {
    try {
        const size = await SizeMaster.findById(req.params.id).lean();
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });
        return res.status(200).json({ success: true, data: size });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create size
 * @route   POST /api/sizes
 */
export const createSize = async (req, res) => {
    try {
        const {
            value, displayName, category, gender, primaryRegion,
            normalizedRank, lifecycleState, measurements, conversions
        } = req.body;

        const size = new SizeMaster({
            value, displayName, category, gender, primaryRegion,
            normalizedRank, lifecycleState, measurements, conversions,
            createdBy: req.user?._id
        });

        // Audit: CREATED
        size.auditLog.push({
            action: 'CREATED',
            by: req.user?._id,
            at: new Date()
        });

        await size.save();

        return res.status(201).json({
            success: true,
            message: 'Size created successfully',
            data: size
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate size definition detected. A size with that category/gender/region/value combination already exists.',
                error: 'DUPLICATE_ENTRY'
            });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update size (field-level allowlist + audit diff)
 * @route   PUT /api/sizes/:id
 * @access  Admin
 */
export const updateSize = async (req, res) => {
    try {
        const size = await SizeMaster.findById(req.params.id);
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });

        // Fix #7: lifecycleState removed — must use PATCH /toggle-status to enforce state machine
        const allowedUpdates = [
            'value', 'displayName', 'category', 'gender', 'primaryRegion',
            'normalizedRank', 'measurements', 'conversions'
        ];
        const upperFields = new Set(['category', 'gender', 'primaryRegion', 'lifecycleState', 'value']);

        // Capture pre-update snapshot for diff
        const before = {};
        allowedUpdates.forEach(f => { before[f] = size[f]; });

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                size[field] = upperFields.has(field)
                    ? req.body[field].toString().toUpperCase()
                    : req.body[field];
            }
        });

        size.updatedBy = req.user?._id;

        // Compute diff — only log fields that actually changed
        const changes = diffFields(before, allowedUpdates.reduce((acc, f) => {
            acc[f] = size[f]; return acc;
        }, {}));

        if (Object.keys(changes).length > 0) {
            size.auditLog.push({
                action: 'UPDATED',
                by: req.user?._id,
                at: new Date(),
                changes
            });
        }

        await size.save();

        return res.status(200).json({
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
        if (error.message?.includes('locked')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        console.error('[updateSize] error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Hard delete — only ARCHIVED or DRAFT sizes with zero usage
 * @route   DELETE /api/sizes/:id
 */
export const deleteSize = async (req, res) => {
    try {
        const size = await SizeMaster.findById(req.params.id);
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });

        // ── Hard delete rules (controller layer + middleware double-enforced) ──
        if (size.usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete size — ${size.usageCount} active variant(s) reference it. Deprecate or archive it first.`
            });
        }
        if (!['ARCHIVED', 'DRAFT'].includes(size.lifecycleState)) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete a size in "${size.lifecycleState}" state. Only ARCHIVED or DRAFT sizes can be permanently deleted.`
            });
        }

        // Fix #4 — Write deletion audit record BEFORE destroying the document
        // Stored separately so it survives after the document is gone.
        // Uses a lightweight in-memory log; replace with AuditArchive model if needed.
        const deletionRecord = {
            action: 'HARD_DELETED',
            entity: 'SizeMaster',
            entityId: size._id.toString(),
            canonicalId: size.canonicalId,
            snapshot: {
                value: size.value,
                displayName: size.displayName,
                category: size.category,
                lifecycleState: size.lifecycleState,
                usageCount: size.usageCount,
            },
            by: req.user?._id ?? 'system',
            at: new Date().toISOString(),
        };
        console.info('[AUDIT] Hard delete:', JSON.stringify(deletionRecord));
        // TODO: persist deletionRecord to AuditArchive collection when available

        await size.deleteOne(); // triggers pre('deleteOne') middleware for double-safety

        return res.status(200).json({
            success: true,
            message: 'Size permanently deleted',
            canonicalId: deletionRecord.canonicalId
        });

    } catch (error) {
        console.error('[deleteSize] error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Lifecycle transition — accepts explicit targetState (no auto-advance)
 * @route   PATCH /api/sizes/:id/toggle-status
 * @body    { targetState: 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED' | 'DRAFT' }
 */
export const toggleStatus = async (req, res) => {
    try {
        const { targetState } = req.body;

        if (!targetState) {
            return res.status(400).json({
                success: false,
                message: 'targetState is required in request body (e.g. { "targetState": "ACTIVE" })'
            });
        }

        const size = await SizeMaster.findById(req.params.id);
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });

        // Fix #5 — Return clean 403 instead of letting model throw a 500
        if (size.isLocked) {
            return res.status(403).json({
                success: false,
                message: 'Cannot change the lifecycle state of a locked size. Unlock it first.'
            });
        }

        const current = size.lifecycleState;
        const target = targetState.toString().toUpperCase();

        // Validate via centralized model static — single source of truth
        if (!SizeMaster.validateTransition(current, target)) {
            return res.status(400).json({
                success: false,
                message: `Invalid lifecycle transition: "${current}" → "${target}". Allowed from ${current}: [${(SizeMaster.VALID_TRANSITIONS?.[current] || []).join(', ') || 'none'}]`
            });
        }

        size.lifecycleState = target;
        size.updatedBy = req.user?._id;

        // Audit
        size.auditLog.push({
            action: 'LIFECYCLE_CHANGED',
            by: req.user?._id,
            at: new Date(),
            changes: { lifecycleState: { from: current, to: target } }
        });

        await size.save();

        return res.status(200).json({
            success: true,
            message: `Lifecycle transition: ${current} → ${target}`,
            data: size
        });

    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({
                success: false,
                message: 'Conflict: Lifecycle state was changed by another user. Please refresh.'
            });
        }
        console.error('[toggleStatus] error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Toggle isLocked flag with audit
 * @route   PATCH /api/sizes/:id/lock
 */
export const toggleLock = async (req, res) => {
    try {
        const size = await SizeMaster.findById(req.params.id);
        if (!size) return res.status(404).json({ success: false, message: 'Size not found' });

        const wasLocked = size.isLocked;
        size.isLocked = !wasLocked;
        size.updatedBy = req.user?._id;

        // Audit
        size.auditLog.push({
            action: wasLocked ? 'UNLOCKED' : 'LOCKED',
            by: req.user?._id,
            at: new Date()
        });

        await size.save();

        return res.status(200).json({
            success: true,
            message: `Size ${size.isLocked ? 'locked' : 'unlocked'} successfully`,
            data: size
        });
    } catch (error) {
        // Fix #6 — Concurrent lock toggle returns 409 not 500
        if (error.name === 'VersionError') {
            return res.status(409).json({
                success: false,
                message: 'Conflict: Lock state was changed by another process. Please refresh and try again.'
            });
        }
        console.error('[toggleLock] error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Bulk Create (insertMany — partial success, unordered)
 * @route   POST /api/sizes/bulk
 */
export const bulkCreateSizes = async (req, res) => {
    // Fix #1 — insertMany bypasses pre('validate') middleware, so we must:
    //   a) pre-generate canonicalIds atomically
    //   b) set isActive from lifecycleState manually
    //   c) ensure auditLog is seeded
    try {
        const { sizes } = req.body;
        if (!Array.isArray(sizes) || !sizes.length) {
            return res.status(400).json({ success: false, message: 'sizes array is required and must not be empty' });
        }

        // Pre-generate one canonicalId per entry using the atomic counter
        const docs = await Promise.all(sizes.map(async s => {
            const canonicalId = await SizeMaster.generateCanonicalId();
            const lifecycleState = s.lifecycleState?.toString().toUpperCase() || 'DRAFT';
            return {
                ...s,
                canonicalId,
                value: s.value?.toString().toUpperCase(),
                category: s.category?.toString().toUpperCase(),
                gender: s.gender?.toString().toUpperCase(),
                primaryRegion: s.primaryRegion?.toString().toUpperCase(),
                lifecycleState,
                // Sync isActive — mirrors pre('validate') logic
                isActive: lifecycleState === 'ACTIVE',
                createdBy: req.user?._id,
                auditLog: [{ action: 'CREATED', by: req.user?._id, at: new Date() }]
            };
        }));

        const result = await SizeMaster.insertMany(docs, { ordered: false });

        return res.status(201).json({
            success: true,
            message: `${result.length} of ${docs.length} sizes created`,
            data: result
        });

    } catch (error) {
        // ordered: false → partial success may have occurred
        if (error.name === 'BulkWriteError') {
            const inserted = error.result?.nInserted ?? 0;
            return res.status(207).json({
                success: false,
                message: `Partial bulk insert: ${inserted} created, ${sizes?.length - inserted} failed (likely duplicates)`,
                error: 'PARTIAL_BULK_FAILURE'
            });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
