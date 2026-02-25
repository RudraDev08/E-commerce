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
 * @param {Array}  variants        - Pre-filtered ACTIVE in-stock variants
 * @param {Array}  attributeTypes  - Relevant attribute type configs
 * @param {Object} initialSelections
 */
export const useProductConfiguration = (variants = [], attributeTypes = [], initialSelections = {}) => {
    const [selectedAttributes, setSelectedAttributes] = useState(initialSelections);

    // ── 1. Build O(1) identity key → variant map ──────────────────────────────
    const variantIdentityMap = useMemo(() => {
        const map = new Map();
        variants.forEach(v => {
            const key = buildIdentityKey(v);
            if (key) map.set(key, v);
        });
        return map;
    }, [variants]);

    // ── 2. Resolved variant: synchronous deterministic lookup ────────────────
    //    Tries identity-key map first; falls back to loop-based attribute match.
    const resolvedVariant = useMemo(() => {
        if (variants.length === 0) return null;

        // Extract IDs from current selections to build an identity key
        // We need the _id of each selected dimension, not just its display label.
        const parts = [];

        // COLOR
        const selectedColor = selectedAttributes['color'];
        if (selectedColor) {
            // Find a variant whose color display label matches to get the _id
            for (const v of variants) {
                const val = getVariantAttributeValueFn(v, 'color');
                if (val && String(val) === String(selectedColor)) {
                    const cId = typeof v.colorId === 'object' ? v.colorId?._id : v.colorId;
                    if (cId) { parts.push(`COLOR:${String(cId)}`); break; }
                }
            }
        }

        // SIZE
        const selectedSize = selectedAttributes['size'];
        if (selectedSize) {
            for (const v of variants) {
                const val = getVariantAttributeValueFn(v, 'size');
                if (val && String(val) === String(selectedSize)) {
                    const firstSizeEntry = v.sizes?.[0];
                    if (firstSizeEntry) {
                        const sid = typeof firstSizeEntry.sizeId === 'object' ? firstSizeEntry.sizeId?._id : firstSizeEntry.sizeId;
                        if (sid) { parts.push(`SIZE:${firstSizeEntry.category || 'DIMENSION'}:${String(sid)}`); break; }
                    }
                }
            }
        }

        // CUSTOM ATTRIBUTES (processor, storage, material, etc.)
        attributeTypes.forEach(t => {
            if (t.slug === 'size' || t.slug === 'color') return;
            const selectedVal = selectedAttributes[t.slug];
            if (!selectedVal) return;

            // Find matching variant + dim to get the structured IDs
            for (const v of variants) {
                const dimMatch = (v.attributeDimensions || []).find(dim => {
                    const dimAttrId = dim.attributeId ? String(dim.attributeId) : null;
                    const typeIdMatch = dimAttrId && String(t._id) === dimAttrId;
                    const typeNameMatch = dim.attributeName?.toLowerCase() === t.name?.toLowerCase()
                        || dim.attributeName?.toLowerCase() === t.slug;
                    return typeIdMatch || typeNameMatch;
                });
                if (dimMatch) {
                    const attrId = dimMatch.attributeId ? String(dimMatch.attributeId) : (dimMatch.attributeName || 'UNKNOWN');
                    const valueId = typeof dimMatch.valueId === 'object' ? String(dimMatch.valueId) : dimMatch.valueId;
                    // Check if this dim's value matches user's selection
                    const attrVal = getVariantAttributeValueFn(v, t.slug);
                    if (attrVal && String(attrVal) === String(selectedVal)) {
                        parts.push(`ATTR:${attrId}:${valueId}`);
                        break;
                    }
                }
            }
        });

        parts.sort();
        const identityKey = parts.join('|');

        // Fast O(1) lookup
        if (identityKey && variantIdentityMap.has(identityKey)) {
            return variantIdentityMap.get(identityKey);
        }

        // Fallback: loop-based match on display labels (covers legacy API shapes)
        const relevantSlugs = attributeTypes.map(t => t.slug);
        const anySelected = Object.keys(selectedAttributes).some(k => relevantSlugs.includes(k) && selectedAttributes[k]);
        if (!anySelected) return null;

        const match = variants.find(variant =>
            attributeTypes.every(type => {
                const selected = selectedAttributes[type.slug];
                if (!selected) return true; // Not selected yet → don't disqualify
                const variantVal = getVariantAttributeValueFn(variant, type.slug);
                return variantVal !== null && String(variantVal) === String(selected);
            })
        );
        return match || null;
    }, [selectedAttributes, variants, attributeTypes, variantIdentityMap]);

    // ── 3. Availability matrix ─────────────────────────────────────────────────
    // An option is available if at least one ACTIVE variant WITH STOCK > 0
    // matches ALL currently-selected attributes PLUS this new attribute.
    // OOS variants (stock === 0) are deliberately excluded so the button renders
    // as disabled with reduced opacity + cursor-not-allowed (Phase 6 spec).
    // Variants with stock === null (no inventory record) are treated as available
    // because stock is unknown — the server-side gate will catch them at purchase.
    const isOptionAvailable = useCallback((attributeSlug, valueSlug) => {
        return variants.some(variant => {
            // ── Phase 6 fix: skip explicitly OOS variants from availability check ──
            // stock === 0  → explicitly out of stock → treat as unavailable
            // stock === null → unknown → treat as available (server will gate)
            // stock  >  0  → in stock → available
            const hasStock = variant.stock === null || (variant.stock ?? 0) > 0;
            if (!hasStock) return false;

            // Check all OTHER selected attributes still match
            const othersMatch = attributeTypes.every(type => {
                if (type.slug === attributeSlug) return true; // Skip the one we're testing
                const selected = selectedAttributes[type.slug];
                if (!selected) return true;
                const variantVal = getVariantAttributeValueFn(variant, type.slug);
                return variantVal !== null && String(variantVal) === String(selected);
            });
            if (!othersMatch) return false;

            // Check the target attribute matches
            const variantVal = getVariantAttributeValueFn(variant, attributeSlug);
            return variantVal !== null && String(variantVal) === String(valueSlug);
        });
    }, [variants, attributeTypes, selectedAttributes]);

    // ── 4. Select attribute ────────────────────────────────────────────────────
    const selectAttribute = useCallback((attributeSlug, valueSlug) => {
        setSelectedAttributes(prev => ({ ...prev, [attributeSlug]: valueSlug }));
    }, []);

    // ── 5. getVariantAttributeValue (stable ref) ──────────────────────────────
    const getVariantAttributeValue = useCallback(
        (variant, slug) => getVariantAttributeValueFn(variant, slug),
        []
    );

    return {
        selectedAttributes,
        setSelectedAttributes,
        selectAttribute,
        resolvedVariant,
        isOptionAvailable,
        getVariantAttributeValue,
    };
};
