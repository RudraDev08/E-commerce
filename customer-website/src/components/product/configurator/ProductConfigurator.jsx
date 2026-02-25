import React, { useEffect, useState, useMemo } from 'react';
import { useProductConfiguration } from './useProductConfiguration';
import { AttributeGroup } from './AttributeGroup';
import { getAttributeTypes } from '../../../api/attributeApi';

/**
 * ProductConfigurator — Hardened variant engine.
 *
 * PHASE 3: Attribute display logic
 *   - Reads populated attributeValueIds objects (preferred: attr.attributeType.displayName + attr.displayName)
 *   - Falls back to attributeDimensions for dimension metadata
 *   - Falls back to global attribute master lookup as last resort
 *   - Groups attributes by Attribute Type, sorted by priority
 *
 * Receives only ACTIVE in-stock variants from the parent (Phase 1 filter applied upstream).
 *
 * @param {Object} product             - Product data
 * @param {Array}  variants            - Pre-filtered ACTIVE + in-stock variants
 * @param {Function} onVariantChange   - Callback (variant | null) => void
 * @param {Object}  controlledVariant  - Externally selected variant (alternatives badge)
 */
export const ProductConfigurator = ({ product, variants, onVariantChange, controlledVariant }) => {
    const [attributeTypesConfig, setAttributeTypesConfig] = useState([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    // Fetch global attribute type configs (for inputType / priority / displayName)
    useEffect(() => {
        let cancelled = false;
        const fetchConfig = async () => {
            try {
                const res = await getAttributeTypes();
                if (!cancelled) {
                    setAttributeTypesConfig(res?.data?.data ?? res?.data ?? []);
                }
            } catch (err) {
                if (!cancelled) console.error('[ProductConfigurator] Failed to fetch attribute types', err);
            } finally {
                if (!cancelled) setLoadingConfig(false);
            }
        };
        fetchConfig();
        return () => { cancelled = true; };
    }, []);

    // ─── PHASE 3: Build relevantAttributes + attributeValuesMap ─────────────────
    // Logic:
    //   1. For each variant, extract dimensions (color, size, custom attrs)
    //   2. If attributeValueIds are populated objects → use attr.attributeType.displayName + attr.displayName
    //   3. If attributeDimensions exist → use dim.attributeName as type, resolve value from populated obj
    //   4. Always backfill color + size from top-level variant fields
    //   5. De-duplicate values per type using a Map keyed by display label
    const { relevantAttributes, attributeValuesMap } = useMemo(() => {
        if (!variants || variants.length === 0) {
            return { relevantAttributes: [], attributeValuesMap: {} };
        }

        // Build a lookup map from the global attribute type config
        const typeConfigBySlug = {};
        const typeConfigById = {};
        const workingConfig = [...attributeTypesConfig];

        // Ensure color and size have sensible defaults if not returned from API
        if (!workingConfig.find(c => c.slug === 'color')) {
            workingConfig.push({ _id: 'color', slug: 'color', name: 'Colour', inputType: 'color_swatch', priority: 1 });
        }
        if (!workingConfig.find(c => c.slug === 'size')) {
            workingConfig.push({ _id: 'size', slug: 'size', name: 'Size', inputType: 'button_group', priority: 2 });
        }

        workingConfig.forEach(t => {
            if (t.slug) typeConfigBySlug[t.slug] = t;
            if (t._id) typeConfigById[String(t._id)] = t;
        });

        // usedTypes: slug → { config object } — collects which types actually appear in data
        const usedTypes = {};
        // valuesMap: typeSlug → Map<displayLabel, valueObj>
        const valuesMap = {};

        const ensureType = (slug, fallbackName, fallbackInputType = 'button_group', fallbackPriority = 99) => {
            if (!usedTypes[slug]) {
                usedTypes[slug] = typeConfigBySlug[slug] || {
                    _id: slug,
                    slug,
                    name: fallbackName || slug,
                    inputType: fallbackInputType,
                    priority: fallbackPriority
                };
            }
            if (!valuesMap[slug]) valuesMap[slug] = new Map();
        };

        const addValue = (typeSlug, valueObj) => {
            // valueObj must have: { id, slug, value, ... optional hexCode, previewImage }
            if (!valueObj?.value && !valueObj?.slug) return;
            const key = valueObj.slug || valueObj.value;
            if (!valuesMap[typeSlug].has(key)) {
                valuesMap[typeSlug].set(key, valueObj);
            } else {
                // Enrich existing entry if we get new data (e.g. hexCode from a later variant)
                const existing = valuesMap[typeSlug].get(key);
                if (valueObj.hexCode && !existing.hexCode) existing.hexCode = valueObj.hexCode;
                if (valueObj.previewImage && !existing.previewImage) existing.previewImage = valueObj.previewImage;
            }
        };

        variants.forEach(v => {

            // ── A: Color from top-level colorId (populated object preferred) ──────
            const colorData = (v.colorId && typeof v.colorId === 'object' && v.colorId._id)
                ? v.colorId
                : (v.color && typeof v.color === 'object' ? v.color : null);

            if (colorData) {
                const typeConfig = typeConfigBySlug['color'];
                ensureType('color', 'Colour', 'color_swatch', 1);
                addValue('color', {
                    id: String(colorData._id),
                    slug: colorData.name || colorData.displayName || String(colorData._id),
                    value: colorData.displayName || colorData.name || 'Unknown',
                    hexCode: colorData.hexCode || null,
                    previewImage: v.imageGallery?.[0]?.url || null,
                });
            }

            // ── B: Size from sizes[] array (enterprise schema) ───────────────────
            if (Array.isArray(v.sizes) && v.sizes.length > 0) {
                v.sizes.forEach(sizeEntry => {
                    const sizeData = (sizeEntry.sizeId && typeof sizeEntry.sizeId === 'object')
                        ? sizeEntry.sizeId
                        : null;
                    if (!sizeData) return;
                    ensureType('size', 'Size', 'button_group', 2);
                    addValue('size', {
                        id: String(sizeData._id),
                        slug: sizeData.displayName || sizeData.value || sizeData.name || String(sizeData._id),
                        value: sizeData.displayName || sizeData.value || sizeData.name || '—',
                    });
                });
            }

            // ── C: Custom attribute dimensions ───────────────────────────────────
            // Priority 1: populated attributeValueIds objects
            //   → attr.attributeType.displayName (type label)
            //   → attr.displayName || attr.name (value label)
            if (Array.isArray(v.attributeValueIds) && v.attributeValueIds.length > 0) {
                v.attributeValueIds.forEach(attr => {
                    if (!attr || typeof attr !== 'object' || !attr._id) return; // skip unpopulated IDs
                    const attrType = attr.attributeType; // populated AttributeType sub-doc
                    if (!attrType) return;

                    if (attr.role === 'SPECIFICATION') return;

                    const typeSlug = attrType.slug || attrType.name?.toLowerCase().replace(/\s+/g, '_') || String(attrType._id);
                    const typeName = attrType.displayName || attrType.name || typeSlug;
                    const typeInputType = typeConfigById[String(attrType._id)]?.inputType || 'button_group';
                    const typePriority = typeConfigById[String(attrType._id)]?.priority || 10;

                    ensureType(typeSlug, typeName, typeInputType, typePriority);
                    // Overwrite name/inputType if we have richer data now
                    if (usedTypes[typeSlug].name === typeSlug) usedTypes[typeSlug].name = typeName;

                    addValue(typeSlug, {
                        id: String(attr._id),
                        slug: attr.displayName || attr.name || attr.code || String(attr._id),
                        value: attr.displayName || attr.name || attr.code || '—',
                        code: attr.code,
                    });
                });
            }

            // Priority 2: attributeDimensions (structured metadata fallback)
            //   Used when attributeValueIds are plain ObjectIds (unpopulated)
            else if (Array.isArray(v.attributeDimensions) && v.attributeDimensions.length > 0) {
                v.attributeDimensions.forEach(dim => {
                    if (!dim?.valueId) return;
                    const typeSlug = dim.attributeName?.toLowerCase().replace(/\s+/g, '_') || 'attr_unknown';
                    const typeName = dim.attributeName || typeSlug;
                    ensureType(typeSlug, typeName, 'button_group', 10);

                    const valueId = typeof dim.valueId === 'object' ? String(dim.valueId) : dim.valueId;
                    addValue(typeSlug, {
                        id: valueId,
                        slug: valueId, // No display label available — show raw id as fallback
                        value: valueId,
                    });
                });
            }
        });

        // Convert Maps to sorted Arrays
        const finalValuesMap = {};
        Object.keys(valuesMap).forEach(slug => {
            finalValuesMap[slug] = Array.from(valuesMap[slug].values());
        });

        // Build sorted relevant attribute type list
        const relevant = Object.values(usedTypes)
            .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

        return { relevantAttributes: relevant, attributeValuesMap: finalValuesMap };
    }, [variants, attributeTypesConfig]);

    // ── Setup Configuration Hook ──────────────────────────────────────────────
    const {
        selectedAttributes,
        setSelectedAttributes,
        selectAttribute,
        resolvedVariant,
        isOptionAvailable,
        getVariantAttributeValue,
    } = useProductConfiguration(variants, relevantAttributes);

    // Sync externally controlled variant (e.g. from Alternatives badge)
    const lastSyncedId = React.useRef(null);
    useEffect(() => {
        if (controlledVariant && controlledVariant._id !== lastSyncedId.current) {
            lastSyncedId.current = controlledVariant._id;
            const newAttrs = {};
            relevantAttributes.forEach(attr => {
                const val = getVariantAttributeValue(controlledVariant, attr.slug);
                if (val) newAttrs[attr.slug] = val;
            });
            setSelectedAttributes(newAttrs);
        }
    }, [controlledVariant, relevantAttributes, getVariantAttributeValue, setSelectedAttributes]);

    // Notify parent when resolved variant changes
    useEffect(() => {
        onVariantChange?.(resolvedVariant);
    }, [resolvedVariant, onVariantChange]);

    if (loadingConfig) {
        return <div className="animate-pulse h-20 bg-gray-100 rounded" aria-label="Loading options…" />;
    }

    if (relevantAttributes.length === 0) {
        return (
            <div className="text-sm text-slate-400 italic py-4">
                No configurable options for this product.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {relevantAttributes.map(attr => (
                <AttributeGroup
                    key={attr._id || attr.slug}
                    attribute={attr}
                    values={attributeValuesMap[attr.slug] || []}
                    selectedValue={selectedAttributes[attr.slug]}
                    onSelect={(val) => selectAttribute(attr.slug, val)}
                    checkAvailability={(val) => isOptionAvailable(attr.slug, val)}
                    isDisabled={false}
                    helperText=""
                />
            ))}
        </div>
    );
};
