import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export const PriceDisplay = ({ price, currency = 'INR', originalPrice, loading }) => {
    // ... logic same ...
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(price || 0);

    const formattedOriginal = originalPrice ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
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

    if (stock === null || stock === undefined) {
        return null; // Don't show anything until selection
    }

    if (stock === 0) {
        return (
            <div className="mt-2 flex items-center text-red-600 font-medium">
                <XMarkIcon className="w-5 h-5 mr-1" />
                Out of Stock
            </div>
        );
    }

    // Low Stock Warning (< 5)
    if (stock < 5) {
        return (
            <div className="mt-2 flex items-center text-orange-600 font-medium">
                <ExclamationTriangleIcon className="w-5 h-5 mr-1" />
                <span className="font-bold">Low Stock:</span>&nbsp;Only {stock} left!
            </div>
        );
    }

    return (
        <div className="mt-2 flex items-center text-green-600 font-medium">
            <CheckIcon className="w-5 h-5 mr-1" />
            In Stock
        </div>
    );
};
