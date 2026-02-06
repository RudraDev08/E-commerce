import React, { useEffect, useState, useMemo } from 'react';
import { useProductConfiguration } from './useProductConfiguration';
import { AttributeGroup } from './AttributeGroup';
import { getAttributeTypes } from '../../../api/attributeApi';

/**
 * ProductConfigurator
 * 
 * @param {Object} product - Product Data
 * @param {Array} variants - List of Variants
 * @param {Function} onVariantChange - Callback (variant) => void
 */
export const ProductConfigurator = ({ product, variants, onVariantChange, controlledVariant }) => {
    // 1. Fetch Attribute Configurations (Input Types, Labels)
    const [attributeTypesConfig, setAttributeTypesConfig] = useState([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await getAttributeTypes();
                setAttributeTypesConfig(res.data?.data || res.data || []);
            } catch (err) {
                console.error("Failed to fetch attribute types", err);
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    // 2. Identify Relevant Attributes for THIS Product
    const { relevantAttributes, attributeValuesMap } = useMemo(() => {
        if (!variants || variants.length === 0) return { relevantAttributes: [], attributeValuesMap: {} };

        // Ensure "size" and "color" are in the allowed types if seen in data
        const workingConfig = [...attributeTypesConfig];
        // Force "Colour" spelling for color attribute
        const colorAttr = workingConfig.find(c => c.slug === 'color');
        if (colorAttr) {
            colorAttr.name = 'Colour';
            colorAttr.priority = 1; // Ensure priority
            colorAttr.inputType = 'color_swatch'; // Ensure swatch
        } else {
            workingConfig.push({ slug: 'color', name: 'Colour', inputType: 'color_swatch', priority: 1 });
        }

        if (!workingConfig.find(c => c.slug === 'size')) {
            workingConfig.push({ slug: 'size', name: 'Size', inputType: 'button_group', priority: 2 });
        }

        const usedAttributeSlugs = new Set();
        const valuesMap = {}; // slug -> Map(valSlug -> valObj)

        variants.forEach(v => {
            let validAttrs = [];

            // 1. Existing attributes logic
            if (v.attributes) {
                validAttrs = Array.isArray(v.attributes)
                    ? v.attributes
                    : Object.entries(v.attributes).map(([key, val]) => ({ attributeType: key, attributeValue: val }));
            }

            // 2. BACKFILL: Map structured Size/Color to attributes if not redundant
            if (v.size && typeof v.size === 'object') {
                // Remove existing 'size' if present to avoid duplication (trust populated field more)
                validAttrs = validAttrs.filter(a => (a.attributeType?.slug || a.attributeType) !== 'size');
                validAttrs.push({
                    attributeType: 'size',
                    attributeValue: {
                        slug: v.size.name, // Use Name as slug for simplicity if code is missing
                        value: v.size.name,
                        id: v.size._id
                    }
                });
            }

            if (v.color && typeof v.color === 'object') {
                validAttrs = validAttrs.filter(a => (a.attributeType?.slug || a.attributeType) !== 'color');
                validAttrs.push({
                    attributeType: 'color',
                    attributeValue: {
                        slug: v.color.name,
                        value: v.color.name,
                        id: v.color._id,
                        hexCode: v.color.hexCode
                    }
                });
            }

            validAttrs.forEach(attr => {
                if (!attr) return;

                // Determine Slug
                const typeSlug = (attr.attributeType && typeof attr.attributeType === 'object')
                    ? attr.attributeType.slug
                    : attr.attributeType;

                if (!typeSlug) return;

                const valSlug = (attr.attributeValue && typeof attr.attributeValue === 'object')
                    ? attr.attributeValue.slug
                    : attr.attributeValue;

                if (!valSlug) return;

                // Basic value object
                const valObj = (typeof attr.attributeValue === 'object') ? attr.attributeValue : { value: valSlug, slug: valSlug, id: valSlug };

                if (typeSlug && valSlug) {
                    usedAttributeSlugs.add(typeSlug);
                    if (!valuesMap[typeSlug]) valuesMap[typeSlug] = new Map();

                    // ENRICH_DATA: Attach preview image and price from the variant (v)
                    // We prioritize variants that have images to ensure the preview is good.
                    const existing = valuesMap[typeSlug].get(valSlug);
                    const currentHasImage = v.images && v.images.length > 0;
                    const existingHasImage = existing?.previewImage;

                    // If we have a hexCode in the variant color object, ensure it's on the value
                    if (valObj.hexCode && !existing?.hexCode) {
                        // pass
                    }

                    if (!existing || (!existingHasImage && currentHasImage)) {
                        const previewImage = currentHasImage
                            ? (typeof v.images[0] === 'string' ? v.images[0] : v.images[0].url)
                            : null;

                        const enrichedValObj = {
                            ...valObj,
                            previewImage: previewImage,
                            previewPrice: v.price,
                            compareAtPrice: v.compareAtPrice,
                            currency: v.currency, // Optional
                            hexCode: valObj.hexCode || existing?.hexCode // Preserve Hex
                        };
                        valuesMap[typeSlug].set(valSlug, enrichedValObj);
                    } else if (valObj.hexCode && !existing.hexCode) {
                        // Late update if we found hexCode elsewhere? Unlikely if structured.
                        existing.hexCode = valObj.hexCode;
                        valuesMap[typeSlug].set(valSlug, existing);
                    }
                }
            });
        });

        // Filter config to only relevant ones and sort
        const relevant = workingConfig
            .filter(t => usedAttributeSlugs.has(t.slug))
            .sort((a, b) => (a.priority || 0) - (b.priority || 0));

        // Convert Map to Array for values
        const finalValuesMap = {};
        Object.keys(valuesMap).forEach(key => {
            finalValuesMap[key] = Array.from(valuesMap[key].values());
        });

        return { relevantAttributes: relevant, attributeValuesMap: finalValuesMap };

    }, [variants, attributeTypesConfig]);

    // 3. Setup Configuration Hook
    const {
        selectedAttributes,
        setSelectedAttributes,
        selectAttribute,
        resolvedVariant,
        isOptionAvailable,
        getVariantAttributeValue
    } = useProductConfiguration(variants, relevantAttributes);

    // Sync externally selected variant (e.g. from Alternatives Badge)
    useEffect(() => {
        if (controlledVariant && controlledVariant._id !== resolvedVariant?._id) {
            const newAttrs = {};
            relevantAttributes.forEach(attr => {
                const val = getVariantAttributeValue(controlledVariant, attr.slug);
                if (val) newAttrs[attr.slug] = val;
            });
            setSelectedAttributes(newAttrs);
        }
    }, [controlledVariant, relevantAttributes, getVariantAttributeValue, resolvedVariant?._id, setSelectedAttributes]);

    // 4. Notify Parent
    useEffect(() => {
        onVariantChange && onVariantChange(resolvedVariant);
    }, [resolvedVariant, onVariantChange]);

    if (loadingConfig) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;
    if (relevantAttributes.length === 0) return null; // No configurable attributes

    return (
        <div className="space-y-6">
            {relevantAttributes.map(attr => {
                let isDisabled = false;
                let helperText = '';

                // Sequential Logic: Size depends on Colour
                if (attr.slug === 'size') {
                    const colorAttr = relevantAttributes.find(a => a.slug === 'color');
                    if (colorAttr && !selectedAttributes['color']) {
                        isDisabled = true;
                        helperText = `💡 Select ${colorAttr.name || 'Colour'} first`;
                    } else if (colorAttr && selectedAttributes['color']) {
                        // Find the human-readable name of the selected color
                        const selectedColorValue = attributeValuesMap['color']?.find(v => (v.slug || v.value) === selectedAttributes['color']);
                        if (selectedColorValue) {
                            helperText = `Select size for ${selectedColorValue.value}`;
                        }
                    }
                }

                return (
                    <AttributeGroup
                        key={attr._id || attr.slug}
                        attribute={attr}
                        values={attributeValuesMap[attr.slug] || []}
                        selectedValue={selectedAttributes[attr.slug]}
                        onSelect={(val) => selectAttribute(attr.slug, val)}
                        checkAvailability={(val) => isOptionAvailable(attr.slug, val)}
                        isDisabled={isDisabled}
                        helperText={helperText}
                    />
                );
            })}
        </div>
    );
};
