import AuditLog from '../models/Audit/AuditLog.model.js';
import mongoose from 'mongoose';
import logger from '../config/logger.js';

/**
 * auditMiddleware(action, entityType, getEntityId?, getEntityLabel?)
 *
 * Wraps a route handler and auto-captures before/after diff when the
 * mutation succeeds (2xx status).
 *
 * Usage:
 *   router.patch(
 *     '/:id',
 *     protect, authorize('admin', 'manager'),
 *     auditMiddleware('UPDATE', 'Product', req => req.params.id),
 *     updateProduct
 *   );
 */
export const auditMiddleware = (
    action,
    entityType,
    getEntityId = (req) => req.params?.id,
    getEntityLabel = (_req, _res) => undefined
) => {
    return async (req, res, next) => {
        // Capture before-state for UPDATE / DELETE
        let before;
        const entityId = getEntityId(req);

        if (['UPDATE', 'DELETE', 'SOFT_DELETE', 'STATUS_CHANGE', 'PUBLISH', 'UNPUBLISH'].includes(action) && entityId) {
            try {
                const Model = _getModelForEntity(entityType);
                if (Model) {
                    const doc = await Model.findById(entityId).lean();
                    before = doc ? _sanitise(doc) : undefined;
                }
            } catch { /* non-blocking */ }
        }

        // Intercept response to capture after-state
        const originalJson = res.json.bind(res);
        res.json = async function (body) {
            // Only audit successful mutations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    let after;
                    if (entityId) {
                        const Model = _getModelForEntity(entityType);
                        if (Model) {
                            const doc = await Model.findById(entityId).lean();
                            after = doc ? _sanitise(doc) : undefined;
                        }
                    }
                    // Fall back to response body data
                    if (!after && body?.data) after = _sanitise(body.data);

                    await AuditLog.create({
                        userId: req.user?._id,
                        userEmail: req.user?.email,
                        userRole: req.user?.role,
                        action,
                        entityType,
                        entityId: entityId || body?.data?._id,
                        entityLabel: getEntityLabel(req, body),
                        before,
                        after,
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'],
                        requestId: req.id
                    });
                } catch (auditErr) {
                    // Never block the response for audit failures
                    logger.error('[AUDIT] Failed to write audit log:', auditErr.message);
                }
            }
            return originalJson(body);
        };

        next();
    };
};

/**
 * Standalone helper — call directly inside a controller when you need
 * fine-grained control over what gets logged.
 *
 * await writeAudit(req, 'STOCK_ADJUST', 'InventoryMaster', id, before, after);
 */
export const writeAudit = async (req, action, entityType, entityId, before, after, entityLabel) => {
    try {
        await AuditLog.create({
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            action,
            entityType,
            entityId,
            entityLabel,
            before: _sanitise(before),
            after: _sanitise(after),
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent'],
            requestId: req.id
        });
    } catch (err) {
        logger.error('[AUDIT] writeAudit failed:', err.message);
    }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function _sanitise(obj) {
    if (!obj) return obj;
    // Remove sensitive fields before storing
    const clone = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };
    delete clone.passwordHash;
    delete clone.__v;
    return clone;
}

function _getModelForEntity(entityType) {
    const ENTITY_MAP = {
        Product: 'Product',
        Variant: 'VariantMaster',
        Category: 'Category',
        Brand: 'Brand',
        InventoryMaster: 'InventoryMaster',
        StockTransfer: 'StockTransfer',
        Order: 'Order',
        Promotion: 'PromotionMaster',
        User: 'User',
        Warehouse: 'Warehouse'
    };
    const modelName = ENTITY_MAP[entityType];
    if (!modelName) return null;
    // Use mongoose.models which is always synchronously available if the model
    // has been registered. No dynamic import needed — mongoose is imported at the top.
    return mongoose.models[modelName] || null;
}
