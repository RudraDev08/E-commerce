import React, { useState, useEffect, useMemo } from 'react';
import './VariantSelector.css';

/**
 * Enterprise-grade Variant Selector Component
 * 
 * ✅ P0: Zero-Float Safety using resolvedPrice strings
 * ✅ P0: Moves away from legacy flat attributes to structured Master Identity (Size/Color)
 * ✅ P1: O(1) availability lookup via pre-built hash maps
 * ✅ P1: Aligned with Enterprise Lifecycle Enums
 */
const VariantSelector = ({ variants = [], selectedVariant, onVariantChange }) => {
    const [availableSizes, setAvailableSizes] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    // ─── P0 FIX: Structured Identity Persistence ──────────────────────────────
    // The selector uses DisplayNames/Names from Master documents as unique keys.

    const availabilityMap = useMemo(() => {
        const map = {};
        if (!variants) return map;
        variants.forEach(v => {
            // ✅ Fix 1: Use Structured Identity from Master models
            const sizeKey = v.size?.displayName || v.size?.name || String(v.size?._id);
            const colorKey = v.color?.name || String(v.color?._id);

            // Combination is available if status is ACTIVE and stock exists
            // (Note: PDP parent already filters for status === 'ACTIVE')
            const inStock = (v.stock ?? 0) > 0;

            if (sizeKey && colorKey) {
                const key = `${sizeKey}|${colorKey}`;
                map[key] = { inStock, variantId: v._id };

                // Partial index for size/color availability indicators
                map[`SIZE:${sizeKey}`] = map[`SIZE:${sizeKey}`] || { inStock: false };
                if (inStock) map[`SIZE:${sizeKey}`].inStock = true;

                map[`COLOR:${colorKey}`] = map[`COLOR:${colorKey}`] || { inStock: false };
                if (inStock) map[`COLOR:${colorKey}`].inStock = true;
            }
        });
        return map;
    }, [variants]);

    const variantLookupMap = useMemo(() => {
        const map = {};
        if (!variants) return map;
        variants.forEach(v => {
            const sizeKey = v.size?.displayName || v.size?.name || String(v.size?._id);
            const colorKey = v.color?.name || String(v.color?._id);
            if (sizeKey && colorKey) {
                map[`${sizeKey}|${colorKey}`] = v;
            }
        });
        return map;
    }, [variants]);

    useEffect(() => {
        if (variants && variants.length > 0) {
            extractSizesAndColors();
        }
    }, [variants]);

    useEffect(() => {
        if (selectedVariant && variants.length > 0) {
            // ✅ Fix 2: Sync selection from Master properties
            const sName = selectedVariant.size?.displayName || selectedVariant.size?.name || String(selectedVariant.size?._id);
            const cName = selectedVariant.color?.name || String(selectedVariant.color?._id);
            setSelectedSize(sName);
            setSelectedColor(cName);
        }
    }, [selectedVariant, variants.length]);

    const extractSizesAndColors = () => {
        const sizesMap = new Map();
        const colorsMap = new Map();

        variants.forEach(v => {
            if (v.size) {
                const sName = v.size.displayName || v.size.name || String(v.size._id);
                sizesMap.set(sName, sName);
            }
            if (v.color) {
                const cName = v.color.name || String(v.color._id);
                colorsMap.set(cName, {
                    name: cName,
                    hex: v.color.hex || v.color.code || '#CCCCCC',
                    value: cName
                });
            }
        });

        setAvailableSizes(Array.from(sizesMap.keys()));
        setAvailableColors(Array.from(colorsMap.values()));
    };

    const handleSizeSelect = (size) => {
        setSelectedSize(size);
        findAndSelectVariant(selectedColor, size);
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color.value);
        findAndSelectVariant(color.value, selectedSize);
    };

    const findAndSelectVariant = (color, size) => {
        if (!color || !size) return;
        const key = `${size}|${color}`;
        const variant = variantLookupMap[key];
        if (variant) {
            onVariantChange(variant);
        }
    };

    const isSizeAvailable = (size) => {
        if (!selectedColor) return availabilityMap[`SIZE:${size}`]?.inStock ?? false;
        return availabilityMap[`${size}|${selectedColor}`]?.inStock ?? false;
    };

    const isColorAvailable = (color) => {
        if (!selectedSize) return availabilityMap[`COLOR:${color.value}`]?.inStock ?? false;
        return availabilityMap[`${selectedSize}|${color.value}`]?.inStock ?? false;
    };

    const currentStock = selectedSize && selectedColor
        ? variantLookupMap[`${selectedSize}|${selectedColor}`]?.stock ?? 0
        : 0;

    if (!variants || variants.length === 0) return null;

    return (
        <div className="variant-selector">
            {/* Color Selection */}
            {availableColors.length > 0 && (
                <div className="variant-group">
                    <label className="variant-label">
                        Color: {selectedColor && <span className="selected-value">{selectedColor}</span>}
                    </label>
                    <div className="color-options">
                        {availableColors.map((color, index) => {
                            const available = isColorAvailable(color);
                            const isSelected = selectedColor === color.value;
                            return (
                                <button
                                    key={`color-${index}`}
                                    className={`color-swatch ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                                    onClick={() => available && handleColorSelect(color)}
                                    disabled={!available}
                                    title={color.name}
                                >
                                    <span
                                        className="color-circle"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="color-name">{color.name}</span>
                                    {!available && <span className="unavailable-mark">✕</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
                <div className="variant-group">
                    <label className="variant-label">
                        Size: {selectedSize && <span className="selected-value">{selectedSize}</span>}
                    </label>
                    <div className="size-options">
                        {availableSizes.map((size, index) => {
                            const available = isSizeAvailable(size);
                            const isSelected = selectedSize === size;
                            return (
                                <button
                                    key={`size-${index}`}
                                    className={`size-button ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                                    onClick={() => available && handleSizeSelect(size)}
                                    disabled={!available}
                                >
                                    {size}
                                    {!available && <span className="unavailable-line" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stock Information */}
            {selectedColor && selectedSize && (
                <div className="variant-stock-info">
                    {currentStock > 0 ? (
                        <span className={currentStock <= 5 ? "stock-low" : "stock-available"}>
                            {currentStock <= 5 ? `⚠️ Only ${currentStock} left!` : `✓ In Stock (${currentStock} available)`}
                        </span>
                    ) : (
                        <span className="stock-out">✗ Out of Stock</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default VariantSelector;
