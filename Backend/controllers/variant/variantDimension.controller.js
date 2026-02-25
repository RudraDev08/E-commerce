/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIANT DIMENSION CONTROLLER  ·  v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * HTTP layer for the N-dimensional variant generation engine.
 *
 * Routes:
 *   POST /api/variants/v2/preview-dimensions  → previewDimensions
 *   POST /api/variants/v2/generate-dimensions → generateDimensions
 *   POST /api/variants/v2/diff-dimensions     → diffDimensions
 *
 * All routes are thin:
 *   • Input validation (fast fail before any DB call)
 *   • Delegate to variantDimension.service (all DB logic)
 *   • Map service errors to HTTP codes
 */

import { asyncHandler } from '../../middlewares/errorHandler.middleware.js';
import { generateVariantDimensions, previewVariantDimensions } from '../../services/variantDimension.service.js';
import { fromApiInput, diffDimensions, normalizeDimension, countCombinations } from '../../services/cartesianEngine.js';
import { ValidationError } from '../../utils/ApiError.js';
import { validateLimits, validateCardinality } from '../../utils/variantIdentity.js';
import GenerationAudit from '../../models/GenerationAudit.model.js';
import logger from '../../config/logger.js';
import { variantGenerationQueue } from '../../src/queues/variantQueue.js';

// ─────────────────────────────────────────────────────────────────────────────
// INPUT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validateDimensionBody(body) {
    const { productGroupId, baseDimensions, attributeDimensions } = body;

    if (!productGroupId) {
        throw new ValidationError('"productGroupId" is required');
    }

    // SECTION 9: Enforce system limits before any DB call
    try { validateLimits(body); } catch (e) { throw new ValidationError(e.message); }

    // Must have at least one dimension with at least one value
    const hasColors = Array.isArray(baseDimensions?.color) && baseDimensions.color.length > 0;
    const hasSizes = Array.isArray(baseDimensions?.size) && baseDimensions.size.length > 0;
    const hasAttrDims = Array.isArray(attributeDimensions) &&
        attributeDimensions.some((d) => Array.isArray(d.values) && d.values.length > 0);

    if (!hasColors && !hasSizes && !hasAttrDims) {
        throw new ValidationError(
            'At least one dimension with at least one value is required. ' +
            'Supply baseDimensions.color[], baseDimensions.size[], or attributeDimensions[].'
        );
    }

    // SECTION 3: Validate each attributeDimension has an attributeId
    // AND no duplicate attributeId axes (cardinality at the axis level)
    if (Array.isArray(attributeDimensions)) {
        const attrAxisIds = [];
        for (const dim of attributeDimensions) {
            if (!dim.attributeId) {
                throw new ValidationError(
                    `Each attributeDimension must have an "attributeId" field. Received: ${JSON.stringify(dim)}`
                );
            }
            attrAxisIds.push(dim.attributeId);
        }
        const attrIdSet = new Set(attrAxisIds);
        if (attrIdSet.size !== attrAxisIds.length) {
            throw new ValidationError(
                'Duplicate attributeId axes detected in attributeDimensions. ' +
                'Each attribute type may appear only once per generation request.'
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/variants/v2/preview-dimensions
 * ─────────────────────────────────────────
 * Returns a list of all combinations that WOULD be generated.
 * Read-only — no writes. Use this for the UI preview before confirming.
 *
 * Body: { productGroupId, baseDimensions, attributeDimensions, maxCombinations? }
 *
 * Response:
 * {
 *   totalCombinations: 8,
 *   breakdown: [{ key, label, valueCount }],
 *   combinations: [{ combinationKey, configHash, selections }]
 * }
 */
export const previewDimensions = asyncHandler(async (req, res) => {
    validateDimensionBody(req.body);

    const t0 = Date.now();
    const result = await previewVariantDimensions(req.body);

    logger.info('[VariantDimension] Preview complete', {
        productGroupId: req.body.productGroupId,
        totalCombinations: result.totalCombinations,
        durationMs: Date.now() - t0,
    });

    return res.status(200).json({
        success: true,
        message: `${result.totalCombinations} combination(s) would be generated.`,
        data: result,
    });
});

/**
 * POST /api/variants/v2/generate-dimensions
 * ─────────────────────────────────────────
 * Generates and persists all variant combinations inside a transaction.
 * Skips combinations that already exist (idempotent on re-run).
 *
 * Body: { productGroupId, baseDimensions, attributeDimensions, basePrice?, brand?, tenantId? }
 *
 * Response:
 * {
 *   totalGenerated: 8,
 *   skipped: 0,
 *   variants: [{ id, sku, configHash }]
 * }
 */
export const generateDimensions = asyncHandler(async (req, res) => {
    console.log("STEP 3 - Incoming Payload:", JSON.stringify(req.body, null, 2));
    validateDimensionBody(req.body);

    const t0 = Date.now();
    const batchId = `batch-${t0}-${Math.random().toString(36).slice(2, 8)}`;

    // ── STEP 1: Calculate count to decide Sync vs Async ──────────────────────
    const parsedInput = fromApiInput(req.body);
    const count = countCombinations(parsedInput.dimensions.filter(d => !d.disabled && d.values.length > 0));

    // If batch is small (e.g. < 50), run synchronously for better DX and UI responsiveness
    if (count <= 50) {
        logger.info(`[VariantDimension] Running small batch synchronously (${count} combos)`, {
            productGroupId: req.body.productGroupId
        });

        const result = await generateVariantDimensions({
            ...req.body,
            _batchId: batchId,
            createdBy: req.user?._id ?? null,
        });

        return res.status(201).json({
            success: true,
            message: `Generated ${result.totalGenerated} variants successfully.`,
            data: result,
        });
    }

    // ── STEP 2: Large batch enqueued to Redis/BullMQ ──────────────────────────
    let job;
    try {
        job = await variantGenerationQueue.add('generate', {
            ...req.body,
            _batchId: batchId,
            createdBy: req.user?._id ?? null,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: { age: 3600 },
            removeOnFail: false
        });

        logger.info(`[VariantDimension] Generation job ${job.id} enqueued`, {
            productGroupId: req.body.productGroupId,
            batchId,
        });
    } catch (queueErr) {
        // Fallback: If Redis is down but batch is not too massive, try running sync anyway
        if (count <= 200) {
            logger.warn(`[VariantDimension] Redis unavailable. Falling back to sync execution for mid-sized batch.`, { error: queueErr.message });
            const result = await generateVariantDimensions({
                ...req.body,
                _batchId: batchId,
                createdBy: req.user?._id ?? null,
            });
            return res.status(201).json({
                success: true,
                message: `Generated ${result.totalGenerated} variants (Synchronous Fallback).`,
                data: result,
            });
        }

        logger.error(`[VariantDimension] Queue unavailable and batch too large for sync.`, { error: queueErr.message });
        return res.status(503).json({
            success: false,
            message: 'Background processing queue is currently unavailable. Please try again later.',
        });
    }

    return res.status(202).json({
        success: true,
        message: 'Large variant generation started in background',
        jobId: job.id,
        batchId,
        data: {
            jobId: job.id,
            status: 'processing',
            totalExpected: count
        },
    });
});

/**
 * GET /api/variants/v2/jobs/:id
 * ──────────────────────────────
 * Check the status of a Variant Generation Queue job
 */
export const getGenerationJobStatus = asyncHandler(async (req, res) => {
    const job = await variantGenerationQueue.getJob(req.params.id);

    if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress || 0;

    return res.status(200).json({
        success: true,
        data: {
            jobId: job.id,
            status: state,
            progress: progress,
            returnvalue: job.returnvalue || null,
            failedReason: job.failedReason || null
        }
    });
});


/**
 * POST /api/variants/v2/diff-dimensions
 * ──────────────────────────────────────
 * Pure in-process diff — no DB required.
 * Compares two dimension workspaces and returns what changed.
 * Used by the admin UI to highlight dimension changes before save.
 *
 * Body:
 * {
 *   previous: Dimension[],
 *   next:     Dimension[]
 * }
 *
 * Response:
 * {
 *   addedKeys:    ['storage'],
 *   removedKeys:  [],
 *   modifiedKeys: { ram: { added: [...], removed: [...] } },
 *   hasChanges:   true,
 *   previousCount: 4,
 *   nextCount:    8
 * }
 */
export const diffDimensionsHandler = asyncHandler(async (req, res) => {
    const { previous = [], next = [] } = req.body;

    if (!Array.isArray(previous) || !Array.isArray(next)) {
        throw new ValidationError('"previous" and "next" must be arrays of Dimension objects');
    }

    const prevNorm = previous.map(normalizeDimension);
    const nextNorm = next.map(normalizeDimension);
    const diff = diffDimensions(prevNorm, nextNorm);

    const prevActive = prevNorm.filter((d) => !d.disabled && d.values.length > 0);
    const nextActive = nextNorm.filter((d) => !d.disabled && d.values.length > 0);

    return res.status(200).json({
        success: true,
        data: {
            ...diff,
            previousCount: prevActive.length ? countCombinations(prevActive) : 0,
            nextCount: nextActive.length ? countCombinations(nextActive) : 0,
        },
    });
});

export default { previewDimensions, generateDimensions, diffDimensionsHandler, getGenerationJobStatus };
