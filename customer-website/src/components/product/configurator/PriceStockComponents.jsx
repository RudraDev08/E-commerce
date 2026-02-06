import React from 'react';

export const PriceDisplay = ({ price, currency = 'USD', originalPrice, loading }) => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(price || 0);

    const formattedOriginal = originalPrice ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(originalPrice) : null;

    if (loading) return <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>;

    return (
        <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-gray-900 transition-all duration-300">
                {formattedPrice}
            </span>
            {originalPrice && originalPrice > price && (
                <span className="text-lg text-gray-500 line-through">
                    {formattedOriginal}
                </span>
            )}
        </div>
    );
};

export const StockIndicator = ({ stock, loading }) => {
    if (loading) return <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>;

    if (stock === 0 || stock === null || stock === undefined) {
        return (
            <div className="mt-2 flex items-center text-red-600 font-medium">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                Out of Stock
            </div>
        );
    }

    if (stock < 10) {
        return (
            <div className="mt-2 flex items-center text-amber-600 font-medium">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-2"></span>
                Only {stock} left!
            </div>
        );
    }

    return (
        <div className="mt-2 flex items-center text-green-600 font-medium">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
            In Stock
        </div>
    );
};
