/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CARTESIAN VARIANT ENGINE  ·  v2.0  ·  Production-Grade
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * -------
 * Pure-function, dependency-free engine that generates the full Cartesian
 * product across an arbitrary number of variant dimensions:
 *
 *   COLOR × SIZE × RAM × STORAGE × PROCESSOR × MATERIAL × FIT × ...
 *
 * The engine is completely dimension-agnostic — it does not know or care what
 * "color" or "RAM" means.  It just multiplies axes.
 *
 * DESIGN PRINCIPLES
 * -----------------
 *  1. PURE FUNCTIONS       — no side-effects, no DB calls, no I/O
 *  2. ITERATIVE NOT RECURSIVE — avoids stack-overflow on large sets
 *  3. DETERMINISTIC        — same input always → same output and hashes
 *  4. EXPLOSION GUARD      — throws before materialising dangerous outputs
 *  5. MEMORY SAFE          — lazy generator so you can stream results
 *  6. ZERO DEPENDENCIES    — safe in Web Workers, service workers, etc.
 *
 * COMPLEXITY
 * ----------
 *  Let D  = number of dimensions
 *  Let Vᵢ = number of values in dimension i
 *  Total combinations N = ∏ Vᵢ
 *
 *  Time:  O(N × D)   — every combination requires visiting every dimension
 *  Space: O(N × D)   — if you materialise; O(D) working memory with generator
 *
 * ALGORITHM — ITERATIVE ACCUMULATOR
 * -----------------------------------
 * The classic reduce-flatMap Cartesian loop extended to arbitrary axes:
 *
 *   acc = [[]]    (one empty combo to start)
 *   for each dimension:
 *     acc = acc.flatMap(combo => dimension.values.map(v => [...combo, v]))
 *
 * This is equivalent to N nested for-loops without the stack risk.
 *
 * @module cartesianEngine
 */
import crypto from 'crypto';
import { generateConfigHash } from '../utils/configHash.util.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (JSDoc — no runtime cost)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} DimensionValue
 * @property {string} id          — Unique stable identifier (ObjectId string, slug, etc.)
 * @property {string} label       — Human-readable display value ("8 GB", "Black", "XL")
 * @property {string} [slug]      — URL-safe normalized key  ("8gb", "black", "xl")
 * @property {Object} [meta]      — Passthrough payload (hexCode, sortOrder, etc.)
 */

/**
 * @typedef {Object} Dimension
 * @property {string}           key           — Axis identifier ("color", "ram", "processor")
 * @property {string}           [label]       — Human-readable axis name ("RAM", "Processor")
 * @property {DimensionValue[]} values        — Possible values for this axis
 * @property {boolean}          [disabled]    — If true, dimension is excluded from generation
 */

/**
 * @typedef {Object} EngineInput
 * @property {string}              productGroupId   — Owning product group ObjectId
 * @property {Dimension[]}         dimensions       — Ordered axis definitions
 * @property {number}              [maxCombinations=500] — Explosion guard
 */

/**
 * @typedef {Object} VariantCombination
 * @property {string}              combinationKey   — Stable slug key ("black-8gb-128gb")
 * @property {string}              configHash       — SHA-256 deterministic hash
 * @property {Object.<string, DimensionValue>} selections — { ram: {...}, color: {...} }
 * @property {string[]}            dimensionOrder   — Key order (for deterministic access)
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MAX_COMBINATIONS = 5000;  // Synced with enterprise limits
export const HARD_CAP_COMBINATIONS = 10_000; // Never generate more than this

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize a raw string into a deterministic slug.
 * "8 GB RAM"  → "8-gb-ram"
 * "Black (Matte)" → "black-matte"
 */
export function toSlug(str) {
    return String(str ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Normalize a raw dimension value into a standardised DimensionValue.
 * Accepts: plain string, { id, label, slug, ...meta }, or { _id, name/displayName }
 */
export function normalizeDimensionValue(raw, dimensionKey) {
    if (typeof raw === 'string') {
        return { id: raw, label: raw, slug: toSlug(raw), meta: {} };
    }

    const id = String(raw.id ?? raw._id ?? raw.value ?? raw.name ?? '');
    const label = String(raw.label ?? raw.displayName ?? raw.name ?? raw.value ?? id);
    const slug = raw.slug ?? toSlug(label);

    const { id: _id, _id: __id, label: _label, displayName: _dn, name: _n, slug: _s, value: _v, meta: _meta, ...rest } = raw;  // eslint-disable-line no-unused-vars
    const meta = { ...(_meta || {}), ...rest };

    if (!id) throw new Error(`[CartesianEngine] DimensionValue in "${dimensionKey}" has no resolvable id`);

    return { id, label, slug, meta };
}

/**
 * Normalize a raw Dimension into the canonical form.
 * Accepts:
 *  • { key, values[] }
 *  • { attributeId, values[] }  (from API input format)
 *  • { key: 'color', values: colorIds[] } where colorIds are plain strings
 */
export function normalizeDimension(raw) {
    const key = String(raw.key ?? raw.attributeId ?? raw.name ?? '');
    if (!key) throw new Error('[CartesianEngine] Dimension must have a "key" or "attributeId"');

    const label = raw.label ?? raw.displayName ?? key;
    const disabled = Boolean(raw.disabled);

    const rawValues = Array.isArray(raw.values) ? raw.values : [];

    // De-duplicate values by id (handles upstream copy-paste errors)
    const seen = new Set();
    const values = [];
    for (const v of rawValues) {
        const norm = normalizeDimensionValue(v, key);
        if (!seen.has(norm.id)) {
            seen.add(norm.id);
            values.push(norm);
        }
    }

    return {
        key,
        label,
        disabled,
        values,
        type: raw.type ?? (key === 'color' || key === 'size' ? 'BASE' : 'ATTRIBUTE'),
        attributeId: raw.attributeId ?? (key === 'color' || key === 'size' ? null : key),
        attributeName: raw.attributeName ?? label
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPLOSION GUARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the total count WITHOUT materialising all combinations.
 * Safe to call on any size input.
 *
 * @param {Dimension[]} activeDimensions
 * @returns {number}
 */
export function countCombinations(activeDimensions) {
    if (activeDimensions.length === 0) return 0;
    return activeDimensions.reduce((acc, dim) => acc * dim.values.length, 1);
}

/**
 * Throw if the combination count exceeds the limit.
 * @param {number} count
 * @param {number} [limit=DEFAULT_MAX_COMBINATIONS]
 */
export function guardExplosion(count, limit = DEFAULT_MAX_COMBINATIONS) {
    if (count > HARD_CAP_COMBINATIONS) {
        throw new Error(
            `[CartesianEngine] EXPLOSION GUARD: ${count.toLocaleString()} combinations exceeds the absolute hard cap of ${HARD_CAP_COMBINATIONS.toLocaleString()}. ` +
            `Reduce the number of dimensions or values per dimension.`
        );
    }
    if (count > limit) {
        throw new Error(
            `[CartesianEngine] ${count.toLocaleString()} combinations exceeds the configured limit of ${limit.toLocaleString()}. ` +
            `Reduce dimensions or increase maxCombinations if intentional.`
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HASH GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produce a stable SHA-256 configHash for a combination.
 *
 * Format: SHA256( productGroupId:key1=id1:key2=id2:... )
 * Keys are SORTED so insertion order never affects the hash.
 *
 * @param {string}  productGroupId
 * @param {Object.<string, DimensionValue>} selections
 * @returns {string} 64-char hex
 */
export function buildConfigHash(productGroupId, selections) {
    const colorId = selections['color']?.id;
    const sizeId = selections['size']?.id;
    const attributeValueIds = Object.entries(selections)
        .filter(([key]) => key !== 'color' && key !== 'size' && key !== 'attributeValueIds' && key !== 'attributeDimensions')
        .map(([, val]) => val?.id)
        .filter(Boolean);

    return generateConfigHash({
        productGroupId,
        colorId,
        sizeId,
        attributeValueIds
    });
}

/**
 * Build a human-readable slugified combination key.
 * Deterministic: sorted dimension keys → sorted slugs.
 *
 * @param {Object.<string, DimensionValue>} selections
 * @param {string[]} dimensionOrder  — original dimension key order
 * @returns {string}  e.g. "black-8gb-128gb"
 */
export function buildCombinationKey(selections, dimensionOrder) {
    // Use original dimension order (not alphabetical) for human legibility
    return dimensionOrder
        .map((key) => selections[key].slug)
        .join('-');
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENGINE — EAGER (materialises all combinations)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildVariantCombinations
 * ─────────────────────────
 * Main entry point.  Returns all variant combinations as a plain array.
 *
 * @param {EngineInput} input
 * @returns {VariantCombination[]}
 *
 * @example
 * const combos = buildVariantCombinations({
 *   productGroupId: 'pg-123',
 *   dimensions: [
 *     { key: 'color', values: [{ id: 'c1', label: 'Black' }, { id: 'c2', label: 'Silver' }] },
 *     { key: 'ram',   values: [{ id: 'r1', label: '8 GB' }, { id: 'r2', label: '16 GB' }] },
 *     { key: 'storage', values: [{ id: 's1', label: '128 GB' }, { id: 's2', label: '256 GB' }] },
 *   ],
 * });
 * // → 8 combinations
 */
export function buildVariantCombinations({
    productGroupId,
    dimensions = [],
    maxCombinations = DEFAULT_MAX_COMBINATIONS,
} = {}) {
    if (!productGroupId) throw new Error('[CartesianEngine] productGroupId is required');

    // 1. Normalize all dimensions
    const normalizedDims = dimensions.map(normalizeDimension);

    // 2. Filter: skip disabled + empty value-set dimensions
    const activeDims = normalizedDims.filter(
        (d) => !d.disabled && d.values.length > 0
    );

    // 🟠 STEP 2 — Check Backend Combination Log
    if (process.env.VARIANT_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
        console.log("[VariantDebug] Dimension Groups:", activeDims.map(d => ({ key: d.key, count: d.values.length })));
    }

    if (activeDims.length === 0) {
        return [];
    }

    // 3. Pre-flight explosion guard
    const totalCount = countCombinations(activeDims);
    guardExplosion(totalCount, maxCombinations);

    // 4. Iterative Cartesian accumulator
    // Start: one accumulator containing one empty partial combination
    // Shape per iteration: Array of { [key]: DimensionValue }[]
    let acc = [{}]; // one "empty" selection to seed the product

    for (const dim of activeDims) {
        const next = [];
        for (const existingSelection of acc) {
            for (const value of dim.values) {
                const combo = {
                    ...existingSelection,
                    [dim.key]: value,
                };

                // Step 3 Logic: Produce attribute structured data
                if (dim.type === 'ATTRIBUTE') {
                    combo.attributeValueIds = [...(existingSelection.attributeValueIds || [])];
                    combo.attributeDimensions = [...(existingSelection.attributeDimensions || [])];

                    combo.attributeValueIds.push(value.id);
                    combo.attributeDimensions.push({
                        attributeId: dim.attributeId || dim.key,
                        attributeName: dim.attributeName || dim.label,
                        valueId: value.id
                    });
                }

                next.push(combo);
            }
        }
        acc = next;
    }

    // 🟠 STEP 2 — Log Generated Combinations
    if (process.env.VARIANT_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
        console.log(`[VariantDebug] Generated Combinations: ${acc.length}`);
    }

    // 5. Map to final VariantCombination objects
    const dimensionOrder = activeDims.map((d) => d.key);

    return acc.map((selections) => ({
        combinationKey: buildCombinationKey(selections, dimensionOrder),
        configHash: buildConfigHash(productGroupId, selections),
        selections,
        dimensionOrder,
        attributeValueIds: selections.attributeValueIds || [],
        attributeDimensions: selections.attributeDimensions || [],
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// LAZY GENERATOR — yields one combination at a time (memory-safe for streams)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildVariantCombinationsLazy
 * ─────────────────────────────
 * Generator version — yields one VariantCombination at a time.
 * Use this for streaming responses or batch DB writes.
 *
 * @param {EngineInput} input
 * @yields {VariantCombination}
 *
 * @example
 * for (const combo of buildVariantCombinationsLazy({ productGroupId, dimensions })) {
 *   await VariantMaster.create({ configHash: combo.configHash, ... });
 * }
 */
export function* buildVariantCombinationsLazy({
    productGroupId,
    dimensions = [],
    maxCombinations = DEFAULT_MAX_COMBINATIONS,
} = {}) {
    if (!productGroupId) throw new Error('[CartesianEngine] productGroupId is required');

    const normalizedDims = dimensions.map(normalizeDimension);
    const activeDims = normalizedDims.filter((d) => !d.disabled && d.values.length > 0);
    if (activeDims.length === 0) return;

    const totalCount = countCombinations(activeDims);
    guardExplosion(totalCount, maxCombinations);

    const dimensionOrder = activeDims.map((d) => d.key);

    /**
     * Recursive generator helper.
     * @param {number} dimIndex
     * @param {Object} currentSelection
     */
    function* recurse(dimIndex, currentSelection) {
        if (dimIndex === activeDims.length) {
            // Leaf: emit combination
            yield {
                combinationKey: buildCombinationKey(currentSelection, dimensionOrder),
                configHash: buildConfigHash(productGroupId, currentSelection),
                selections: { ...currentSelection },
                dimensionOrder,
            };
            return;
        }
        const dim = activeDims[dimIndex];
        for (const value of dim.values) {
            yield* recurse(dimIndex + 1, { ...currentSelection, [dim.key]: value });
        }
    }

    yield* recurse(0, {});
}

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSION DIFF — detect what changed between two workspace states
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} DimensionDiff
 * @property {string[]} addedKeys      — Dimension keys added vs. previous
 * @property {string[]} removedKeys    — Dimension keys removed vs. previous
 * @property {Object}   modifiedKeys   — { [key]: { added: DimensionValue[], removed: DimensionValue[] } }
 * @property {boolean}  hasChanges
 */

/**
 * diffDimensions
 * ──────────────
 * Compare two sets of dimensions and return what changed.
 * Use to decide whether to invalidate cached combinations or rerun the engine.
 *
 * @param {Dimension[]} prev
 * @param {Dimension[]} next
 * @returns {DimensionDiff}
 */
export function diffDimensions(prev = [], next = []) {
    const prevMap = new Map(prev.map((d) => [d.key, d]));
    const nextMap = new Map(next.map((d) => [d.key, d]));

    const addedKeys = [...nextMap.keys()].filter((k) => !prevMap.has(k));
    const removedKeys = [...prevMap.keys()].filter((k) => !nextMap.has(k));
    const modifiedKeys = {};

    for (const [key, nextDim] of nextMap) {
        if (!prevMap.has(key)) continue; // New key handled above
        const prevDim = prevMap.get(key);
        const prevIds = new Set(prevDim.values.map((v) => v.id));
        const nextIds = new Set(nextDim.values.map((v) => v.id));

        const added = nextDim.values.filter((v) => !prevIds.has(v.id));
        const removed = prevDim.values.filter((v) => !nextIds.has(v.id));

        if (added.length > 0 || removed.length > 0) {
            modifiedKeys[key] = { added, removed };
        }
    }

    const hasChanges =
        addedKeys.length > 0 || removedKeys.length > 0 || Object.keys(modifiedKeys).length > 0;

    return { addedKeys, removedKeys, modifiedKeys, hasChanges };
}

// ─────────────────────────────────────────────────────────────────────────────
// API INPUT ADAPTER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fromApiInput
 * ─────────────
 * Converts the documented API request body format into the engine's EngineInput.
 *
 * API format:
 * {
 *   productGroupId: "...",
 *   baseDimensions: {
 *     color: [colorId1, colorId2],   // plain strings OR DimensionValue objects
 *     size?: [sizeId1, sizeId2]
 *   },
 *   attributeDimensions: [
 *     { attributeId: "attr-ram",     values: [...] },
 *     { attributeId: "attr-storage", values: [...] }
 *   ],
 *   maxCombinations?: 500
 * }
 *
 * @param {Object} apiBody
 * @returns {EngineInput}
 */
export function fromApiInput(apiBody = {}) {
    const {
        productGroupId,
        baseDimensions = {},
        attributeDimensions = [],
        maxCombinations = DEFAULT_MAX_COMBINATIONS,
    } = apiBody;

    const dimensions = [];

    // Base dimensions: color first (most common UI expectation)
    if (Array.isArray(baseDimensions.color) && baseDimensions.color.length > 0) {
        dimensions.push({ key: 'color', label: 'Color', values: baseDimensions.color });
    }
    if (Array.isArray(baseDimensions.size) && baseDimensions.size.length > 0) {
        dimensions.push({ key: 'size', label: 'Size', values: baseDimensions.size });
    }

    // Dynamic attribute dimensions
    for (const attrDim of attributeDimensions) {
        if (!attrDim.attributeId) continue;
        dimensions.push({
            key: attrDim.attributeId,
            label: attrDim.label ?? attrDim.attributeName ?? attrDim.attributeId,
            values: attrDim.values ?? [],
            disabled: attrDim.disabled ?? false,
            type: 'ATTRIBUTE',
            attributeId: attrDim.attributeId,
            attributeName: attrDim.attributeName ?? attrDim.label ?? attrDim.attributeId
        });
    }

    return { productGroupId, dimensions: dimensions.map(normalizeDimension), maxCombinations, _batchId: crypto.randomUUID() };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI WORKSPACE STATE MODEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createWorkspace
 * ────────────────
 * Factory that creates a mutable workspace model for the frontend Variant
 * Builder UI. The workspace tracks all selected dimensions and their values,
 * computes a live preview count, and flags changes for the diff engine.
 *
 * @param {string} productGroupId
 * @param {Dimension[]} [initialDimensions]
 * @returns {Object} workspace
 */
export function createWorkspace(productGroupId, initialDimensions = []) {
    let _dimensions = initialDimensions.map(normalizeDimension);
    let _previousDimensions = [..._dimensions];

    return {
        get productGroupId() { return productGroupId; },

        /** Current ordered dimensions */
        get dimensions() { return [..._dimensions]; },

        /** Live count (safe — no materialisation) */
        get previewCount() {
            const active = _dimensions.filter((d) => !d.disabled && d.values.length > 0);
            return active.length === 0 ? 0 : countCombinations(active);
        },

        /** Whether count exceeds the default limit */
        get willExplode() {
            return this.previewCount > DEFAULT_MAX_COMBINATIONS;
        },

        /** Add or replace a dimension by key */
        setDimension(dimension) {
            const norm = normalizeDimension(dimension);
            const idx = _dimensions.findIndex((d) => d.key === norm.key);
            if (idx >= 0) _dimensions[idx] = norm;
            else _dimensions.push(norm);
            return this;
        },

        /** Remove a dimension by key */
        removeDimension(key) {
            _dimensions = _dimensions.filter((d) => d.key !== key);
            return this;
        },

        /** Toggle a dimension's disabled state */
        toggleDimension(key) {
            _dimensions = _dimensions.map((d) =>
                d.key === key ? { ...d, disabled: !d.disabled } : d
            );
            return this;
        },

        /** Snapshot current state for diff tracking */
        snapshot() {
            _previousDimensions = [..._dimensions];
            return this;
        },

        /** Get diff since last snapshot() */
        getDiff() {
            return diffDimensions(_previousDimensions, _dimensions);
        },

        /** Generate all combinations (eager) */
        build(maxCombinations = DEFAULT_MAX_COMBINATIONS) {
            return buildVariantCombinations({ productGroupId, dimensions: _dimensions, maxCombinations });
        },

        /** Generate combinations lazily (for streaming) */
        *buildLazy(maxCombinations = DEFAULT_MAX_COMBINATIONS) {
            yield* buildVariantCombinationsLazy({ productGroupId, dimensions: _dimensions, maxCombinations });
        },

        /** Serialise to plain object (for persistence / JSON) */
        toJSON() {
            return { productGroupId, dimensions: _dimensions };
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMOIZED VERSION (process-lifetime cache — suitable for preview endpoints)
// ─────────────────────────────────────────────────────────────────────────────

const _memoCache = new Map(); // key → VariantCombination[]
const MEMO_MAX_SIZE = 128;    // LRU eviction threshold

/**
 * buildVariantCombinationsMemo
 * ─────────────────────────────
 * Memoized wrapper around buildVariantCombinations.
 * Cache key = SHA-256( JSON.stringify({ productGroupId, dimensions }) )
 *
 * WARNING: Only use for preview endpoints, never for write paths (stale data risk).
 */
export function buildVariantCombinationsMemo(input) {
    const cacheKey = crypto
        .createHash('sha256')
        .update(JSON.stringify({ pg: input.productGroupId, dims: input.dimensions?.map(d => ({ ...d })) }))
        .digest('hex');

    if (_memoCache.has(cacheKey)) {
        return _memoCache.get(cacheKey);
    }

    const result = buildVariantCombinations(input);

    // Simple LRU: evict oldest entry when cap reached
    if (_memoCache.size >= MEMO_MAX_SIZE) {
        _memoCache.delete(_memoCache.keys().next().value);
    }

    _memoCache.set(cacheKey, result);
    return result;
}

/** Clear the memo cache (e.g. after dimension changes) */
export function clearMemoCache() {
    _memoCache.clear();
}
