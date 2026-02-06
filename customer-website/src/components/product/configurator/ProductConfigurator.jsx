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
export const ProductConfigurator = ({ product, variants, onVariantChange }) => {
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

        const usedAttributeSlugs = new Set();
        const valuesMap = {}; // slug -> Map(valSlug -> valObj)

        variants.forEach(v => {
            // Handle both Array and Object structures for attributes
            const validAttrs = Array.isArray(v.attributes)
                ? v.attributes
                : Object.entries(v.attributes || {}).map(([key, val]) => ({ attributeType: key, attributeValue: val }));

            validAttrs.forEach(attr => {
                // Determine Slug
                const typeSlug = (typeof attr.attributeType === 'object') ? attr.attributeType.slug : attr.attributeType;
                const valSlug = (typeof attr.attributeValue === 'object') ? attr.attributeValue.slug : attr.attributeValue;

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

                    if (!existing || (!existingHasImage && currentHasImage)) {
                        const previewImage = currentHasImage
                            ? (typeof v.images[0] === 'string' ? v.images[0] : v.images[0].url)
                            : null;

                        const enrichedValObj = {
                            ...valObj,
                            previewImage: previewImage,
                            previewPrice: v.price,
                            compareAtPrice: v.compareAtPrice,
                            currency: v.currency // Optional
                        };
                        valuesMap[typeSlug].set(valSlug, enrichedValObj);
                    }
                }
            });
        });

        // Filter global config to only relevant ones and sort
        const relevant = attributeTypesConfig
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
        selectAttribute,
        resolvedVariant,
        isOptionAvailable
    } = useProductConfiguration(variants, relevantAttributes);

    // 4. Notify Parent
    useEffect(() => {
        onVariantChange && onVariantChange(resolvedVariant);
    }, [resolvedVariant, onVariantChange]);

    if (loadingConfig) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;
    if (relevantAttributes.length === 0) return null; // No configurable attributes

    return (
        <div className="space-y-6">
            {relevantAttributes.map(attr => (
                <AttributeGroup
                    key={attr.id || attr.slug}
                    attribute={attr}
                    values={attributeValuesMap[attr.slug] || []}
                    selectedValue={selectedAttributes[attr.slug]}
                    onSelect={(val) => selectAttribute(attr.slug, val)}
                    checkAvailability={(val) => isOptionAvailable(attr.slug, val)}
                />
            ))}
        </div>
    );
};
