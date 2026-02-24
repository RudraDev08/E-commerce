/**
 * useCartesianEngine — Client-side N-dimensional Cartesian engine hook
 * ─────────────────────────────────────────────────────────────────────
 * Mirrors Backend/services/cartesianEngine.js logic so the UI has
 * instant, offline Cartesian preview without any API round-trip.
 *
 * The hook owns the dimension workspace state and exposes:
 *   • dimensions         — current active dimension map
 *   • setDimension       — upsert one dimension's selected value IDs
 *   • removeDimension    — unregister a dimension key
 *   • generatedRows      — current VariantRow[] (Cartesian product)
 *   • updateRow          — patch user-editable fields (sku, price, stock)
 *   • previewCount       — live count (no materialisation)
 *   • willExplode        — boolean: count > MAX_WARN threshold
 *   • dimensionOrder     — stable array of dimension keys (for column headers)
 *   • reset              — clear everything
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ── CONSTANTS ────────────────────────────────────────────────────────────────
export const MAX_COMBINATIONS = 5000;   // Synced with Backend
export const WARN_COMBINATIONS = 1000;  // Threshold to warn admin before generation
const DEBOUNCE_MS = 120;   // how long to wait after last selection change

// ── PURE HELPERS (no React) ──────────────────────────────────────────────────

/** URL-safe slug normalisation identical to the backend engine */
export function toSlug(str) {
    return String(str ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Iterative Cartesian accumulator — O(N×D), no recursion risk.
 *
 * @param {Array<{ key: string, values: DimensionValue[] }>} activeDims
 * @returns {Array<Object.<string, DimensionValue>>}
 */
function iterativeCartesian(activeDims) {
    if (activeDims.length === 0) return [];
    let acc = [{}];
    for (const dim of activeDims) {
        const next = [];
        for (const partial of acc) {
            for (const val of dim.values) {
                const combo = { ...partial, [dim.key]: val };

                // Step 3 Logic: Produce attribute structured data
                if (dim.type === 'ATTRIBUTE') {
                    combo.attributeValueIds = combo.attributeValueIds || [];
                    combo.attributeDimensions = combo.attributeDimensions || [];

                    combo.attributeValueIds.push(val.id);
                    combo.attributeDimensions.push({
                        attributeId: dim.attributeId || dim.key,
                        attributeName: dim.label || dim.attributeName,
                        valueId: val.id
                    });
                }

                next.push(combo);
            }
        }
        acc = next;
    }
    return acc;
}

/**
 * Build a stable combination key from a selection map.
 * Uses the supplied dimensionOrder so key is human-readable
 * and consistent regardless of JS object key ordering.
 */
function buildCombinationKey(selection, dimensionOrder) {
    return dimensionOrder
        .filter(k => selection[k])
        .map(k => selection[k].slug || toSlug(selection[k].label))
        .join('-');
}

/**
 * Compute the total combination count without materialising them.
 */
export function countCombinations(activeDims) {
    if (!activeDims.length) return 0;
    return activeDims.reduce((acc, d) => acc * d.values.length, 1);
}

// ── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} DimensionValue
 * @property {string} id
 * @property {string} label
 * @property {string} [slug]
 * @property {string} [hex]   — color swatch hex
 * @property {Object} [meta]
 */

/**
 * @typedef {Object} DimensionDef
 * @property {string}           key
 * @property {string}           label
 * @property {string}           [icon]   — 'color' | 'size' | 'attr'
 * @property {DimensionValue[]} allValues  — full master list for this dimension
 * @property {string[]}         selectedIds
 */

/**
 * @typedef {Object} VariantRow
 * @property {string}  combinationKey   — deterministic slug
 * @property {Object}  selections       — { [dimKey]: DimensionValue }
 * @property {string}  sku
 * @property {string}  price
 * @property {number}  stock
 * @property {string}  barcode
 * @property {boolean} isNew
 * @property {boolean} isEdited
 * @property {string[]} dimensionOrder
 */

export function useCartesianEngine({ productSlug = 'VAR' } = {}) {
    // ── State ──────────────────────────────────────────────────────────────────
    /**
     * dimensionDefs: Map<key, DimensionDef>
     * Ordered insertion ensures stable column headers
     */
    const [dimensionDefs, setDimensionDefs] = useState(new Map());

    /** selectedIds: Map<key, Set<string>> */
    const [selectedIds, setSelectedIds] = useState(new Map());

    /** User-editable row overrides: Map<combinationKey, Partial<VariantRow>> */
    const [rowOverrides, setRowOverrides] = useState(new Map());

    // ── Debounce ref ───────────────────────────────────────────────────────────
    const debounceRef = useRef(null);
    const [triggerVersion, setTriggerVersion] = useState(0);

    // Schedule recompute after debounce
    const scheduleRecompute = useCallback(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setTriggerVersion(v => v + 1), DEBOUNCE_MS);
    }, []);

    // ── DERIVED: active dimensions ─────────────────────────────────────────────
    const activeDims = useMemo(() => {
        const result = [];
        for (const [key, def] of dimensionDefs) {
            const selIds = selectedIds.get(key) ?? new Set();
            if (selIds.size === 0) continue;
            const values = def.allValues
                .filter(v => selIds.has(v.id))
                .map(v => ({ ...v, slug: v.slug ?? toSlug(v.label) }));
            if (values.length > 0) result.push({
                ...def, // spread def to get type, attributeId etc
                key,
                values
            });
        }
        return result;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dimensionDefs, selectedIds, triggerVersion]);

    // ── DERIVED: preview count ─────────────────────────────────────────────────
    const previewCount = useMemo(() => countCombinations(activeDims), [activeDims]);
    const willExplode = previewCount > MAX_COMBINATIONS;
    const willWarn = previewCount > WARN_COMBINATIONS && !willExplode;

    // ── DERIVED: dimension order ───────────────────────────────────────────────
    const dimensionOrder = useMemo(() => [...dimensionDefs.keys()], [dimensionDefs]);

    // ── DERIVED: generated rows ────────────────────────────────────────────────
    const generatedRows = useMemo(() => {
        if (activeDims.length === 0 || willExplode) return [];

        const selectionMaps = iterativeCartesian(activeDims);
        const order = activeDims.map(d => d.key);

        return selectionMaps.map(selection => {
            const comboKey = buildCombinationKey(selection, order);

            // Preserve user edits for this combination
            const override = rowOverrides.get(comboKey) ?? {};

            // Auto-generate SKU: PRODUCTSLUG-dim1val-dim2val...
            const skuParts = [
                productSlug.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8),
                ...order.map(k => (selection[k]?.slug ?? toSlug(selection[k]?.label ?? '')).replace(/-/g, '').toUpperCase().slice(0, 6)),
            ];

            return {
                combinationKey: comboKey,
                selections: selection,
                dimensionOrder: order,
                sku: override.sku ?? skuParts.join('-'),
                price: override.price ?? '',
                stock: override.stock ?? 0,
                barcode: override.barcode ?? '',
                isNew: true,
                isEdited: !!Object.keys(override).length,
                attributeValueIds: selection.attributeValueIds || [],
                attributeDimensions: selection.attributeDimensions || []
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDims, rowOverrides, productSlug, triggerVersion]);

    // ── PUBLIC API ─────────────────────────────────────────────────────────────

    /**
     * Register / update a dimension definition.
     * Call this once per dimension type when master data loads.
     */
    const registerDimension = useCallback((key, labelOrConfig, allValues, iconType = 'attr') => {
        setDimensionDefs(prev => {
            const next = new Map(prev);
            if (labelOrConfig && typeof labelOrConfig === 'object') {
                // New signature: registerDimension(key, { type, attributeId, values, ... })
                const config = labelOrConfig;
                next.set(key, {
                    key,
                    type: config.type || 'ATTRIBUTE',
                    attributeId: config.attributeId || key,
                    label: config.attributeName || config.label || key,
                    allValues: config.allValues || config.values || [],
                    icon: config.icon || 'attr'
                });
            } else {
                // Old signature: registerDimension(key, label, allValues, iconType)
                next.set(key, {
                    key,
                    label: labelOrConfig,
                    icon: iconType,
                    allValues,
                    type: key === 'color' || key === 'size' ? 'BASE' : 'ATTRIBUTE',
                    attributeId: key === 'color' || key === 'size' ? null : key
                });
            }
            return next;
        });
    }, []);

    /** Unregister a dimension (also clears its selections) */
    const removeDimension = useCallback((key) => {
        setDimensionDefs(prev => { const m = new Map(prev); m.delete(key); return m; });
        setSelectedIds(prev => { const m = new Map(prev); m.delete(key); return m; });
        scheduleRecompute();
    }, [scheduleRecompute]);

    /** Toggle one value's selection in a dimension */
    const toggleValue = useCallback((dimKey, valueId) => {
        setSelectedIds(prev => {
            const m = new Map(prev);
            const ids = new Set(m.get(dimKey) ?? []);
            ids.has(valueId) ? ids.delete(valueId) : ids.add(valueId);
            m.set(dimKey, ids);
            return m;
        });
        scheduleRecompute();
    }, [scheduleRecompute]);

    /** Select all values in a dimension */
    const selectAll = useCallback((dimKey) => {
        const def = dimensionDefs.get(dimKey);
        if (!def) return;
        setSelectedIds(prev => {
            const m = new Map(prev);
            m.set(dimKey, new Set(def.allValues.map(v => v.id)));
            return m;
        });
        scheduleRecompute();
    }, [dimensionDefs, scheduleRecompute]);

    /** Deselect all values in a dimension */
    const deselectAll = useCallback((dimKey) => {
        setSelectedIds(prev => {
            const m = new Map(prev);
            m.set(dimKey, new Set());
            return m;
        });
        scheduleRecompute();
    }, [scheduleRecompute]);

    /** Patch user-editable fields on one row */
    const updateRow = useCallback((combinationKey, field, value) => {
        setRowOverrides(prev => {
            const m = new Map(prev);
            const cur = m.get(combinationKey) ?? {};
            m.set(combinationKey, { ...cur, [field]: value });
            return m;
        });
    }, []);

    /** Clear everything */
    const reset = useCallback(() => {
        setSelectedIds(new Map());
        setRowOverrides(new Map());
        scheduleRecompute();
    }, [scheduleRecompute]);

    /** How many values are selected for a given dimension */
    const selectedCountFor = useCallback((dimKey) => {
        return selectedIds.get(dimKey)?.size ?? 0;
    }, [selectedIds]);

    /** Check if a specific value is selected */
    const isSelected = useCallback((dimKey, valueId) => {
        return selectedIds.get(dimKey)?.has(valueId) ?? false;
    }, [selectedIds]);

    /** Build the API payload for POST /v2/generate-dimensions */
    const buildApiPayload = useCallback((productGroupId, brand, basePrice) => {
        const color = [...(selectedIds.get('color') ?? [])].filter(Boolean);
        const size = [...(selectedIds.get('size') ?? [])].filter(Boolean);
        const attrDimensions = [];

        for (const [key, ids] of selectedIds) {
            if (key === 'color' || key === 'size' || !ids.size) continue;
            const validIds = [...ids].filter(Boolean);
            if (validIds.length > 0) {
                const def = dimensionDefs.get(key);
                attrDimensions.push({
                    attributeId: key,
                    attributeName: def?.label || def?.attributeName || key,
                    values: validIds
                });
            }
        }

        return {
            productGroupId,
            brand,
            basePrice: Number(basePrice) || 0,
            baseDimensions: { color, size },
            attributeDimensions: attrDimensions,
        };
    }, [selectedIds]);

    // Cleanup debounce on unmount
    useEffect(() => () => clearTimeout(debounceRef.current), []);

    return {
        // State
        dimensionDefs,
        dimensionOrder,
        generatedRows,
        previewCount,
        willExplode,
        willWarn,
        // Actions
        registerDimension,
        removeDimension,
        toggleValue,
        selectAll,
        deselectAll,
        updateRow,
        reset,
        // Selectors
        isSelected,
        selectedCountFor,
        selectedIds,
        buildApiPayload,
    };
}
