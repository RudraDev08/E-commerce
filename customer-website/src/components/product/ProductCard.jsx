import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import './ProductCard.css';

/**
 * Premium Product Card Component
 * 
 * STRICT RULES:
 * - NO stock/inventory indicators
 * - NO variant-count based availability logic
 * - Relies ONLY on product.isPublished and product.isActive flags
 * - Inventory validation happens ONLY on add-to-cart (backend)
 * - Clean, minimal, luxury design
 * 
 * Design Principles:
 * - Focus on product image and price
 * - Category • Brand breadcrumb
 * - Wishlist integration
 * - Always-enabled CTA (stock checked on backend)
 */
const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const inWishlist = isInWishlist(product._id);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.hasVariants) {
            // Navigate to product page for variant selection
            navigate(`/product/${product.slug}`);
        } else {
            // Add to cart - backend will validate stock
            addToCart(product);
        }
    };

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (inWishlist) {
            removeFromWishlist(product._id);
        } else {
            addToWishlist(product);
        }
    };

    // Price display - use product price directly (no variant price calculation)
    const displayPrice = product.salePrice || product.price;
    const baseDisplayPrice = product.basePrice || product.compareAtPrice;
    const displayImage = product.image || product.featuredImage?.url || '';

    // Calculate discount
    const showDiscount = baseDisplayPrice && baseDisplayPrice > displayPrice;
    const discountPercent = showDiscount
        ? Math.round(((baseDisplayPrice - displayPrice) / baseDisplayPrice) * 100)
        : 0;

    // Get category and brand breadcrumb
    const getCategoryBrand = () => {
        const parts = [];
        if (product.category?.name) parts.push(product.category.name);
        if (product.brand?.name) parts.push(product.brand.name);
        return parts.join(' • ');
    };

    return (
        <div className="product-card-modern">
            <Link to={`/product/${product.slug}`} className="product-card-link">
                {/* Image Container */}
                <div className="pc-image-container">
                    {!imageLoaded && (
                        <div className="pc-image-skeleton"></div>
                    )}
                    <img
                        src={getImageUrl(displayImage)}
                        alt={product.name}
                        className={`pc-image ${imageLoaded ? 'loaded' : ''}`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/300x300/f8fafc/94a3b8?text=No+Image';
                            setImageLoaded(true);
                        }}
                    />

                    {/* Wishlist Button */}
                    <button
                        className={`pc-wishlist-btn ${inWishlist ? 'active' : ''}`}
                        onClick={handleWishlistToggle}
                        aria-label="Add to wishlist"
                    >
                        {inWishlist ? '❤️' : '🤍'}
                    </button>

                    {/* Discount Badge ONLY (NO stock badges) */}
                    {showDiscount && discountPercent > 0 && (
                        <div className="pc-discount-badge">
                            {discountPercent}% OFF
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="pc-info">
                    {/* Category • Brand Breadcrumb */}
                    {getCategoryBrand() && (
                        <div className="pc-breadcrumb">{getCategoryBrand()}</div>
                    )}

                    {/* Product Name */}
                    <h3 className="pc-name">{product.name}</h3>

                    {/* Short Description */}
                    {product.shortDescription && (
                        <p className="pc-description">{product.shortDescription}</p>
                    )}

                    {/* Rating */}
                    {product.rating && (
                        <div className="pc-rating">
                            <div className="pc-stars">
                                {'★'.repeat(Math.floor(product.rating))}
                                {'☆'.repeat(5 - Math.floor(product.rating))}
                            </div>
                            <span className="pc-rating-count">
                                ({product.reviewCount || 0})
                            </span>
                        </div>
                    )}

                    {/* Price Section */}
                    <div className="pc-price-section">
                        <div className="pc-price-row">
                            {product.hasVariants && (
                                <span className="pc-price-label">Starting from</span>
                            )}
                            <span className="pc-price-current">
                                {formatCurrency(displayPrice, product.currency || 'INR')}
                            </span>
                        </div>
                        {showDiscount && (
                            <div className="pc-price-old-row">
                                <span className="pc-price-old">
                                    {formatCurrency(baseDisplayPrice, product.currency || 'INR')}
                                </span>
                                <span className="pc-save-amount">
                                    Save {formatCurrency(baseDisplayPrice - displayPrice, product.currency || 'INR')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Add to Cart Button - ALWAYS enabled (stock validated on backend) */}
            <button
                className="pc-add-to-cart"
                onClick={handleAddToCart}
            >
                {product.hasVariants ? (
                    <>
                        <span>Select Options</span>
                        <span className="pc-arrow">→</span>
                    </>
                ) : (
                    <>
                        <span>🛒</span>
                        <span>Add to Cart</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default ProductCard;
