import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ProductDetailPage = ({ productGroup }) => {
    const [variants, setVariants] = useState([]);
    const [configurations, setConfigurations] = useState(null);
    const [selectedConfig, setSelectedConfig] = useState({});
    const [currentVariant, setCurrentVariant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // API base URL
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        loadProductData();
    }, [productGroup]);

    const loadProductData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [variantsRes, configRes] = await Promise.all([
                axios.get(`${API_BASE}/variants/group/${productGroup}`),
                axios.get(`${API_BASE}/variants/group/${productGroup}/configurations`)
            ]);

            if (!variantsRes.data.success || !configRes.data.success) {
                throw new Error('Failed to load product data');
            }

            setVariants(variantsRes.data.data);
            setConfigurations(configRes.data.data);

            // Auto-select first available variant
            if (variantsRes.data.data.length > 0) {
                const firstVariant = variantsRes.data.data[0];
                selectVariant(firstVariant);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error loading product:', err);
            setError(err.response?.data?.message || 'Failed to load product');
            setLoading(false);
        }
    };

    const selectVariant = (variant) => {
        setCurrentVariant(variant);
        setSelectedImageIndex(0);

        // Build selected configuration
        const config = {};
        variant.sizes?.forEach(size => {
            config[size.category] = size.sizeId._id || size.sizeId;
        });
        if (variant.color) {
            config.color = variant.color._id || variant.color;
        }
        setSelectedConfig(config);
    };

    const handleConfigChange = (type, value) => {
        const newConfig = { ...selectedConfig, [type]: value };
        setSelectedConfig(newConfig);

        // Find matching variant
        const matchingVariant = findMatchingVariant(newConfig);
        if (matchingVariant) {
            selectVariant(matchingVariant);
        }
    };

    const findMatchingVariant = (config) => {
        return variants.find(variant => {
            // Check color match
            const variantColorId = variant.color?._id?.toString() || variant.color?.toString();
            const configColorId = config.color?.toString();

            if (configColorId && variantColorId !== configColorId) {
                return false;
            }

            // Check all size categories match
            const sizeCategories = Object.keys(config).filter(k => k !== 'color');

            for (const category of sizeCategories) {
                const variantSize = variant.sizes?.find(s => s.category === category);
                const variantSizeId = variantSize?.sizeId?._id?.toString() || variantSize?.sizeId?.toString();
                const configSizeId = config[category]?.toString();

                if (!variantSize || variantSizeId !== configSizeId) {
                    return false;
                }
            }

            return true;
        });
    };

    const isOptionAvailable = (type, value) => {
        // Create temporary config with this option
        const tempConfig = { ...selectedConfig, [type]: value };

        // Check if any variant matches this configuration
        return variants.some(variant => {
            const variantColorId = variant.color?._id?.toString() || variant.color?.toString();
            const tempColorId = tempConfig.color?.toString();

            if (type === 'color') {
                if (variantColorId !== value.toString()) return false;
            } else {
                const variantSize = variant.sizes?.find(s => s.category === type);
                const variantSizeId = variantSize?.sizeId?._id?.toString() || variantSize?.sizeId?.toString();
                if (!variantSize || variantSizeId !== value.toString()) return false;
            }

            // Check other selections still match
            return Object.entries(tempConfig).every(([key, val]) => {
                if (key === type) return true; // Skip the one we're checking

                if (key === 'color') {
                    return variantColorId === val?.toString();
                } else {
                    const size = variant.sizes?.find(s => s.category === key);
                    const sizeId = size?.sizeId?._id?.toString() || size?.sizeId?.toString();
                    return sizeId === val?.toString();
                }
            });
        });
    };

    const primaryImage = useMemo(() => {
        if (!currentVariant?.images?.length) return null;
        return currentVariant.images[selectedImageIndex] || currentVariant.images[0];
    }, [currentVariant, selectedImageIndex]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading product...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Product</h3>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentVariant) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-500 text-lg">Product not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200">
                            {primaryImage ? (
                                <img
                                    src={primaryImage.url}
                                    alt={primaryImage.altText || currentVariant.productName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {currentVariant.images && currentVariant.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {currentVariant.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx
                                                ? 'border-indigo-600 ring-2 ring-indigo-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={img.thumbnailUrl || img.url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Brand & Title */}
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                                {configurations?.productInfo?.brand || currentVariant.brand}
                            </p>
                            <h1 className="text-3xl font-bold text-gray-900 mt-2 leading-tight">
                                {currentVariant.productName}
                            </h1>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-gray-900">
                                ₹{currentVariant.price.toLocaleString('en-IN')}
                            </span>
                            {currentVariant.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price && (
                                <>
                                    <span className="text-xl text-gray-500 line-through">
                                        ₹{currentVariant.compareAtPrice.toLocaleString('en-IN')}
                                    </span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                                        {currentVariant.discountPercentage}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* SKU and Stock */}
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                                SKU: {currentVariant.sku}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentVariant.inStock
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                {currentVariant.inStock ? `In Stock (${currentVariant.totalStock})` : 'Out of Stock'}
                            </span>
                        </div>

                        {/* Size Selectors */}
                        {configurations && Object.entries(configurations.sizes).map(([category, sizes]) => (
                            <div key={category} className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-900 capitalize">
                                    Select {category}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {sizes.map(size => {
                                        const isAvailable = isOptionAvailable(category, size.id);
                                        const isSelected = selectedConfig[category]?.toString() === size.id.toString();

                                        return (
                                            <button
                                                key={size.id}
                                                onClick={() => isAvailable && handleConfigChange(category, size.id)}
                                                disabled={!isAvailable}
                                                className={`
                                                    px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all
                                                    ${isSelected
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                                                        : isAvailable
                                                            ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-sm'
                                                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                                                    }
                                                `}
                                            >
                                                {size.displayName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Color Selector */}
                        {configurations?.colors && configurations.colors.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-900">Select Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {configurations.colors.map(color => {
                                        const isAvailable = isOptionAvailable('color', color.id);
                                        const isSelected = selectedConfig.color?.toString() === color.id.toString();

                                        return (
                                            <button
                                                key={color.id}
                                                onClick={() => isAvailable && handleConfigChange('color', color.id)}
                                                disabled={!isAvailable}
                                                className={`
                                                    relative group
                                                    ${!isAvailable && 'opacity-40 cursor-not-allowed'}
                                                `}
                                                title={color.name}
                                            >
                                                <div className={`
                                                    w-12 h-12 rounded-full border-2 transition-all
                                                    ${isSelected
                                                        ? 'border-indigo-600 ring-4 ring-indigo-200'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                    }
                                                `}>
                                                    <span
                                                        className="absolute inset-1 rounded-full"
                                                        style={{ backgroundColor: color.hexCode }}
                                                    />
                                                </div>
                                                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {color.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {currentVariant.description && (
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-700 leading-relaxed">{currentVariant.description}</p>
                            </div>
                        )}

                        {/* Specifications */}
                        {currentVariant.specifications && Object.keys(currentVariant.specifications).length > 0 && (
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Specifications</h3>
                                <dl className="grid grid-cols-2 gap-3">
                                    {Object.entries(currentVariant.specifications).map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 px-3 py-2 rounded-lg">
                                            <dt className="text-xs text-gray-500 capitalize">{key}</dt>
                                            <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}

                        {/* Add to Cart Button */}
                        <div className="pt-6">
                            <button
                                disabled={!currentVariant.inStock}
                                className="w-full bg-indigo-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none"
                            >
                                {currentVariant.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
