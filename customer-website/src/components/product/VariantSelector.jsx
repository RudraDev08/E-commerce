import React, { useState, useEffect } from 'react';
import { getSizes, getColors } from '../../api/variantApi';
import './VariantSelector.css';

/**
 * Enhanced Variant Selector Component
 * Displays Size and Color selection separately
 * Shows stock availability for each combination
 */
const VariantSelector = ({ variants, selectedVariant, onVariantChange }) => {
    const [availableSizes, setAvailableSizes] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    useEffect(() => {
        if (variants && variants.length > 0) {
            extractSizesAndColors();
        }
    }, [variants]);

    useEffect(() => {
        // Auto-select first available variant
        if (selectedVariant && variants.length > 0) {
            const variant = variants.find(v => v._id === selectedVariant._id);
            if (variant?.attributes) {
                setSelectedSize(variant.attributes.size);
                setSelectedColor(variant.attributes.color);
            }
        }
    }, [selectedVariant]);

    const extractSizesAndColors = () => {
        // Extract unique sizes and colors from variants
        const sizesSet = new Set();
        const colorsMap = new Map();

        variants.forEach(variant => {
            if (variant.attributes) {
                if (variant.attributes.size) {
                    sizesSet.add(variant.attributes.size);
                }
                if (variant.attributes.color) {
                    // Store color with its name and hex code
                    colorsMap.set(variant.attributes.color, {
                        name: variant.attributes.colorName || variant.attributes.color,
                        hex: variant.attributes.colorHex || variant.attributes.color,
                        value: variant.attributes.color
                    });
                }
            }
        });

        setAvailableSizes(Array.from(sizesSet));
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

        const variant = variants.find(v =>
            v.attributes?.color === color &&
            v.attributes?.size === size
        );

        if (variant) {
            onVariantChange(variant);
        }
    };

    const isSizeAvailable = (size) => {
        if (!selectedColor) {
            // If no color selected, check if size exists in any variant with stock
            return variants.some(v =>
                v.attributes?.size === size && v.stock > 0
            );
        }
        // Check if this size is available for selected color
        const variant = variants.find(v =>
            v.attributes?.color === selectedColor &&
            v.attributes?.size === size
        );
        return variant && variant.stock > 0;
    };

    const isColorAvailable = (color) => {
        if (!selectedSize) {
            // If no size selected, check if color exists in any variant with stock
            return variants.some(v =>
                v.attributes?.color === color.value && v.stock > 0
            );
        }
        // Check if this color is available for selected size
        const variant = variants.find(v =>
            v.attributes?.color === color.value &&
            v.attributes?.size === selectedSize
        );
        return variant && variant.stock > 0;
    };

    const getStockForCombination = () => {
        if (!selectedColor || !selectedSize) return null;

        const variant = variants.find(v =>
            v.attributes?.color === selectedColor &&
            v.attributes?.size === selectedSize
        );

        return variant?.stock || 0;
    };

    if (!variants || variants.length === 0) {
        return null;
    }

    const currentStock = getStockForCombination();

    return (
        <div className="variant-selector">
            {/* Color Selection */}
            {availableColors.length > 0 && (
                <div className="variant-group">
                    <label className="variant-label">
                        Color: {selectedColor && (
                            <span className="selected-value">
                                {availableColors.find(c => c.value === selectedColor)?.name}
                            </span>
                        )}
                    </label>
                    <div className="color-options">
                        {availableColors.map((color, index) => {
                            const available = isColorAvailable(color);
                            const isSelected = selectedColor === color.value;

                            return (
                                <button
                                    key={index}
                                    className={`color-swatch ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                                    onClick={() => available && handleColorSelect(color)}
                                    disabled={!available}
                                    title={color.name}
                                    aria-label={`Select ${color.name}`}
                                >
                                    <span
                                        className="color-circle"
                                        style={{
                                            backgroundColor: color.hex,
                                            border: color.hex.toLowerCase() === '#ffffff' || color.hex.toLowerCase() === 'white'
                                                ? '1px solid #ddd'
                                                : 'none'
                                        }}
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
                        Size: {selectedSize && (
                            <span className="selected-value">{selectedSize}</span>
                        )}
                    </label>
                    <div className="size-options">
                        {availableSizes.map((size, index) => {
                            const available = isSizeAvailable(size);
                            const isSelected = selectedSize === size;

                            return (
                                <button
                                    key={index}
                                    className={`size-button ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                                    onClick={() => available && handleSizeSelect(size)}
                                    disabled={!available}
                                    aria-label={`Select size ${size}`}
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
                        currentStock <= 10 ? (
                            <span className="stock-low">
                                ⚠️ Only {currentStock} left in stock!
                            </span>
                        ) : (
                            <span className="stock-available">
                                ✓ In Stock ({currentStock} available)
                            </span>
                        )
                    ) : (
                        <span className="stock-out">
                            ✗ Out of Stock
                        </span>
                    )}
                </div>
            )}

            {/* Selection Prompt */}
            {(!selectedColor || !selectedSize) && (
                <div className="selection-prompt">
                    Please select {!selectedColor && !selectedSize ? 'color and size' : !selectedColor ? 'a color' : 'a size'}
                </div>
            )}
        </div>
    );
};

export default VariantSelector;
