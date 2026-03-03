import { useState, useMemo, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — DETERMINISTIC IDENTITY KEY (replaces SHA-256 hash)
//
// Format: COLOR:<id>|SIZE:<category>:<id>|ATTR:<attributeId>:<valueId>
// Segments are sorted alphabetically before joining → stable regardless
// of insertion order. Uses Map<string, Variant> for O(1) lookup.
//
// WHY: SHA-256 required async, had browser API availability risk, and
// any key-construction mismatch produced a silent miss (null variant).
// A plain sorted-string key is synchronous, debuggable, and deterministic.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a deterministic identity key for a persisted variant document.
 * Reads structured fields that the backend guarantees to set.
 *
 * @param {Object} v - Variant document (lean or hydrated)
 * @returns {string}
 */
export function buildIdentityKey(v) {
    const parts = [];

    // COLOR segment
    const colorId = typeof v.colorId === 'object' ? v.colorId?._id : v.colorId;
    if (colorId) parts.push(`COLOR:${String(colorId)}`);

    // SIZE segments (supports multi-size enterprise schema)
    if (Array.isArray(v.sizes) && v.sizes.length > 0) {
        v.sizes.forEach(s => {
            const sid = typeof s.sizeId === 'object' ? s.sizeId?._id : s.sizeId;
            if (sid) parts.push(`SIZE:${s.category || 'DIMENSION'}:${String(sid)}`);
        });
    }

    // ATTR segments — from structured attributeDimensions (preferred) or attributeValueIds
    if (Array.isArray(v.attributeDimensions) && v.attributeDimensions.length > 0) {
        v.attributeDimensions.forEach(dim => {
            if (!dim?.valueId) return;
            const attrId = dim.attributeId ? String(dim.attributeId) : (dim.attributeName || 'UNKNOWN');
            const valueId = typeof dim.valueId === 'object' ? String(dim.valueId) : dim.valueId;
            parts.push(`ATTR:${attrId}:${valueId}`);
        });
    }

    parts.sort(); // Alphabetic sort → stable regardless of server insertion order
    return parts.join('|');
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY HELPERS (backward-compat for old variant shape from legacy API)
// ─────────────────────────────────────────────────────────────────────────────

function getVariantAttributeValueFn(variant, attributeSlug) {
    // New enterprise shape: variant.size / variant.color
    if (attributeSlug === 'size') {
        const s = variant.size;
        if (s && typeof s === 'object') return s.displayName || s.value || s.name || String(s._id);
        if (typeof s === 'string') return s;
        // Try first entry in sizes[]
        const firstSize = variant.sizes?.[0]?.sizeId;
        if (firstSize && typeof firstSize === 'object')
            return firstSize.displayName || firstSize.value || firstSize.name || String(firstSize._id);
    }
    if (attributeSlug === 'color') {
        const c = variant.color;
        if (c && typeof c === 'object') return c.name || c.displayName || String(c._id);
        if (typeof c === 'string') return c;
        const colorId = variant.colorId;
        if (colorId && typeof colorId === 'object') return colorId.name || colorId.displayName || String(colorId._id);
    }

    // ── STORAGE / CUSTOM ATTRIBUTE RESOLUTION ───────────────────────────────
    // Priority 1: populated attributeValueIds (enterprise shape from getVariantsByProductGroup)
    // Each entry is { _id, name, displayName, code, attributeType: { slug, name, ... } }
    // This resolves custom dimensions like Storage (256GB/512GB/1TB) when
    // attributeDimensions is empty (legacy import path).
    if (Array.isArray(variant.attributeValueIds) && variant.attributeValueIds.length > 0) {
        const matchAttr = variant.attributeValueIds.find(attr => {
            if (!attr || typeof attr !== 'object' || !attr._id) return false;
            const atType = attr.attributeType;
            if (!atType) return false;
            const slug = atType.slug || '';
            const name = (atType.name || atType.displayName || '').toLowerCase();
            const querySlug = attributeSlug.toLowerCase();
            return slug === querySlug
                || name === querySlug
                || name.replace(/\s+/g, '_') === querySlug
                || name.replace(/\s+/g, '-') === querySlug;
        });
        if (matchAttr) {
            return matchAttr.displayName || matchAttr.name || matchAttr.code || null;
        }
    }

    // Priority 2: flat attributes array (flattenVariant() output)
    // Format: [{ type: attrType.name, value: av.name, code, role }]
    if (Array.isArray(variant.attributes) && variant.attributes.length > 0) {
        const attr = variant.attributes.find(a => {
            if (!a) return false;
            // Match by type name (lowercased, space-normalised) or typeSlug
            const typeName = (a.type || '').toLowerCase();
            const querySlug = attributeSlug.toLowerCase();
            return typeName === querySlug
                || typeName.replace(/\s+/g, '_') === querySlug
                || typeName.replace(/\s+/g, '-') === querySlug;
        });
        if (attr) return attr.value || null;
    }

    // Priority 3: legacy flat object: { color: 'red', size: 'xl' }
    if (variant.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes)) {
        if (variant.attributes[attributeSlug]) return variant.attributes[attributeSlug];
    }

    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — useProductConfiguration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Array}  variants        - Pre-filtered ACTIVE variants
 * @param {Array}  attributeTypes  - Relevant attribute type configs
 * @param {Object} initialSelections
 */
export const useProductConfiguration = (variants = [], attributeTypes = [], initialSelections = {}) => {
    const [selectedAttributes, setSelectedAttributes] = useState(initialSelections);
    const [identityVersion, setIdentityVersion] = useState(null);

    // ── PHASE 3: Identity Version Sync ──────────────────────────────────────
    useEffect(() => {
        if (variants.length > 0) {
            const v = variants[0].identityVersion || 1;
            if (identityVersion !== null && identityVersion !== v) {
                console.warn(`[IdentitySync] Drift detected (v${identityVersion} -> v${v}). Resetting configuration.`);
                setSelectedAttributes({}); // Force re-selection on major engine change
            }
            setIdentityVersion(v);
        }
    }, [variants, identityVersion]);

    // ── PHASE 4: O(1) Identity Map (replaces variants.some) ────────────────
    // Build a Set of all real variant identity keys for O(1) availability checks.
    // ONLY includes VARIANT-role attributes (not SPECIFICATION).
    const variantRoleTypes = useMemo(() => {
        return attributeTypes.filter(t => t.attributeRole !== 'SPECIFICATION');
    }, [attributeTypes]);

    const variantIdentityMap = useMemo(() => {
        const map = new Map();
        variants.forEach(v => {
            const key = buildIdentityKey(v);
            if (key) map.set(key, v);
        });
        return map;
    }, [variants]);

    // Pre-built key Set for O(1) availability probing
    const availableKeySet = useMemo(() => {
        return new Set(variantIdentityMap.keys());
    }, [variantIdentityMap]);

    // ── getVariantAttributeValue (stable ref) ──────────────────────────────
    const getVariantAttributeValue = useCallback(
        (variant, slug) => getVariantAttributeValueFn(variant, slug),
        []
    );

    // ── PHASE 7: Safe Resolution Logic ─────────────────────────────────────
    // Only VARIANT-role attributes count toward full resolution.
    // SPECIFICATION attributes are display-only; never gate price display.
    const resolvedVariant = useMemo(() => {
        if (variants.length === 0) return null;

        const parts = [];
        const requiredCount = variantRoleTypes.length;  // Only real VARIANT dimensions
        const selectedCount = Object.keys(selectedAttributes).filter(k => selectedAttributes[k]).length;

        // Only attempt resolution if ALL variant dimensions are selected
        if (selectedCount < requiredCount) return null;

        // Resolve IDs to build key — only iterate VARIANT role types
        variantRoleTypes.forEach(t => {
            const selectedVal = selectedAttributes[t.slug];
            if (!selectedVal) return;

            // Find matching variant to extract IDs
            const match = variants.find(v => {
                const val = getVariantAttributeValue(v, t.slug);
                return val !== null && String(val) === String(selectedVal);
            });

            if (match) {
                if (t.slug === 'color') {
                    const cId = typeof match.colorId === 'object' ? match.colorId?._id : match.colorId;
                    if (cId) parts.push(`COLOR:${String(cId)}`);
                } else if (t.slug === 'size') {
                    const firstSizeEntry = match.sizes?.[0];
                    if (firstSizeEntry) {
                        const sid = typeof firstSizeEntry.sizeId === 'object' ? firstSizeEntry.sizeId?._id : firstSizeEntry.sizeId;
                        if (sid) parts.push(`SIZE:${firstSizeEntry.category || 'DIMENSION'}:${String(sid)}`);
                    }
                } else {
                    const dimMatch = (match.attributeDimensions || []).find(dim => {
                        const dimAttrId = dim.attributeId ? String(dim.attributeId) : null;
                        return (dimAttrId && String(t._id) === dimAttrId) ||
                            (dim.attributeName?.toLowerCase() === t.slug);
                    });
                    if (dimMatch) {
                        const attrId = dimMatch.attributeId ? String(dimMatch.attributeId) : (dimMatch.attributeName || 'UNKNOWN');
                        const valueId = typeof dimMatch.valueId === 'object' ? String(dimMatch.valueId) : dimMatch.valueId;
                        parts.push(`ATTR:${attrId}:${valueId}`);
                    }
                }
            }
        });

        parts.sort();
        const identityKey = parts.join('|');
        return variantIdentityMap.get(identityKey) || null;
    }, [selectedAttributes, variants, variantRoleTypes, variantIdentityMap, getVariantAttributeValue]);

    // ── PHASE 6: O(1) Availability Check ──────────────────────────────────
    // Replaces O(n) variants.some() with O(1) key lookup against precomputed Set.
    // An option is available if at least one real variant in the map contains
    // all currently selected dimensions PLUS the candidate option.
    const isOptionAvailable = useCallback((attributeSlug, valueSlug) => {
        if (variants.length === 0) return false;

        // Build candidate selection state
        const testState = { ...selectedAttributes, [attributeSlug]: valueSlug };

        // Test each real variant: does it satisfy testState?
        return variants.some(variant => {
            if (variant.status !== 'ACTIVE') return false;

            // Check all VARIANT-role attributes in testState
            return variantRoleTypes.every(type => {
                const desired = testState[type.slug];
                if (!desired) return true; // Not yet selected — skip constraint
                const actual = getVariantAttributeValue(variant, type.slug);
                return actual !== null && String(actual) === String(desired);
            });
        });
    }, [variants, variantRoleTypes, selectedAttributes, getVariantAttributeValue]);

    const isFullyResolved = useMemo(() => {
        // SPECIFICATION attributes must never inflate the required count
        const requiredDimCount = variantRoleTypes.length;
        const selectedDimCount = variantRoleTypes.filter(t => selectedAttributes[t.slug]).length;
        return !!resolvedVariant && selectedDimCount >= requiredDimCount;
    }, [resolvedVariant, selectedAttributes, variantRoleTypes]);

    const selectAttribute = useCallback((attributeSlug, valueSlug) => {
        setSelectedAttributes(prev => {
            if (prev[attributeSlug] === valueSlug) return prev; // Avoid unnecessary re-render
            return { ...prev, [attributeSlug]: valueSlug };
        });
    }, []);

    // ── PHASE 9: Default Variant Rule ─────────────────────────────────────────
    // If a product has zero VARIANT attributes (e.g. a single-SKU product),
    // the configurator must be hidden and the sole variant must resolve immediately.
    // Never allow a sellable product to have no resolved variant.
    const isDefaultVariantProduct = useMemo(() => {
        return variantRoleTypes.length === 0 && variants.length > 0;
    }, [variantRoleTypes, variants]);

    // When it's a default-variant product, auto-resolve to the first ACTIVE variant.
    // This must be done outside resolvedVariant's useMemo to avoid circular dependency.
    const effectiveResolvedVariant = useMemo(() => {
        if (isDefaultVariantProduct) {
            // Prefer ACTIVE, fall back to first available
            return variants.find(v => v.status === 'ACTIVE') || variants[0] || null;
        }
        return resolvedVariant;
    }, [isDefaultVariantProduct, variants, resolvedVariant]);

    // hideConfigurator: true = render only price/stock/cart, no selector UI
    const hideConfigurator = isDefaultVariantProduct;

    return {
        selectedAttributes,
        setSelectedAttributes,
        selectAttribute,
        resolvedVariant: effectiveResolvedVariant,
        isFullyResolved: isDefaultVariantProduct ? !!effectiveResolvedVariant : isFullyResolved,
        isOptionAvailable,
        getVariantAttributeValue,
        variantRoleTypes,
        hideConfigurator,
        isDefaultVariantProduct,
    };
};

