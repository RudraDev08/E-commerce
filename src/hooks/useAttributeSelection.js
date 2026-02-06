import { useState, useEffect, useMemo } from 'react';

/**
 * Hook to manage Unified Attribute Selection
 * Handles auto-selection, validation, and price calculation
 */
export const useAttributeSelection = (variants = [], attributeTypes = []) => {
    const [selectedAttributes, setSelectedAttributes] = useState({});

    // 1. Auto-select first valid combination on load
    useEffect(() => {
        if (variants.length > 0 && Object.keys(selectedAttributes).length === 0) {
            const defaultVariant = variants.find(v => v.isDefault) || variants[0];

            const initialSelection = {};
            defaultVariant.attributes.forEach(attr => {
                initialSelection[attr.attributeType] = attr.attributeValue; // assuming IDs
            });

            setSelectedAttributes(initialSelection);
        }
    }, [variants]);

    // 2. Determine Valid Values for each attribute based on current selection
    // (Complex logic: Filter variants matching CURRENT selection excluding self)
    const getValidValues = (attributeTypeId) => {
        // Simple strategy: valid if there exists ANY combination with current other selections
        // + this value.

        // Filter variants that match ALL selected attributes EXCEPT the target one
        const potentialVariants = variants.filter(v => {
            return v.attributes.every(attr => {
                if (attr.attributeType === attributeTypeId) return true; // Ignore target
                const currentVal = selectedAttributes[attr.attributeType];
                return !currentVal || attr.attributeValue === currentVal;
            });
        });

        // Extract value IDs for the target attribute from these variants
        const validIds = new Set();
        potentialVariants.forEach(v => {
            const attr = v.attributes.find(a => a.attributeType === attributeTypeId);
            if (attr) validIds.add(attr.attributeValue);
        });

        return Array.from(validIds);
    };

    // 3. Handle Selection
    const handleSelect = (attributeTypeId, valueId) => {
        const newSelection = { ...selectedAttributes, [attributeTypeId]: valueId };

        // Check if full combination is valid
        // If invalid, try to find a valid variant that matches this new selection preference
        // (Smart Auto-Correction)
        const matchingVariant = variants.find(v =>
            v.attributes.every(attr => newSelection[attr.attributeType] === attr.attributeValue)
        );

        if (matchingVariant) {
            setSelectedAttributes(newSelection);
        } else {
            // Find NEAREST valid variant to update other selections if needed
            const bestVariant = variants.find(v => {
                const targetAttr = v.attributes.find(a => a.attributeType === attributeTypeId);
                return targetAttr && targetAttr.attributeValue === valueId;
            });

            if (bestVariant) {
                // Switch to this variant's config
                const autoCorrected = {};
                bestVariant.attributes.forEach(attr => {
                    autoCorrected[attr.attributeType] = attr.attributeValue;
                });
                setSelectedAttributes(autoCorrected);
            } else {
                // Should not happen if UI disables invalid options, but fallback:
                setSelectedAttributes(newSelection);
            }
        }
    };

    // 4. Get Current Variant
    const selectedVariant = useMemo(() => {
        return variants.find(v =>
            v.attributes.every(attr => selectedAttributes[attr.attributeType] === attr.attributeValue)
        ) || null;
    }, [variants, selectedAttributes]);

    return {
        selectedAttributes,
        selectedVariant,
        handleSelect,
        getValidValues
    };
};
