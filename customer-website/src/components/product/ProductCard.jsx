import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import './ProductCard.css';

/**
 * Premium Product Card Component - Enhanced Edition
 * 
 * Features:
 * - Dynamic badges (NEW, SALE, FEATURED, etc.)
 * - Wishlist toggle with animation
 * - Quick view modal trigger
 * - Color variant swatches
 * - Stock status indicators
 * - Delivery information
 * - Star ratings with review count
 * - Hover effects with image zoom
 * - Secondary actions on hover
 * - Fully responsive design
 */
const ProductCard = ({ product }) => {
    // Defensive check for missing product
    if (!product) return null;

    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [imageLoaded, setImageLoaded] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [showQuickView, setShowQuickView] = useState(false);
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);

    // Handle add to cart
    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.hasVariants) {
            // Navigate to product page for variant selection
            navigate(`/product/${product.slug}`);
        } else {
            // Create proper cart payload for products without variants
            const cartPayload = {
                variantId: product.variantId || product._id, // Use variantId if available, otherwise product ID
                productId: product._id,
                name: product.name,
                price: product.salePrice || product.price,
                currency: product.currency || 'INR',
                quantity: 1,
                attributes: product.attributes || {},
                sku: product.sku || `SKU-${product._id}`,
                image: product.image || product.featuredImage?.url || '',
                stock: product.stock || 999
            };

            try {
                addToCart(cartPayload);
                // TODO: Show success toast/notification
            } catch (error) {
                console.error('Error adding to cart:', error);
                // TODO: Show error toast/notification
            }
        }
    };

    // Handle wishlist toggle
    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsWishlisted(!isWishlisted);
        // TODO: Integrate with wishlist API
    };

    // Handle quick view
    const handleQuickView = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowQuickView(true);
        // TODO: Open quick view modal
    };

    // Handle compare
    const handleCompare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // TODO: Add to compare list
    };

    // Price calculations
    const displayPrice = product.salePrice || product.price || 0;
    const baseDisplayPrice = product.basePrice || product.compareAtPrice || 0;
    const showDiscount = baseDisplayPrice > displayPrice;
    const discountPercent = showDiscount
        ? Math.round(((baseDisplayPrice - displayPrice) / baseDisplayPrice) * 100)
        : 0;

    // Get primary image
    const displayImage = product.image || product.featuredImage?.url || '';

    // Get brand name
    const brandName = product.brand?.name || product.brandName || '';

    // Get color variants (mock data if not available)
    const colorVariants = product.colorVariants || product.colors || [];
    const hasColors = colorVariants.length > 0;

    // Stock status
    const inStock = product.inStock !== false && product.stock !== 0;
    const lowStock = product.stock > 0 && product.stock < 10;

    // Delivery info
    const freeDelivery = product.freeDelivery || product.price > 500;

    // Rating
    const rating = product.rating || 0;
    const reviewCount = product.reviewCount || product.reviews || 0;

    // Badges
    const badges = [];
    if (product.isNew || product.tags?.includes('new')) {
        badges.push({ text: 'NEW', type: 'new' });
    }
    if (showDiscount && discountPercent > 0) {
        badges.push({ text: `${discountPercent}% OFF`, type: 'sale' });
    }
    if (product.isFeatured || product.tags?.includes('featured')) {
        badges.push({ text: 'FEATURED', type: 'featured' });
    }
    if (product.isBestseller || product.tags?.includes('bestseller')) {
        badges.push({ text: 'BESTSELLER', type: 'bestseller' });
    }

    return (
        <div className="product-card-enhanced">
            <Link to={`/product/${product.slug}`} className="product-card-link">
                {/* Image Container */}
                <div className="pc-image-wrapper">
                    {/* Image Skeleton */}
                    {!imageLoaded && (
                        <div className="pc-image-skeleton"></div>
                    )}

                    {/* Main Image */}
                    <img
                        src={getImageUrl(displayImage)}
                        alt={product.name}
                        className={`pc-image ${imageLoaded ? 'loaded' : ''}`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image';
                            setImageLoaded(true);
                        }}
                    />

                    {/* Top Badges */}
                    {badges.length > 0 && (
                        <div className="pc-badges">
                            {badges.slice(0, 2).map((badge, idx) => (
                                <span key={idx} className={`pc-badge pc-badge-${badge.type}`}>
                                    {badge.text}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Hover Actions - Top Right */}
                    <div className="pc-hover-actions">
                        <button
                            className={`pc-icon-btn pc-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                            onClick={handleWishlistToggle}
                            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                            <svg className="pc-icon" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>

                        <button
                            className="pc-icon-btn pc-quickview-btn"
                            onClick={handleQuickView}
                            title="Quick View"
                        >
                            <svg className="pc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Product Info */}
                <div className="pc-content">
                    {/* Brand */}
                    {brandName && (
                        <div className="pc-brand">{brandName}</div>
                    )}

                    {/* Product Name */}
                    <h3 className="pc-name">{product.name}</h3>

                    {/* Price Section */}
                    <div className="pc-price-section">
                        <div className="pc-price-row">
                            <span className="pc-price-current">
                                {formatCurrency(displayPrice, product.currency || 'INR')}
                            </span>
                            {showDiscount && (
                                <span className="pc-price-old">
                                    {formatCurrency(baseDisplayPrice, product.currency || 'INR')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Rating */}
                    {rating > 0 && (
                        <div className="pc-rating">
                            <div className="pc-stars">
                                {[...Array(5)].map((_, i) => (
                                    <svg
                                        key={i}
                                        className={`pc-star ${i < Math.floor(rating) ? 'filled' : ''}`}
                                        fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="pc-rating-text">
                                {rating.toFixed(1)} ({reviewCount})
                            </span>
                        </div>
                    )}

                    {/* Color Variants */}
                    {hasColors && (
                        <div className="pc-colors">
                            {colorVariants.slice(0, 4).map((color, idx) => (
                                <button
                                    key={idx}
                                    className={`pc-color-swatch ${selectedColorIndex === idx ? 'active' : ''}`}
                                    style={{ backgroundColor: color.hex || color.hexCode || color }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedColorIndex(idx);
                                    }}
                                    title={color.name || `Color ${idx + 1}`}
                                />
                            ))}
                            {colorVariants.length > 4 && (
                                <span className="pc-color-more">+{colorVariants.length - 4}</span>
                            )}
                        </div>
                    )}

                    {/* Stock & Delivery Info */}
                    <div className="pc-info-badges">
                        {inStock ? (
                            <span className={`pc-info-badge ${lowStock ? 'warning' : 'success'}`}>
                                <svg className="pc-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {lowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                        ) : (
                            <span className="pc-info-badge error">
                                <svg className="pc-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Out of Stock
                            </span>
                        )}

                        {freeDelivery && (
                            <span className="pc-info-badge info">
                                <svg className="pc-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                </svg>
                                Free Delivery
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Primary Action - Add to Cart */}
            <button
                className={`pc-add-to-cart ${!inStock ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={!inStock}
            >
                {!inStock ? (
                    <>
                        <svg className="pc-cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Out of Stock</span>
                    </>
                ) : product.hasVariants ? (
                    <>
                        <svg className="pc-cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Select Options</span>
                    </>
                ) : (
                    <>
                        <svg className="pc-cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Add to Cart</span>
                    </>
                )}
            </button>

            {/* Secondary Actions - Visible on Hover */}
            <div className="pc-secondary-actions">
                <button
                    className="pc-secondary-btn"
                    onClick={handleQuickView}
                    title="Quick View"
                >
                    <svg className="pc-secondary-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Quick View
                </button>

                <button
                    className="pc-secondary-btn"
                    onClick={handleCompare}
                    title="Compare"
                >
                    <svg className="pc-secondary-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Compare
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
