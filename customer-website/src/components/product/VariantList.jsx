import React from 'react';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import './VariantList.css';

/**
 * VariantList Component - Amazon Style
 * Displays ALL variants horizontally with images and prices
 * Shows: Image, Attributes (Color, Storage), Price
 */
const VariantList = ({ variants, selectedVariant, onVariantSelect, productName }) => {
    if (!variants || variants.length === 0) {
        return null;
    }

    // Group variants by primary attribute (e.g., Color)
    const getPrimaryAttribute = (variant) => {
        const attrs = variant.attributes || {};
        return attrs.color || attrs.storage || attrs.size || Object.values(attrs)[0] || 'Default';
    };

    const getSecondaryAttribute = (variant) => {
        const attrs = variant.attributes || {};
        // Return the attribute that's NOT the primary one
        if (attrs.storage && attrs.color) return attrs.storage;
        if (attrs.size && attrs.color) return attrs.size;
        if (attrs.ram && (attrs.color || attrs.storage)) return attrs.ram;
        return Object.values(attrs)[1] || '';
    };

    return (
        <div className="variant-list-amazon">
            {/* Color/Primary Attribute Selector */}
            <div className="variant-section">
                <h4 className="variant-section-title">
                    Colour: <span className="selected-value">{getPrimaryAttribute(selectedVariant || variants[0])}</span>
                </h4>

                <div className="variant-options-scroll">
                    {variants.map((variant) => {
                        const isSelected = selectedVariant?._id === variant._id;
                        const isOutOfStock = variant.stock === 0;
                        const primaryAttr = getPrimaryAttribute(variant);
                        const secondaryAttr = getSecondaryAttribute(variant);

                        return (
                            <button
                                key={variant._id}
                                className={`variant-option-card ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                                onClick={() => !isOutOfStock && onVariantSelect(variant)}
                                disabled={isOutOfStock}
                            >
                                {/* Variant Image */}
                                <div className="variant-image-container">
                                    <img
                                        src={getImageUrl(variant.image || variant.images?.[0])}
                                        alt={`${productName} - ${primaryAttr}`}
                                        className="variant-image"
                                        onError={(e) => {
                                            e.target.src = 'https://placehold.co/100x100?text=No+Image';
                                        }}
                                    />
                                    {isOutOfStock && (
                                        <div className="out-of-stock-overlay">
                                            Out of Stock
                                        </div>
                                    )}
                                </div>

                                {/* Variant Info */}
                                <div className="variant-info">
                                    <div className="variant-price">
                                        {formatCurrency(variant.price)}
                                    </div>
                                    {secondaryAttr && (
                                        <div className="variant-attribute">
                                            {secondaryAttr}
                                        </div>
                                    )}
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="selected-indicator">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Variant Details */}
            {selectedVariant && (
                <div className="selected-variant-details">
                    <div className="detail-row">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value price">{formatCurrency(selectedVariant.price)}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Stock:</span>
                        {selectedVariant.stock > 10 ? (
                            <span className="detail-value in-stock">✓ In Stock</span>
                        ) : selectedVariant.stock > 0 ? (
                            <span className="detail-value low-stock">Only {selectedVariant.stock} left</span>
                        ) : (
                            <span className="detail-value out-of-stock">Out of Stock</span>
                        )}
                    </div>
                    {selectedVariant.sku && (
                        <div className="detail-row">
                            <span className="detail-label">SKU:</span>
                            <code className="detail-value sku">{selectedVariant.sku}</code>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VariantList;
