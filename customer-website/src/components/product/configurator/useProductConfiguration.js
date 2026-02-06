import { useState, useMemo, useEffect, useCallback } from 'react';

/**
 * useProductConfiguration Hook
 * Manages state for dynamic attribute selection and variant resolution.
 * 
 * @param {Array} variants - List of available variants
 * @param {Array} attributeTypes - List of attribute definitions
 * @param {Object} initialSelections - (Optional) Initial state
 */
export const useProductConfiguration = (variants = [], attributeTypes = [], initialSelections = {}) => {
    // State: { [attributeSlug]: valueId }
    const [selectedAttributes, setSelectedAttributes] = useState(initialSelections);

    // Initial Auto-Select Logic
    useEffect(() => {
        if (variants.length > 0 && Object.keys(selectedAttributes).length === 0) {
            // Option 1: Select the first variant's attributes
            // const firstVariant = variants[0];
            // setSelectedAttributes(firstVariant.attributes);
        }
    }, [variants]);

    /**
     * Helper: Normalize variant attributes for comparison
     * Handles both Map-like objects and backend Array structures if needed
     */
    const getVariantAttributeValue = useCallback((variant, attributeSlug) => {
        // Handle "contract" shape: variant.attributes = { color: 'red', size: 'xl' }
        if (variant.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes)) {
            return variant.attributes[attributeSlug];
        }

        // Handle "backend" shape: variant.attributes = [{ attributeType: { slug: 'color' }, attributeValue: { slug: 'red' } }]
        if (Array.isArray(variant.attributes)) {
            const attr = variant.attributes.find(a =>
                (a.attributeType?.slug === attributeSlug) ||
                (a.attributeType === attributeSlug) // fallback if just ID
            );
            return attr?.attributeValue?.slug || attr?.attributeValue;
        }

        return null;
    }, []);

    /**
     * Resolve the best matching variant based on current selections
     */
    const resolvedVariant = useMemo(() => {
        if (variants.length === 0) return null;

        // Find exact match
        const exactMatch = variants.find(variant => {
            return attributeTypes.every(type => {
                const selectedVal = selectedAttributes[type.slug];
                const variantVal = getVariantAttributeValue(variant, type.slug);

                // If attribute is optional/not-selected, decide if we require it or not.
                // Usually for precise variant match, we need all required attributes.
                if (!selectedVal && type.isRequired) return false;
                if (!selectedVal) return true; // Loose match if not selected? No, safer to be strict.

                return String(variantVal) === String(selectedVal);
            });
        });

        return exactMatch || null;
    }, [variants, attributeTypes, selectedAttributes, getVariantAttributeValue]);


    /**
     * Check if an option is available given CURRENT selections of OTHER attributes
     * (Matrix validation)
     */
    const isOptionAvailable = useCallback((attributeSlug, valueSlug) => {
        // Create a test selection with this new value
        const testSelection = { ...selectedAttributes, [attributeSlug]: valueSlug };

        // Check if ANY variant matches this potential combination
        // We only check against attributes that represent a "path" so far.
        // Actually, for a robust matrix, we want to know: "If I pick Color=Red, is Size=XL available?"
        // irrespective of other currently unselected things. But if logic is sequential, it matters.
        // Standard E-commerce logic: 
        // 1. Filter variants that match ALL *other* selected attributes.
        // 2. See if *any* of those remaining variants has this value for target attribute.

        return variants.some(variant => {
            // Check all OTHER selected attributes match
            const matchesOtherSelections = attributeTypes.every(type => {
                if (type.slug === attributeSlug) return true; // Skip the one we are testing

                const selectedVal = selectedAttributes[type.slug];
                if (!selectedVal) return true; // If user hasn't picked this yet, it's a "wildcard"

                const variantVal = getVariantAttributeValue(variant, type.slug);
                return String(variantVal) === String(selectedVal);
            });

            if (!matchesOtherSelections) return false;

            // Check if this variant has the TARGET value
            const variantVal = getVariantAttributeValue(variant, attributeSlug);
            return String(variantVal) === String(valueSlug);
        });
    }, [variants, attributeTypes, selectedAttributes, getVariantAttributeValue]);


    const selectAttribute = useCallback((attributeSlug, valueSlug) => {
        setSelectedAttributes(prev => {
            const next = { ...prev, [attributeSlug]: valueSlug };

            // Advanced: If new selection makes another attribute invalid, reset the invalid one?
            // E.g. Color=Red selected. Size=XL previously selected. If Red & XL doesn't exist, should we clear Size?
            // "Invalid combinations are disabled, not removed" - implies we might allow the state but show it as invalid?
            // Or better: keep it but `resolvedVariant` becomes null, indicating "Unavailable".

            return next;
        });
    }, []);

    return {
        selectedAttributes,
        selectAttribute,
        resolvedVariant,
        isOptionAvailable,
        getVariantAttributeValue
    };
};
