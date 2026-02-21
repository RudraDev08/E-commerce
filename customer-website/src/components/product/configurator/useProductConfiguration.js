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
    if (!productGroupId || !sizeId || !colorId) return null;
    if (!subtle) return null; // Web Crypto not available (SSR / very old browser)

    const sortedAttrs = [...attributeValueIds]
        .map(id => String(id))
        .sort()
        .join('|');

    const raw = [
        String(productGroupId),
        String(sizeId),
        String(colorId),
        sortedAttrs,
    ].join(':');

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

            // Try deterministic O(1) hash path first
            if (selectedSize && selectedColor) {
                // Find the variant whose size/color match the selection to get their _ids
                const sizeVariant = variants.find(v =>
                    (v.size?.displayName || v.size?.value || v.size?.name) === selectedSize
                );
                const colorVariant = variants.find(v =>
                    (v.color?.name || v.color?.displayName) === selectedColor
                );

                const sizeId = sizeVariant?.size?._id;
                const colorId = colorVariant?.color?._id;
                const pgId = variants[0]?.productGroupId;

                // Collect attributeValueIds from other selections (non-size, non-color)
                const attrValueIds = attributeTypes
                    .filter(t => t.slug !== 'size' && t.slug !== 'color' && selectedAttributes[t.slug])
                    .map(t => {
                        // Find the attribute value _id for this slug/value
                        const v = variants.find(vr =>
                            (vr.attributes || []).some(a =>
                                (a.type || a.attributeType?.name) === t.name &&
                                a.value === selectedAttributes[t.slug]
                            )
                        );
                        if (!v) return null;
                        const matchAttr = (v.attributes || []).find(a =>
                            (a.type || a.attributeType?.name) === t.name &&
                            a.value === selectedAttributes[t.slug]
                        );
                        return matchAttr?._id || null;
                    })
                    .filter(Boolean);

                if (sizeId && colorId && pgId) {
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
