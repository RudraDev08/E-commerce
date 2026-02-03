import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVariantsByProduct } from '../../api/variantApi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import TagBadge from '../common/TagBadge';
import './ProductCard.css';

/**
 * Enhanced Product Card Component
 * - Displays variant-based pricing (Starting from ₹X)
 * - Shows tag badges
 * - Wishlist integration
 * - Stock awareness
 * - Lazy loading images
 */
const ProductCard = ({ product }) => {
    const [variants, setVariants] = useState([]);
    const [minPrice, setMinPrice] = useState(product.price);
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const inWishlist = isInWishlist(product._id);

    useEffect(() => {
        if (product.hasVariants) {
            loadVariants();
        }
    }, [product._id]);

    const loadVariants = async () => {
        try {
            setIsLoading(true);
            const response = await getVariantsByProduct(product._id);
            const activeVariants = (response.data || []).filter(v => v.status && v.stock > 0);
            setVariants(activeVariants);

            // Calculate minimum price from active variants
            if (activeVariants.length > 0) {
                const prices = activeVariants.map(v => v.price);
                setMinPrice(Math.min(...prices));
            }
        } catch (error) {
            console.error('Error loading variants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.hasVariants && variants.length > 0) {
            // Redirect to product page for variant selection
            window.location.href = `/product/${product.slug}`;
        } else {
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

    // Check if product has any stock (including variants)
    // Show products by default, only hide if explicitly out of stock
    const hasStock = product.hasVariants
        ? (isLoading || variants.length > 0)
        : (product.stock === undefined || product.stock > 0);

    // Only hide if we're sure there's no stock and not loading
    if (!hasStock && !isLoading && !product.hasVariants && product.stock === 0) {
        return null;
    }

    const displayPrice = product.hasVariants ? minPrice : product.price;
    const displayImage = product.image || (variants[0]?.image) || '';

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
                            e.target.src = 'https://placehold.co/300x300?text=No+Image';
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

                    {/* Tag Badges */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="pc-tags">
                            {product.tags.slice(0, 2).map((tag, index) => (
                                <TagBadge key={index} tag={tag} size="small" />
                            ))}
                        </div>
                    )}

                    {/* Discount Badge */}
                    {product.basePrice > displayPrice && (
                        <div className="pc-discount-badge">
                            {Math.round(((product.basePrice - displayPrice) / product.basePrice) * 100)}% OFF
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="pc-info">
                    {/* Brand */}
                    {product.brand && (
                        <div className="pc-brand">{product.brand.name}</div>
                    )}

                    {/* Product Name */}
                    <h3 className="pc-name">{product.name}</h3>

                    {/* Short Description */}
                    {product.shortDescription && (
                        <p className="pc-description">{product.shortDescription}</p>
                    )}

                    {/* Rating */}
                    <div className="pc-rating">
                        <div className="pc-stars">
                            {'★'.repeat(Math.floor(product.rating || 4))}
                            {'☆'.repeat(5 - Math.floor(product.rating || 4))}
                        </div>
                        <span className="pc-rating-count">
                            ({product.reviewCount || 0})
                        </span>
                    </div>

                    {/* Price Section */}
                    <div className="pc-price-section">
                        <div className="pc-price-row">
                            {product.hasVariants && (
                                <span className="pc-price-label">Starting from</span>
                            )}
                            <span className="pc-price-current">
                                {formatCurrency(displayPrice)}
                            </span>
                        </div>
                        {product.basePrice > displayPrice && (
                            <div className="pc-price-old-row">
                                <span className="pc-price-old">
                                    {formatCurrency(product.basePrice)}
                                </span>
                                <span className="pc-save-amount">
                                    Save {formatCurrency(product.basePrice - displayPrice)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Stock Status */}
                    {!product.hasVariants && product.stock <= 5 && product.stock > 0 && (
                        <div className="pc-stock-warning">
                            Only {product.stock} left in stock!
                        </div>
                    )}
                </div>
            </Link>

            {/* Add to Cart Button */}
            <button
                className="pc-add-to-cart"
                onClick={handleAddToCart}
                disabled={!hasStock}
            >
                {product.hasVariants ? (
                    <>
                        <span>Select Options</span>
                        <span className="pc-arrow">→</span>
                    </>
                ) : hasStock ? (
                    <>
                        <span>🛒</span>
                        <span>Add to Cart</span>
                    </>
                ) : (
                    <span>Out of Stock</span>
                )}
            </button>
        </div>
    );
};

export default ProductCard;
