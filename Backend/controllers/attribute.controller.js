/**
 * AttributeController
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin controller layer — delegates all business logic to AttributeService.
 *
 * Responsibilities:
 *  • Parse / validate HTTP-layer inputs (query params, body).
 *  • Call service methods.
 *  • Translate service results / errors into HTTP responses.
 *
 * Error taxonomy (fed into the global errorHandler middleware):
 *  400  VALIDATION_ERROR  — missing / malformed categoryId
 *  404  NOT_FOUND         — category does not exist
 *  500  INTERNAL_ERROR    — unexpected failures
 *
 * @module AttributeController
 */

import {
    getAttributesByCategory,
    linkAttributeToCategory,
    unlinkAttributeFromCategory,
} from '../services/attribute.service.js';
import { asyncHandler } from '../middlewares/errorHandler.middleware.js';
import ApiError, { ValidationError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

// ── HELPERS ────────────────────────────────────────────────────────────────────

/**
 * Validates a query param as a non-empty, valid Mongoose ObjectId.
 * Throws ValidationError (400) so the global handler maps it to JSON.
 */
function requireObjectId(value, paramName) {
    if (!value || typeof value !== 'string' || !value.trim()) {
        throw new ValidationError(`Query parameter "${paramName}" is required`);
    }
    if (!mongoose.Types.ObjectId.isValid(value.trim())) {
        throw new ValidationError(
            `Query parameter "${paramName}" must be a valid ObjectId — received: "${value}"`
        );
    }
}

// ── HANDLERS ───────────────────────────────────────────────────────────────────

/**
 * GET /api/attributes?categoryId={id}
 *
 * Returns the full attribute tree for a specific product category.
 *
 * @swagger
 * /api/attributes:
 *   get:
 *     summary: Get all attributes for a category
 *     tags: [Attributes]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the product category
 *     responses:
 *       200:
 *         description: Attribute tree returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttributeTreeResponse'
 *       400:
 *         description: Missing or invalid categoryId
 *       404:
 *         description: Category not found
 */
export const getAttributes = asyncHandler(async (req, res) => {
    const { categoryId } = req.query;

    // HTTP-layer validation (service also validates, but we give early feedback)
    requireObjectId(categoryId, 'categoryId');

    const data = await getAttributesByCategory(categoryId);

    return res.status(200).json({
        success: true,
        data,
    });
});

/**
 * POST /api/attributes/link
 *
 * Admin: assigns an AttributeType to a Category (creates junction record).
 *
 * Body: { categoryId, attributeTypeId, isRequired?, displayOrder?, groupLabel? }
 */
export const linkAttribute = asyncHandler(async (req, res) => {
    const { categoryId, attributeTypeId, isRequired, displayOrder, groupLabel } =
        req.body;

    if (!categoryId) throw new ValidationError('"categoryId" is required');
    if (!attributeTypeId) throw new ValidationError('"attributeTypeId" is required');

    requireObjectId(categoryId, 'categoryId');
    requireObjectId(attributeTypeId, 'attributeTypeId');

    const link = await linkAttributeToCategory(categoryId, attributeTypeId, {
        isRequired: Boolean(isRequired),
        displayOrder: Number(displayOrder) || 0,
        groupLabel,
    });

    return res.status(201).json({
        success: true,
        message: 'Attribute successfully linked to category',
        data: link,
    });
});

/**
 * DELETE /api/attributes/unlink
 *
 * Admin: removes an AttributeType from a Category (soft delete on junction).
 *
 * Body: { categoryId, attributeTypeId }
 */
export const unlinkAttribute = asyncHandler(async (req, res) => {
    const { categoryId, attributeTypeId } = req.body;

    if (!categoryId) throw new ValidationError('"categoryId" is required');
    if (!attributeTypeId) throw new ValidationError('"attributeTypeId" is required');

    requireObjectId(categoryId, 'categoryId');
    requireObjectId(attributeTypeId, 'attributeTypeId');

    const result = await unlinkAttributeFromCategory(categoryId, attributeTypeId);

    return res.status(200).json({
        success: true,
        message: 'Attribute successfully unlinked from category',
        data: result,
    });
});
