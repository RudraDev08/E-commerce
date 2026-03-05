import RolePermissions from '../../models/system/RolePermissions.model.js';
import FeatureFlags from '../../models/system/FeatureFlags.model.js';
import redisClient from '../../config/redisClient.js';
import logger from '../../config/logger.js';

// ── Role Permissions ────────────────────────────────────────────────────────

export const getRoles = async (req, res) => {
    try {
        const roles = await RolePermissions.find().sort({ roleName: 1 });
        return res.json({ success: true, data: roles });
    } catch (error) {
        logger.error('[System] getRoles error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createRole = async (req, res) => {
    try {
        const { roleName, permissions, description } = req.body;

        if (!roleName) {
            return res.status(400).json({ success: false, message: 'Role name is required.' });
        }

        const role = await RolePermissions.create({
            roleName: roleName.toLowerCase(),
            permissions: permissions || [],
            description
        });

        return res.status(201).json({ success: true, data: role });
    } catch (error) {
        logger.error('[System] createRole error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Role already exists.' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions, isActive, description } = req.body;

        const role = await RolePermissions.findById(id);
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found.' });
        }

        if (permissions) role.permissions = permissions;
        if (typeof isActive === 'boolean' && !role.isSystemRole) role.isActive = isActive;
        if (description !== undefined) role.description = description;

        await role.save();

        if (redisClient) {
            await redisClient.del(`role_permissions:${role.roleName}`);
        }

        return res.json({ success: true, data: role });
    } catch (error) {
        logger.error('[System] updateRolePermissions error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await RolePermissions.findById(id);

        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found.' });
        }

        if (role.isSystemRole) {
            return res.status(403).json({ success: false, message: 'System roles cannot be deleted.' });
        }

        await RolePermissions.findByIdAndDelete(id);

        if (redisClient) {
            await redisClient.del(`role_permissions:${role.roleName}`);
        }

        return res.json({ success: true, message: 'Role deleted.' });
    } catch (error) {
        logger.error('[System] deleteRole error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ── Feature Flags ────────────────────────────────────────────────────────────

export const getFeatureFlags = async (req, res) => {
    try {
        const flags = await FeatureFlags.find().sort({ key: 1 });
        return res.json({ success: true, data: flags });
    } catch (error) {
        logger.error('[System] getFeatureFlags error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleFeatureFlag = async (req, res) => {
    try {
        const { key } = req.params;
        const { enabled, description } = req.body;

        let flag = await FeatureFlags.findOne({ key });

        if (!flag) {
            flag = await FeatureFlags.create({ key, enabled, description });
        } else {
            if (typeof enabled === 'boolean') flag.enabled = enabled;
            if (description !== undefined) flag.description = description;
            await flag.save();
        }

        return res.json({ success: true, data: flag });
    } catch (error) {
        logger.error('[System] toggleFeatureFlag error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
