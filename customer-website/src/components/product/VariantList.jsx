import React, { useMemo } from 'react';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import './VariantList.css';

/**
 * VariantList Component - Matrix Style (Color x Size)
 * 
 * Implements strict architecture:
 * - Color Selector
 * - Size Selector (Combined RAM/Storage)
 * - NO Stock Display (Inventory check on Add to Cart)
 * - Uses variant.color and variant.size (populated)
 */
const VariantList = ({ variants, selectedVariant, onVariantSelect, productName }) => {
    if (!variants || variants.length === 0) {
        return null;
    }

    // 1. Extract Unique Colors
    const colors = useMemo(() => {
        const unique = new Map();
        variants.forEach(v => {
            if (v.color) {
                unique.set(v.color._id || v.color, v.color);
            }
        });
        return Array.from(unique.values());
    }, [variants]);

    // 2. Extract Unique Sizes
    const sizes = useMemo(() => {
        const unique = new Map();
        variants.forEach(v => {
            if (v.size) {
                unique.set(v.size._id || v.size, v.size);
            }
        });
        return Array.from(unique.values());
    }, [variants]);

    // 3. Helpers to find matches
    const getVariant = (colorId, sizeId) => {
        return variants.find(v =>
            (v.color._id === colorId || v.color === colorId) &&
            (v.size._id === sizeId || v.size === sizeId)
        );
    };

    const handleColorClick = (color) => {
        // Find best size match for this color (keep current size if possible)
        const currentSizeId = selectedVariant?.size?._id || selectedVariant?.size;
        let target = getVariant(color._id, currentSizeId);

        // If not available in current size, pick first available size for this color
        if (!target) {
            target = variants.find(v => v.color._id === color._id || v.color === color._id);
        }

        if (target) onVariantSelect(target);
    };

    const handleSizeClick = (size) => {
        // Find best color match for this size (keep current color)
        const currentColorId = selectedVariant?.color?._id || selectedVariant?.color;
        let target = getVariant(currentColorId, size._id);

        // If not available in current color, pick first available
        if (!target) {
            target = variants.find(v => v.size._id === size._id || v.size === size._id);
        }

        if (target) onVariantSelect(target);
    };

    if (colors.length === 0 && sizes.length === 0) return null;

    return (
        <div className="variant-list-matrix space-y-6">

            {/* COLOR SELECTOR */}
            {colors.length > 0 && (
                <div className="variant-section">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="text-slate-500">Color:</span>
                        <span className="text-slate-900">{selectedVariant?.color?.name || 'Select'}</span>
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        {colors.map(color => {
                            const isSelected = (selectedVariant?.color?._id || selectedVariant?.color) === color._id;
                            // Check if color has ANY valid variants
                            const hasVariants = variants.some(v => v.color._id === color._id || v.color === color._id);

                            if (!hasVariants) return null;

                            return (
                                <button
                                    key={color._id}
                                    onClick={() => handleColorClick(color)}
                                    className={`
                                        group relative p-1 rounded-full border-2 transition-all
                                        ${isSelected
                                            ? 'border-indigo-600 ring-2 ring-indigo-100'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }
                                    `}
                                    title={color.name}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full shadow-sm"
                                        style={{ backgroundColor: color.hexCode || '#ccc' }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SIZE SELECTOR */}
            {sizes.length > 0 && (
                <div className="variant-section">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="text-slate-500">Configuration:</span>
                        <span className="text-slate-900">{selectedVariant?.size?.name || 'Select'}</span>
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        {sizes.map(size => {
                            const isSelected = (selectedVariant?.size?._id || selectedVariant?.size) === size._id;
                            // Check compatibility with selected color
                            const currentColorId = selectedVariant?.color?._id || selectedVariant?.color;
                            const isAvailableForColor = getVariant(currentColorId, size._id);

                            // Check if size exists at all
                            const exists = variants.some(v => v.size._id === size._id || v.size === size._id);
                            if (!exists) return null;

                            return (
                                <button
                                    key={size._id}
                                    onClick={() => handleSizeClick(size)}
                                    className={`
                                        px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all
                                        ${isSelected
                                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                            : !isAvailableForColor
                                                ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60 dashed-border'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                        }
                                    `}
                                    disabled={!isAvailableForColor}
                                    title={!isAvailableForColor ? `Not available in ${selectedVariant?.color?.name}` : size.name}
                                >
                                    {size.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{`
                .dashed-border { border-style: dashed; }
            `}</style>
        </div>
    );
};

export default VariantList;
