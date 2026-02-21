import React, { useState, useMemo, useEffect, useCallback } from 'react';

/**
 * REUSABLE VARIANT SELECTOR COMPONENT
 * Handles different UI types: Swatches, Buttons, Grids, Dropdowns
 */
const VariantSelector = React.memo(({
    label,
    options,
    currentSelection,
    onSelect,
    isValidOption
}) => {
    const isColor = label.toLowerCase() === 'color';

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-900 tracking-tight">
                    {label}
                </label>
                {isColor && currentSelection && (
                    <span className="text-sm text-slate-500 font-normal">
                        {options.find(opt => opt.id === currentSelection)?.label}
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-2.5">
                {options.map((option) => {
                    const selected = currentSelection === option.id;
                    const disabled = !isValidOption(option.id);

                    if (isColor) {
                        return (
                            <button
                                key={option.id}
                                onClick={() => !disabled && onSelect(option.id)}
                                disabled={disabled}
                                className={`
                  relative w-10 h-10 rounded-full transition-all duration-300
                  ${selected ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'hover:scale-105'}
                  ${disabled ? 'opacity-20 grayscale cursor-not-allowed' : 'cursor-pointer'}
                `}
                                title={option.label}
                            >
                                <span
                                    className="absolute inset-0 rounded-full border border-slate-200 shadow-inner"
                                    style={{ backgroundColor: option.hex }}
                                />
                                {disabled && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-px h-full bg-slate-400 rotate-45" />
                                    </span>
                                )}
                            </button>
                        );
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => !disabled && onSelect(option.id)}
                            disabled={disabled}
                            className={`
                min-w-[64px] px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border
                ${selected
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}
                ${disabled ? 'opacity-30 border-slate-100 text-slate-300 cursor-not-allowed' : 'cursor-pointer'}
              `}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

/**
 * PREMIUM ENTERPRISE PRODUCT DETAIL PAGE
 */
const ProductDetailPage = ({ productGroup }) => {
    const [pdpData, setPdpData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // API base URL
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/variants/group/${productGroup}/configurations`);
                const result = await response.json();

                if (result.success) {
                    setPdpData(result.data);
                } else {
                    throw new Error(result.message || 'Failed to load product');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (productGroup) loadData();
    }, [productGroup, API_BASE]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Refining Details...</p>
                </div>
            </div>
        );
    }

    if (error || !pdpData || !pdpData.selectors) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white px-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Unable to load product</h2>
                        <p className="text-slate-500">{error || "The requested item could not be found."}</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { selectors, matrix, variantDictionary, defaultVariantId } = pdpData;

    // 1. Initialize selections with defaultVariantId configuration to guarantee a valid combination
    const [selections, setSelections] = useState(() => {
        const initial = {};
        if (defaultVariantId) {
            // Find the matrix key that resolves to defaultVariantId
            const validKey = Object.keys(matrix).find(k => matrix[k] === defaultVariantId);
            if (validKey) {
                const parts = validKey.split('.');
                // Map the parts back to the selector categories
                Object.entries(selectors).forEach(([key, options]) => {
                    const matchedOption = options.find(opt => parts.includes(opt.id));
                    if (matchedOption) initial[key] = matchedOption.id;
                });
                return initial;
            }
        }

        // Fallback
        Object.keys(selectors).forEach(key => {
            initial[key] = selectors[key][0]?.id;
        });
        return initial;
    });

    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // 2. Computed O(1) Key & Variant Lookup
    const combinationKey = useMemo(() => {
        return Object.values(selections).filter(Boolean).sort().join('.');
    }, [selections]);

    const activeVariantId = matrix[combinationKey];
    const activeVariant = variantDictionary[activeVariantId];

    // 3. Logic to check if a specific option is valid given other current selections
    const isValidOption = useCallback((category, optionId) => {
        const testSelections = { ...selections, [category]: optionId };
        const testKey = Object.values(testSelections).filter(Boolean).sort().join('.');
        return !!matrix[testKey];
    }, [selections, matrix]);

    const handleSelect = useCallback((category, id) => {
        setSelections(prev => ({ ...prev, [category]: id }));
        setActiveImageIndex(0); // Reset gallery on variant change
    }, []);

    // 4. Derived UI data
    const images = activeVariant?.images || [];
    const primaryImage = images.find(img => img.isPrimary) || images[activeImageIndex] || images[0];

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">

                    {/* L: IMAGE GALLERY (7/12 col) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative aspect-[4/5] bg-slate-50 rounded-3xl overflow-hidden group">
                            {primaryImage && (
                                <img
                                    key={primaryImage.url} // Key forces clean animation per variant
                                    src={primaryImage.url}
                                    alt={primaryImage.altText || "Product variant view"}
                                    className="w-full h-full object-cover animate-in fade-in duration-700"
                                />
                            )}
                            {!primaryImage && (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}

                            {/* Image Navigation Overlay (Mobile) */}
                            <div className="absolute inset-x-4 bottom-6 flex justify-center gap-2 lg:hidden">
                                {images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === idx ? 'w-8 bg-slate-900' : 'w-2 bg-slate-300'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Thumbnails (Desktop) */}
                        <div className="hidden lg:grid grid-cols-6 gap-4">
                            {images.map((img, idx) => (
                                <button
                                    key={img.url}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`
                    aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                    ${activeImageIndex === idx ? 'border-slate-900 shadow-md ring-2 ring-slate-100' : 'border-transparent hover:border-slate-200'}
                  `}
                                >
                                    <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* R: PRODUCT DETAILS (5/12 col) */}
                    <div className="lg:col-span-5 lg:sticky lg:top-12 space-y-10">
                        {/* Header Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-slate-100 text-[10px] font-bold tracking-widest text-slate-600 uppercase rounded-md">
                                    New Release
                                </span>
                                {activeVariant?.inventory < 10 && activeVariant?.inventory > 0 && (
                                    <span className="text-amber-600 text-xs font-medium animate-pulse">
                                        Only {activeVariant.inventory} units left
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                                {pdpData.baseDetails?.productName || "Product Name"}
                            </h1>

                            <div className="flex items-baseline gap-4">
                                <span key={activeVariant?.price} className="text-3xl font-semibold text-slate-900 animate-in slide-in-from-bottom-2 fade-in duration-500">
                                    ${activeVariant?.price?.toLocaleString() || '---'}
                                </span>
                                {activeVariant?.compareAtPrice && (
                                    <span className="text-xl text-slate-400 line-through">
                                        ${activeVariant.compareAtPrice.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Dynamic Selectors */}
                        <div className="space-y-8 py-8 border-y border-slate-100">
                            {Object.entries(selectors).map(([label, options]) => (
                                <VariantSelector
                                    key={label}
                                    label={label}
                                    options={options}
                                    currentSelection={selections[label]}
                                    onSelect={(id) => handleSelect(label, id)}
                                    isValidOption={(id) => isValidOption(label, id)}
                                />
                            ))}
                        </div>

                        {/* Stock & SKU Context */}
                        <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                            <span className="tracking-widest uppercase">SKU: {activeVariant?.sku || 'N/A'}</span>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${activeVariant?.inventory > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                {activeVariant?.inventory > 0 ? 'Ships within 24 hours' : 'Out of Stock'}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <button
                                disabled={!activeVariant || activeVariant.inventory <= 0}
                                className={`
                  w-full py-5 px-8 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg
                  ${activeVariant && activeVariant.inventory > 0
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-100 hover:-translate-y-1'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
                `}
                            >
                                {activeVariant?.inventory > 0 ? 'Add to Bag' : 'Join Waitlist'}
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-slate-200 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Save to List
                                </button>
                                <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-slate-200 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="pt-8 grid grid-cols-3 gap-8">
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Secure Delivery</p>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">100-Day Returns</p>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Lifetime Warranty</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
