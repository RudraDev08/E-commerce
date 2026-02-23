import { useState, useMemo, useEffect, useCallback } from 'react';

// Uses the browser's built-in Web Crypto API — no import needed
const subtle = globalThis.crypto?.subtle;

/**
 * generateConfigHashClient
 * Replicates Backend/utils/configHash.util.js logic in the browser.
 * Uses the Web Crypto API (SubtleCrypto) via TextEncoder + SHA-256.
 *
 * Returns a HEX string identical to the server-generated hash.
 */
async function generateConfigHashClient({ productGroupId, sizeId, colorId, attributeValueIds = [] }) {
    if (!productGroupId) return null;
    if (!subtle) return null; // Web Crypto not available (SSR / very old browser)

    const resolvedSizeIds = sizeId ? [String(sizeId)] : []; // fallback single size

    const sortedAttrs = [...attributeValueIds]
        .map(id => String(id))
        .filter(Boolean)
        .sort();

    const raw = [
        String(productGroupId),
        resolvedSizeIds.join(','),        // '' if no sizes
        colorId ? String(colorId) : '',   // '' if no color
        sortedAttrs.join('|'),            // '' if no attributes
    ].join('::');

    const encoded = new TextEncoder().encode(raw);
    const hashBuffer = await subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── LEGACY HELPERS (for backward-compat with old variant shape) ──────────────

function getVariantAttributeValueFn(variant, attributeSlug) {
    // New API shape: variant.size / variant.color / variant.attributes [{type, value}]
    if (attributeSlug === 'size' && variant.size && typeof variant.size === 'object') {
        return variant.size.displayName || variant.size.value || variant.size.name;
    }
    if (attributeSlug === 'color' && variant.color && typeof variant.color === 'object') {
        return variant.color.name || variant.color.displayName;
    }

    // Legacy: variant.attributes = { color: 'red', size: 'xl' }
    if (variant.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes)) {
        if (variant.attributes[attributeSlug]) return variant.attributes[attributeSlug];
    }

    // Legacy: variant.attributes = [{ attributeType: { slug }, attributeValue: { slug } }]
    if (Array.isArray(variant.attributes)) {
        const attr = variant.attributes.find(a =>
            a && (a.attributeType?.slug === attributeSlug || a.attributeType === attributeSlug)
        );
        if (attr) return attr.attributeValue?.slug || attr.attributeValue;
    }

    // Flat properties fallback
    if (attributeSlug === 'size' && typeof variant.size === 'string') return variant.size;
    if (attributeSlug === 'color' && typeof variant.color === 'string') return variant.color;

    return null;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * useProductConfiguration
 *
 * Enhanced with:
 *  - O(1) configHash map for instant deterministic variant resolution
 *  - Backward-compat loop-based resolver as fallback
 *  - Full availability matrix (zero extra API calls)
 */
export const useProductConfiguration = (variants = [], attributeTypes = [], initialSelections = {}) => {
    const [selectedAttributes, setSelectedAttributes] = useState(initialSelections);

    // ── 1. Build O(1) configHash map ──────────────────────────────────────────
    const variantHashMap = useMemo(() => {
        const map = {};
        variants.forEach(v => {
            if (v.configHash) map[v.configHash] = v;
        });
        return map;
    }, [variants]);

    // ── 2. Deterministic variant resolution via client hash ────────────────────
    //    Falls back to loop-based matching (legacy shapes without configHash)
    const [resolvedVariant, setResolvedVariant] = useState(null);

    useEffect(() => {
        const resolve = async () => {
            if (variants.length === 0) { setResolvedVariant(null); return; }

            // Extract relevant IDs from selection
            // The new API exposes selectors.sizes / selectors.colors / selectors.attributes.
            // selectedAttributes keys are attribute slugs or 'size'/'color'.
            const selectedSize = selectedAttributes['size'];
            const selectedColor = selectedAttributes['color'];

            // ── Extract IDs for any selected dimensions ───────────────────────
            const pgId = variants[0]?.productGroupId;
            let sizeId = null;
            let colorId = null;
            const attrValueIds = [];

            // Helper to find the _id of a selected value across all variants
            const findValueId = (slugOrValue, isSize, isColor, attrName) => {
                for (let v of variants) {
                    if (isSize && (v.size?.displayName === slugOrValue || v.size?.value === slugOrValue || v.size?.name === slugOrValue)) return v.size?._id;
                    if (isColor && (v.color?.name === slugOrValue || v.color?.displayName === slugOrValue)) return v.color?._id;
                    if (attrName) {
                        const match = (v.attributes || []).find(a => (a.type || a.attributeType?.name) === attrName && a.value === slugOrValue);
                        if (match) return match._id;
                    }
                }
                return null;
            };

            // Map size and color if they're part of the configuration
            if (selectedAttributes['size']) {
                sizeId = findValueId(selectedAttributes['size'], true, false, null);
            }
            if (selectedAttributes['color']) {
                colorId = findValueId(selectedAttributes['color'], false, true, null);
            }

            // Map custom attributes
            attributeTypes.forEach(t => {
                if (t.slug !== 'size' && t.slug !== 'color' && selectedAttributes[t.slug]) {
                    const id = findValueId(selectedAttributes[t.slug], false, false, t.name);
                    if (id) attrValueIds.push(id);
                }
            });

            // If we have a product group ID, attempt O(1) hash lookup
            if (pgId) {
                try {
                    const hash = await generateConfigHashClient({
                        productGroupId: pgId,
                        sizeId,
                        colorId,
                        attributeValueIds: attrValueIds,
                    });
                    if (hash && variantHashMap[hash]) {
                        setResolvedVariant(variantHashMap[hash]);
                        return;
                    }
                } catch (_) {
                    // Fall through to loop-based
                }
            }

            // ── Fallback: loop-based match (old shape / missing IDs) ────────
            const exactMatch = variants.find(variant =>
                attributeTypes.every(type => {
                    const selected = selectedAttributes[type.slug];
                    if (!selected) return true;
                    const variantVal = getVariantAttributeValueFn(variant, type.slug);
                    return String(variantVal) === String(selected);
                })
            );
            setResolvedVariant(exactMatch || null);
        };

        resolve();
    }, [selectedAttributes, variants, attributeTypes, variantHashMap]);

    // ── 3. Availability matrix ────────────────────────────────────────────────
    const isOptionAvailable = useCallback((attributeSlug, valueSlug) => {
        return variants.some(variant => {
            const matchesOthers = attributeTypes.every(type => {
                if (type.slug === attributeSlug) return true;
                const selected = selectedAttributes[type.slug];
                if (!selected) return true;
                const variantVal = getVariantAttributeValueFn(variant, type.slug);
                return String(variantVal) === String(selected);
            });
            if (!matchesOthers) return false;

            const variantVal = getVariantAttributeValueFn(variant, attributeSlug);
            const matchesTarget = String(variantVal) === String(valueSlug);
            const hasStock = variant.stock !== undefined ? variant.stock > 0 : true;

            return matchesTarget && hasStock;
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
