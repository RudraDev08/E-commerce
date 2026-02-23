/**
 * Attribute Routes
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Public / Customer-facing:
 *   GET  /api/attributes?categoryId={id}   — hierarchical attribute tree
 *
 * Admin:
 *   POST   /api/attributes/link            — link attribute to category
 *   DELETE /api/attributes/unlink          — unlink attribute from category
 *
 * Registered in app.js as:
 *   app.use('/api/attributes', attributeRoutes);
 *   app.use('/api/v1/attributes', attributeRoutes);
 */

import express from 'express';
import {
    getAttributes,
    linkAttribute,
    unlinkAttribute,
} from '../../controllers/attribute.controller.js';

const router = express.Router();

// ── PUBLIC ─────────────────────────────────────────────────────────────────────
/**
 * GET /api/attributes?categoryId={mongoId}
 * Returns the full attribute tree for a product category.
 */
router.get('/', getAttributes);

// ── ADMIN ──────────────────────────────────────────────────────────────────────
// Note: add your auth / admin middleware before these in production.
// e.g.  router.post('/link', requireAdmin, linkAttribute);

router.post('/link', linkAttribute);
router.delete('/unlink', unlinkAttribute);

export default router;
