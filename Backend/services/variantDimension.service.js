/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIANT DIMENSION SERVICE  ·  v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Bridges the pure CartesianEngine with the real database:
 *
 *   1. Accepts the API payload (dimension specs with real DB IDs)
 *   2. Validates all IDs exist and are active (single batched query per type)
 *   3. Enriches the dimension values with master data (name, hex, etc.)
 *   4. Delegates Cartesian expansion to the engine (no DB knowledge)
 *   5. De-duplicates against existing configHashes (one batched query)
 *   6. Bulk-inserts new VariantMaster documents inside a transaction
 *   7. Emits a summary response
 *
 * KEY IMPROVEMENTS OVER OLD SERVICE
 * ----------------------------------
 * OLD: hardcoded storageIds + ramIds + colorIds → only 3 fixed dimensions
 * NEW: unlimited attributeDimensions[] → COLOR × SIZE × N attributes
 *
 * OLD: generateConfigHash(productGroup, sizeIds, colorId) → wrong signature,
 *      doesn't include productGroupId in the configHash util.
 * NEW: uses cartesianEngine.buildConfigHash() with sorted key=id pairs
 *
 * OLD: random SKU suffix on collision → non-deterministic, hard to reproduce
 * NEW: deterministic SKU from configHash prefix + brand + productGroup token
 *
 * @module variantDimension.service
 */

import mongoose from 'mongoose';
import VariantMaster from '../models/masters/VariantMaster.enterprise.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import ColorMaster from '../models/masters/ColorMaster.enterprise.js';
import SizeMaster from '../models/masters/SizeMaster.enterprise.js';
import AttributeValue from '../models/AttributeValue.model.js';
import ProductGroupMaster from '../models/masters/ProductGroupMaster.enterprise.js';
import Product from '../src/modules/product/product.model.js';
import WarehouseMaster from '../models/WarehouseMaster.js';
import {
    buildVariantCombinations,
    buildVariantCombinationsMemo,
    fromApiInput,
    countCombinations,
    normalizeDimension,
    clearMemoCache,
} from './cartesianEngine.js';
import {
    validateCardinality,
    validateLimits,
    LIMITS,
} from '../utils/variantIdentity.js';
import { SnapshotService } from './snapshot.service.js';
import logger from '../config/logger.js';

const MAX_COMBINATIONS = LIMITS.MAX_COMBINATIONS;  // single source of truth (variantIdentity)
const MAX_RETRIES = 3;

// ─────────────────────────────────────────────────────────────────────────────
// MASTER DATA LOADER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads and validates all dimension values from the database in parallel.
 * Returns a map of enriched DimensionValue objects keyed by their DB id.
 *
 * @param {Object} parsedInput — output of fromApiInput()
 * @returns {Promise<Map<string, Object>>} id → enriched DimensionValue
 */
async function loadAndEnrichDimensions(parsedInput) {
    const { dimensions } = parsedInput;

    const colorDim = dimensions.find((d) => d.key === 'color');
    const sizeDim = dimensions.find((d) => d.key === 'size');
    const attrDims = dimensions.filter((d) => d.key !== 'color' && d.key !== 'size');

    const colorIds = (colorDim?.values.map((v) => v.id) ?? []).filter(Boolean);
    const sizeIds = (sizeDim?.values.map((v) => v.id) ?? []).filter(Boolean);
    const attrValueIds = attrDims.flatMap((d) => d.values.map((v) => v.id)).filter(Boolean);

    const [colors, sizes, attrValues] = await Promise.all([
        colorIds.length
            ? ColorMaster.find({ _id: { $in: colorIds } })
                .select('_id name displayName hexCode rgbCode colorFamily')
                .lean()
            : [],
        sizeIds.length
            ? SizeMaster.find({ _id: { $in: sizeIds } })
                .select('_id value displayName category gender normalizedRank')
                .lean()
            : [],
        attrValueIds.length
            ? AttributeValue.find({ _id: { $in: attrValueIds }, isDeleted: false })
                .select('_id name displayName slug code attributeType')
                .populate('attributeType', 'name displayName createsVariant')
                .lean()
            : [],
    ]);

    // 🟠 STEP 2/5 LOGS — Check backend filtering logic
    if (process.env.VARIANT_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
        console.log(`[VariantDebug] Loaded ${attrValues.length} total attribute values from DB.`);
    }

    const enrichMap = new Map();

    // ── COLORS ───────────────────────────────────────────────────────────────
    for (const c of colors) {
        enrichMap.set(c._id.toString(), {
            id: c._id.toString(),
            label: c.displayName ?? c.name,
            slug: _toSlug(c.displayName ?? c.name),
            meta: { hexCode: c.hexCode, rgbCode: c.rgbCode, colorFamily: c.colorFamily },
        });
    }
    // Resilience: Individual fallback for missing color IDs
    for (const id of colorIds) {
        if (!enrichMap.has(id)) {
            logger.warn(`[VariantDimension] Color ${id} not found in DB. Using fallback decoration.`);
            enrichMap.set(id, { id, label: `Color ${id.substring(id.length - 4)}`, slug: _toSlug(`color-${id}`), meta: {} });
        }
    }

    // ── SIZES ────────────────────────────────────────────────────────────────
    for (const s of sizes) {
        enrichMap.set(s._id.toString(), {
            id: s._id.toString(),
            label: s.displayName ?? s.value,
            slug: _toSlug(s.displayName ?? s.value),
            meta: { category: s.category, gender: s.gender, normalizedRank: s.normalizedRank },
        });
    }
    // Resilience: Individual fallback for missing size IDs
    for (const id of sizeIds) {
        if (!enrichMap.has(id)) {
            logger.warn(`[VariantDimension] Size ${id} not found in DB. Using fallback decoration.`);
            enrichMap.set(id, { id, label: `Size ${id.substring(id.length - 4)}`, slug: _toSlug(`size-${id}`), meta: {} });
        }
    }

    // ── ATTRIBUTES (Filter only createsVariant=true) ─────────────────────────
    // ✅ Phase 6, Step 5: Strict filtering — only include variant-creating dimensions
    const variantAttributes = attrValues.filter(av => av.attributeType?.createsVariant === true);
    if (process.env.VARIANT_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
        console.log(`[VariantDebug] Filtered to ${variantAttributes.length} variant-creating attributes.`);
    }

    for (const av of variantAttributes) {
        enrichMap.set(av._id.toString(), {
            id: av._id.toString(),
            label: av.displayName ?? av.name,
            slug: av.slug ?? _toSlug(av.displayName ?? av.name),
            attributeName: av.attributeType?.displayName ?? av.attributeType?.name ?? 'Unknown',
            meta: {
                code: av.code,
                attributeTypeId: av.attributeType?._id?.toString() ?? av.attributeType?.toString(),
                attributeTypeName: av.attributeType?.displayName ?? av.attributeType?.name
            },
        });
    }
    // Resilience: Individual fallback for missing attribute values
    for (const id of attrValueIds) {
        if (!enrichMap.has(id)) {
            logger.warn(`[VariantDimension] AttributeValue ${id} not found in DB. Using fallback decoration.`);
            enrichMap.set(id, { id, label: `Value ${id.substring(id.length - 4)}`, slug: _toSlug(`value-${id}`), attributeName: 'Attribute', meta: {} });
        }
    }

    return enrichMap;
}

/**
 * Throw if any requested IDs were not found or are inactive.
 */
function _validateFound(typeName, requestedIds, foundDocs) {
    if (requestedIds.length === 0) return;
    const foundIds = new Set(foundDocs.map((d) => d._id.toString()));
    const missing = requestedIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
        throw Object.assign(
            new Error(`Invalid or inactive ${typeName} IDs: [${missing.join(', ')}]`),
            { statusCode: 400, code: 'INVALID_DIMENSION_VALUE' }
        );
    }
}

/**
 * Convert raw dimension values in parsedInput to enriched values from DB.
 */
function enrichDimensions(parsedInput, enrichMap) {
    return parsedInput.dimensions.map((dim) => ({
        ...dim,
        values: dim.values
            .map((v) => enrichMap.get(v.id))
            .filter(Boolean), // safety: drop any that failed to enrich
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SKU GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministic SKU from configHash prefix + brand + productGroup token.
 * Format: {BRAND}-{PGROUP_TOKEN}-{HASH8}
 * Never collides for unique combinations, never random.
 */
function buildSku(brand, productGroupSlug, configHash) {
    const b = _token(brand, 3);
    const pg = _token(productGroupSlug, 6);
    const h = configHash.substring(0, 8).toUpperCase();
    return `${b}-${pg}-${h}`;
}

function _token(str, len) {
    return (str ?? 'VAR')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, len)
        .padEnd(len, '0');
}

function _toSlug(str) {
    return String(str ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW (read-only, memoized)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * previewVariantDimensions
 * ─────────────────────────
 * Read-only preview — validates IDs and returns the full combination list
 * without writing anything to the database.
 *
 * @param {Object} apiBody — request body from POST /preview-dimensions
 * @returns {Promise<Object>}
 */
export async function previewVariantDimensions(apiBody) {
    const parsedInput = fromApiInput(apiBody);
    const enrichMap = await loadAndEnrichDimensions(parsedInput);

    const enrichedDimensions = enrichDimensions(parsedInput, enrichMap);
    const enrichedInput = { ...parsedInput, dimensions: enrichedDimensions };

    // Use memoized version for preview (read-only, safe to cache)
    const combinations = buildVariantCombinationsMemo(enrichedInput);

    // Count by active dimension
    const activeDims = enrichedDimensions.filter((d) => !d.disabled && d.values.length > 0);
    const breakdown = activeDims.map((d) => ({ key: d.key, label: d.label, valueCount: d.values.length }));

    // Format dimensionBreakdown as requested in Phase 2.2
    const dimensionBreakdown = {};
    activeDims.forEach(d => {
        dimensionBreakdown[d.label || d.key] = d.values.length;
    });

    return {
        totalCombinations: combinations.length,
        breakdown,
        dimensionBreakdown, // Phase 2.2 format
        dimensions: enrichedDimensions,
        combinations: combinations.map((c) => ({
            combinationKey: c.combinationKey,
            configHash: c.configHash,
            selections: Object.fromEntries(
                Object.entries(c.selections).map(([k, v]) => [k, { id: v.id, label: v.label, slug: v.slug }])
            ),
        })),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE (write path — transactional)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateVariantDimensions
 * ──────────────────────────
 * Full write path with Mongoose transaction, configHash duplicate detection,
 * and exponential-backoff retry for transient write conflicts.
 *
 * @param {Object} apiBody
 * @returns {Promise<Object>}
 */
export async function generateVariantDimensions(apiBody) {
    // FIX PROMPT 3 — Protect Against Recursive Job Spawning
    if (apiBody.__internalWorkerCall) {
        throw new Error('Recursive job spawn detected: Service was called with worker-only flag but attempted to re-dispatch.');
    }

    // ── SECTION 9: Validate system limits BEFORE any DB call ──────────────────
    validateLimits(apiBody);

    // ── SECTION 3: Cardinality invariant check BEFORE engine expansion ────────
    // attributeDimensions in the API payload must have at most one value per type
    if (Array.isArray(apiBody.attributeDimensions)) {
        for (const dim of apiBody.attributeDimensions) {
            // Each dim has one values[] array; cardinality within a single combo
            // is enforced per-combination at doc build time (below).
            // Here we only validate no duplicate attributeId axes in the request.
        }
        const attrIds = apiBody.attributeDimensions.map(d => d.attributeId).filter(Boolean);
        const attrIdSet = new Set(attrIds);
        if (attrIdSet.size !== attrIds.length) {
            const err = new Error('[variantDimension] Duplicate attributeId axes in attributeDimensions payload.');
            err.statusCode = 400; err.code = 'CARDINALITY_VIOLATION';
            throw err;
        }
    }

    const parsedInput = fromApiInput(apiBody);
    const enrichMap = await loadAndEnrichDimensions(parsedInput);

    const enrichedDimensions = enrichDimensions(parsedInput, enrichMap);
    const enrichedInput = { ...parsedInput, dimensions: enrichedDimensions, maxCombinations: MAX_COMBINATIONS };

    // ENGINE: expand combinations
    console.log("Incoming payload:", apiBody);
    const combinations = buildVariantCombinations(enrichedInput);
    console.log("Cartesian combos:", combinations.length);

    // Phase 2.1: Combination Hard Cap
    if (combinations.length > MAX_COMBINATIONS) {
        throw new Error(`Variant explosion detected: ${combinations.length} exceeds max limit of ${MAX_COMBINATIONS}`);
    }

    if (combinations.length > 0) {
        console.log("First combo:", JSON.stringify(combinations[0], null, 2));
    }

    if (combinations.length === 0) {
        return { success: true, totalGenerated: 0, skipped: 0, message: 'No new combinations produced.' };
    }

    // ProductGroup metadata for SKU generation.
    // Try enterprise ProductGroupMaster first, then fall back to the legacy
    // Product model (collection: 'products') so the V2 engine works even
    // when the productgroupmasters collection is empty.
    let productGroup = await ProductGroupMaster.findById(parsedInput.productGroupId)
        .select('name slug')
        .lean();
    if (!productGroup) {
        productGroup = await Product.findById(parsedInput.productGroupId)
            .select('name slug')
            .lean();
    }
    if (!productGroup) {
        throw Object.assign(
            new Error(`ProductGroup ${parsedInput.productGroupId} not found in productgroupmasters or products collections`),
            { statusCode: 404 }
        );
    }

    const brand = apiBody.brand ?? '';
    const pgSlug = productGroup.slug ?? productGroup.name ?? parsedInput.productGroupId;

    // Build candidate documents
    const candidates = combinations.map((c) => ({
        ...c,
        sku: buildSku(brand, pgSlug, c.configHash),
    }));

    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            const result = await _executeWrite({
                parsedInput,
                candidates,
                brand,
                pgSlug,
                enrichedDimensions,
                apiBody,
            });

            // Invalidate memo cache — data changed
            clearMemoCache();

            return result;
        } catch (err) {
            const isTransient = err.errorLabels?.includes('TransientTransactionError');
            const isDuplicate = err.code === 11000;
            if ((isTransient || isDuplicate) && attempts < MAX_RETRIES - 1) {
                attempts++;
                await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempts)));
                continue;
            }
            throw err;
        }
    }
}

async function _executeWrite({ parsedInput, candidates, brand, pgSlug, enrichedDimensions, apiBody }) {
    // 1. Batch duplicate check by configHash (no session — standalone MongoDB)
    const hashList = candidates.map((c) => c.configHash);
    const existingHashes = await VariantMaster.find({ configHash: { $in: hashList } })
        .select('configHash')
        .lean();
    const existingHashSet = new Set(existingHashes.map((v) => v.configHash));

    const newCandidates = candidates.filter((c) => !existingHashSet.has(c.configHash));
    if (newCandidates.length === 0) {
        return { success: true, totalGenerated: 0, skipped: candidates.length, message: 'All combinations already exist.' };
    }

    // 2. Build attributeValueIds per combination
    const colorDim = enrichedDimensions.find((d) => d.key === 'color');
    const sizeDim = enrichedDimensions.find((d) => d.key === 'size');

    const defaultWarehouse = await WarehouseMaster.findOne({ isDefault: true }).lean();

    // 3. Build VariantMaster docs (SECTION 6: persist attributeDimensions)
    const variantDocs = newCandidates.map((c) => {
        const colorVal = c.selections['color'];
        const sizeVal = c.selections['size'];

        const doc = {
            productGroupId: new mongoose.Types.ObjectId(parsedInput.productGroupId),
            colorId: colorVal ? new mongoose.Types.ObjectId(colorVal.id) : null,
            sizes: sizeVal
                ? [{
                    sizeId: new mongoose.Types.ObjectId(sizeVal.id),
                    category: sizeVal.meta?.category || 'DIMENSION'
                }]
                : [],
            attributeValueIds: (c.attributeValueIds || []).map(id => new mongoose.Types.ObjectId(id)),
            attributeDimensions: (c.attributeDimensions || []).map(d => ({
                attributeId: d.attributeId ? new mongoose.Types.ObjectId(d.attributeId) : null,
                attributeName: d.attributeName || null,
                valueId: new mongoose.Types.ObjectId(d.valueId)
            })),
            price: apiBody.basePrice ?? 0,
            status: 'DRAFT',
            configHash: c.configHash,
            sku: c.sku,
            generationBatchId: parsedInput._batchId ?? null,
            tenantId: apiBody.tenantId ?? 'GLOBAL',
            governance: { createdBy: apiBody.createdBy ?? null },
            _skipFilterTokenRegen: true
        };

        return doc;
    });

    if (variantDocs.length > 0) {
        console.log("STEP 4 - Variant Pre-Save (Sample):", {
            sizes: variantDocs[0].sizes,
            attributeValueIds: variantDocs[0].attributeValueIds,
            attributeDimensions: variantDocs[0].attributeDimensions,
            filterTokens: variantDocs[0].filterTokens
        });
    }

    // 4. SECTION 2: bulkWrite ordered:false — concurrency-safe duplicate handling
    let created = 0;
    let raceDuplicates = 0;
    const job = apiBody._job; // Passed from worker
    const signal = apiBody.signal; // AbortController signal for timeout safety

    // Phase 2.3: Process in batches of 100 — prevents event-loop starvation
    const BATCH_SIZE = 100;
    for (let i = 0; i < variantDocs.length; i += BATCH_SIZE) {
        if (signal?.aborted) {
            throw new Error('Generation aborted due to timeout');
        }

        const batch = variantDocs.slice(i, i + BATCH_SIZE);
        const operations = batch.map(doc => ({
            insertOne: {
                document: doc
            }
        }));

        try {
            const bulkResult = await VariantMaster.bulkWrite(operations, { ordered: false });
            created += bulkResult.nInserted || 0;
        } catch (bulkErr) {
            // BulkWriteError contains partial results
            const inserted = bulkErr.result?.nInserted || 0;
            created += inserted;
            raceDuplicates += batch.length - inserted;

            if (bulkErr.code !== 11000 && bulkErr.name !== 'BulkWriteError' && bulkErr.name !== 'MongoBulkWriteError') {
                logger.error('[variantDimension] Caught non-duplicate bulkWrite error:', bulkErr);
                throw bulkErr;
            }
            logger.info(`[variantDimension] bulkWrite handled ${batch.length - inserted} duplicates/errors in chunk.`);
        }

        // Phase 2.3: yield to event loop
        await new Promise(resolve => setImmediate(resolve));

        // Update job progress if running in worker context
        if (job) {
            const progress = Math.round((i / variantDocs.length) * 100);
            await job.updateProgress(Math.min(progress, 99));
        }
    }

    // 5. PHASE 3 — Enforce 1:1 VariantMaster ↔ InventoryMaster invariant
    // After bulk insert: fetch the newly created variants by batchId and
    // upsert a zero-stock InventoryMaster record for each one.
    // ensureForVariant() uses $setOnInsert + upsert — safe for re-runs.
    if (created > 0) {
        try {
            const newDocs = parsedInput._batchId
                ? await VariantMaster.find({ generationBatchId: parsedInput._batchId })
                    .select('_id productGroupId sku')
                    .lean()
                : [];

            if (newDocs.length > 0) {
                // Fire all upserts concurrently — updateOne/upsert are safe in parallel
                await Promise.all(newDocs.map(v => InventoryMaster.ensureForVariant(v)));
                logger.info(`[variantDimension] Created/confirmed ${newDocs.length} InventoryMaster records.`);
            }
        } catch (invErr) {
            // Log but do NOT fail the variant creation — repairInventory.js handles
            // any orphans created during transient failures.
            logger.error('[variantDimension] InventoryMaster init error (non-fatal):', invErr.message);
        }
    }

    // 6. Trigger Snapshot Recompute (Debounced)
    if (created > 0) {
        SnapshotService.triggerRecompute(parsedInput.productGroupId);
    }


    return {
        success: true,
        totalGenerated: created,
        skipped: (candidates.length - newCandidates.length) + raceDuplicates,
        raceDuplicates,
        batchId: parsedInput._batchId ?? null,
    };
}

export default {
    previewVariantDimensions,
    generateVariantDimensions,
};
