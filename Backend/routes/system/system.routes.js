import express from 'express';
import {
    getRoles,
    createRole,
    updateRolePermissions,
    deleteRole,
    getFeatureFlags,
    toggleFeatureFlag
} from '../../controllers/system/system.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';

const router = express.Router();

// All system endpoints require super_admin
router.use(protect, authorize('super_admin'));

// Roles & Permissions
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.patch('/roles/:id', updateRolePermissions);
router.delete('/roles/:id', deleteRole);

// Feature Flags
router.get('/features', getFeatureFlags);
router.patch('/features/:key', toggleFeatureFlag);

export default router;
