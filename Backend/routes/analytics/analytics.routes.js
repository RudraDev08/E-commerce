/**
 * analytics.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/analytics/summary
 *
 * Requires admin or manager role.
 * Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import express from 'express';
import { getAnalyticsSummary, getAdminActivityAnalytics } from '../../controllers/analytics.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { adminOrManager } from '../../middlewares/authorize.middleware.js';

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', protect, adminOrManager, getAnalyticsSummary);
// GET /api/analytics/admin-activity
router.get('/admin-activity', protect, adminOrManager, getAdminActivityAnalytics);

export default router;
