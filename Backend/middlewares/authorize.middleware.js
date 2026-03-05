/**
 * authorize(...roles) — RBAC middleware
 *
 * Usage:
 *   router.patch('/products/bulk-edit', protect, authorize('admin', 'manager'), handler);
 *
 * Must be used AFTER the `protect` middleware so req.user is populated.
 */
export const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated.',
        });
    }

    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Role '${req.user.role}' is not authorized to perform this action. Required: ${roles.join(' | ')}.`,
        });
    }

    next();
};

/**
 * requirePermission(...permissions) — Permission-based middleware
 *
 * Enterprise feature: allows fine-grained access beyond role checks.
 * The user must have ALL listed permissions (their role defaults + user overrides).
 *
 * Usage:
 *   router.post('/orders/:id/refund', protect, requirePermission('order.refund'), handler);
 */
import { ROLE_PERMISSIONS } from '../models/UserSchema.js';
import RolePermissions from '../models/system/RolePermissions.model.js';
import redisClient from '../config/redisClient.js';

// Helper to get role permissions, using Redis cache
const getRolePermissions = async (role) => {
    if (redisClient) {
        const cached = await redisClient.get(`role_permissions:${role}`);
        if (cached) return JSON.parse(cached);
    }

    // fallback to DB if Redis is down or cache miss
    let rolePerms = await RolePermissions.findOne({ roleName: role, isActive: true }).lean();
    let perms = rolePerms ? rolePerms.permissions : (ROLE_PERMISSIONS[role] || []);

    if (redisClient) {
        // Cache for 15 mins
        await redisClient.setex(`role_permissions:${role}`, 900, JSON.stringify(perms));
    }

    return perms;
};

export const requirePermission = (...permissions) => async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    // Resolve effective permissions: role defaults + user-level overrides
    const roleDefaults = await getRolePermissions(req.user.role);
    // req.user._permissions is populated by protect middleware during DB fetch
    const userOverrides = req.user._permissions || [];
    const effective = new Set([...roleDefaults, ...userOverrides]);

    const missing = permissions.filter(p => !effective.has(p));
    if (missing.length > 0) {
        return res.status(403).json({
            success: false,
            message: `Missing required permissions: ${missing.join(', ')}.`,
        });
    }

    next();
};

/**
 * Convenience wrappers for the most common role groups.
 */
export const adminOnly = authorize('admin', 'super_admin');
export const adminOrManager = authorize('admin', 'super_admin', 'manager');
export const staffOrAbove = authorize('admin', 'super_admin', 'manager', 'staff');

