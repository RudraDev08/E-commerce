import React from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// ─── PRICE DISPLAY ────────────────────────────────────────────────────────────
export const PriceDisplay = ({ price, currency = 'INR', originalPrice, loading, noVariantSelected }) => {
    if (loading) {
        return (
            <div className="price-shimmer">
                <div className="shimmer-bar shimmer-bar--lg" />
                <div className="shimmer-bar shimmer-bar--sm" />
            </div>
        );
    }

    // PHASE 5: Don't show ₹0 before variant is selected
    if (noVariantSelected || price === null || price === undefined) {
        return (
            <div className="price-block">
                <p className="price-placeholder">Select options to see price</p>
            </div>
        );
    }

    const fmt = (val) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(val || 0);

    const hasDiscount = originalPrice !== null && originalPrice !== undefined && Number(originalPrice) > Number(price);
    const discountPct = hasDiscount
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    return (
        <div className="price-block">
            <div className="price-row">
                <span className="price-current">{fmt(price)}</span>
                {hasDiscount && (
                    <>
                        <span className="price-original">{fmt(originalPrice)}</span>
                        <span className="price-badge">{discountPct}% off</span>
                    </>
                )}
            </div>
            {hasDiscount && (
                <p className="price-saving">
                    You save {fmt(originalPrice - price)}
                </p>
            )}
        </div>
    );
};


// ─── STOCK INDICATOR ─────────────────────────────────────────────────────────
export const StockIndicator = ({ stock, loading }) => {
    if (loading) {
        return <div className="shimmer-bar shimmer-bar--sm" style={{ marginTop: 8 }} />;
    }

    if (stock === null || stock === undefined) return null;

    if (stock === 0) {
        return (
            <div className="stock-badge stock-badge--out">
                <XCircleIcon className="stock-icon" />
                <span>Out of Stock</span>
            </div>
        );
    }

    if (stock <= 5) {
        return (
            <div className="stock-badge stock-badge--low">
                <ExclamationTriangleIcon className="stock-icon" />
                <span>Only <strong>{stock}</strong> left — order soon</span>
            </div>
        );
    }

    if (stock <= 20) {
        return (
            <div className="stock-badge stock-badge--limited">
                <CheckCircleIcon className="stock-icon" />
                <span>Limited stock available</span>
            </div>
        );
    }

    return (
        <div className="stock-badge stock-badge--in">
            <CheckCircleIcon className="stock-icon" />
            <span>In Stock</span>
        </div>
    );
};
