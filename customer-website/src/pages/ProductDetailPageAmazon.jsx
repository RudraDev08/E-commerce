import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug, getProducts } from '../api/productApi';
import { getVariantsByProduct } from '../api/variantApi';
import { useCart } from '../context/CartContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';
import VariantList from '../components/product/VariantList';
import './ProductDetailPageAmazon.css';

/**
 * Amazon-Style Product Detail Page
 * Full-featured e-commerce PDP with all Amazon-like features
 */
const ProductDetailPageAmazon = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // State
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [pincode, setPincode] = useState('');
    const [deliveryInfo, setDeliveryInfo] = useState(null);
    const [isZoomed, setIsZoomed] = useState(false);

    // Load product data
    useEffect(() => {
        loadProduct();
        window.scrollTo(0, 0);
    }, [slug]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const productData = await getProductBySlug(slug);
            setProduct(productData);

            // Load variants
            if (productData.hasVariants) {
                const variantsData = await getVariantsByProduct(productData._id);
                setVariants(variantsData.data || []);
                if (variantsData.data?.length > 0) {
                    setSelectedVariant(variantsData.data[0]);
                }
            }

            // Load related products
            if (productData.category) {
                const relatedRes = await getProducts({
                    category: productData.category._id || productData.category,
                    limit: 4
                });
                setRelatedProducts((relatedRes.data || []).filter(p => p._id !== productData._id));
            }
        } catch (error) {
            console.error('Error loading product:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle variant selection
    const handleVariantChange = (variant) => {
        setSelectedVariant(variant);
        setSelectedImageIndex(0); // Reset to first image
    };

    // Handle Add to Cart
    const handleAddToCart = () => {
        try {
            if (product.hasVariants && !selectedVariant) {
                alert('Please select a variant');
                return;
            }

            if (currentStock === 0) {
                alert('This product is out of stock');
                return;
            }

            const itemToAdd = product.hasVariants
                ? { ...product, selectedVariant }
                : product;

            for (let i = 0; i < quantity; i++) {
                addToCart(itemToAdd, selectedVariant);
            }

            alert(`Added ${quantity} item(s) to cart!`);
        } catch (error) {
            alert(error.message);
        }
    };

    // Handle Buy Now
    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/cart');
    };

    // Handle Pincode Check
    const handlePincodeCheck = () => {
        if (pincode.length !== 6) {
            alert('Please enter a valid 6-digit pincode');
            return;
        }

        // Mock delivery calculation
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3);
        setDeliveryInfo({
            available: true,
            date: deliveryDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            })
        });
    };

    // Current values based on selected variant
    const currentPrice = selectedVariant?.price || product?.price || 0;
    const currentStock = selectedVariant?.stock || product?.stock || 0;
    const currentSKU = selectedVariant?.sku || product?.sku || '';
    const currentImages = selectedVariant?.images || product?.images || [product?.image] || [];
    const currentMRP = currentPrice * 1.1; // Mock MRP (10% higher)
    const currentDiscount = Math.round(((currentMRP - currentPrice) / currentMRP) * 100);

    // Build breadcrumb
    const breadcrumb = [];
    if (product?.category) {
        if (product.category.parentId) {
            breadcrumb.push({
                name: product.category.parentId.name || 'Electronics',
                slug: product.category.parentId.slug || 'electronics'
            });
        }
        breadcrumb.push({
            name: product.category.name,
            slug: product.category.slug
        });
    }

    if (loading) {
        return (
            <div className="pdp-amazon-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="pdp-amazon-error">
                <h2>Product not found</h2>
                <Link to="/products" className="btn-amazon-primary">
                    Back to Products
                </Link>
            </div>
        );
    }

    return (
        <div className="pdp-amazon">
            <div className="container-amazon">

                {/* Breadcrumb Navigation */}
                <nav className="breadcrumb-amazon">
                    <Link to="/">Home</Link>
                    <span className="separator">›</span>
                    {breadcrumb.map((item, index) => (
                        <React.Fragment key={index}>
                            <Link to={`/category/${item.slug}`}>{item.name}</Link>
                            <span className="separator">›</span>
                        </React.Fragment>
                    ))}
                    <span className="current">{product.name}</span>
                </nav>

                {/* Main Product Section */}
                <div className="pdp-main-section">

                    {/* LEFT: Product Gallery */}
                    <div className="pdp-gallery-section">
                        {/* Vertical Thumbnails */}
                        <div className="thumbnails-vertical">
                            {currentImages.map((img, index) => (
                                <button
                                    key={index}
                                    className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                                    onClick={() => setSelectedImageIndex(index)}
                                >
                                    <img
                                        src={getImageUrl(img)}
                                        alt={`View ${index + 1}`}
                                        onError={(e) => {
                                            e.target.src = 'https://placehold.co/60x60?text=No+Image';
                                        }}
                                    />
                                </button>
                            ))}
                            {product.videos && product.videos.length > 0 && (
                                <button className="thumbnail video-thumbnail">
                                    <div className="video-icon">▶</div>
                                    <span>Video</span>
                                </button>
                            )}
                        </div>

                        {/* Main Image */}
                        <div className="main-image-container">
                            <img
                                src={getImageUrl(currentImages[selectedImageIndex])}
                                alt={product.name}
                                className={isZoomed ? 'zoomed' : ''}
                                onMouseEnter={() => setIsZoomed(true)}
                                onMouseLeave={() => setIsZoomed(false)}
                                onError={(e) => {
                                    e.target.src = 'https://placehold.co/600x600?text=No+Image';
                                }}
                            />
                            {isZoomed && (
                                <div className="zoom-hint">Move mouse to zoom</div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Product Information */}
                    <div className="pdp-info-section">

                        {/* Product Header */}
                        <div className="product-header-amazon">
                            <h1 className="product-title-amazon">{product.name}</h1>

                            {product.brand && (
                                <Link
                                    to={`/brand/${product.brand.slug}`}
                                    className="brand-link-amazon"
                                >
                                    Visit the {product.brand.name} Store
                                </Link>
                            )}

                            {/* Rating */}
                            <div className="rating-section-amazon">
                                <div className="stars-amazon">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < Math.floor(product.rating || 4.5) ? 'star filled' : 'star'}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span className="rating-value">{product.rating || 4.5}</span>
                                <span className="rating-divider">|</span>
                                <Link to="#reviews" className="rating-count">
                                    {product.reviewCount || 1234} ratings
                                </Link>
                            </div>
                        </div>

                        <div className="divider-amazon"></div>

                        {/* Pricing Section */}
                        <div className="pricing-section-amazon">
                            {currentDiscount > 0 && (
                                <span className="discount-badge-amazon">-{currentDiscount}%</span>
                            )}
                            <div className="price-row-amazon">
                                <span className="price-label">Price:</span>
                                <span className="current-price-amazon">{formatCurrency(currentPrice)}</span>
                            </div>
                            {currentDiscount > 0 && (
                                <div className="mrp-row-amazon">
                                    M.R.P.: <span className="strike">{formatCurrency(currentMRP)}</span>
                                </div>
                            )}
                            <div className="tax-note-amazon">Inclusive of all taxes</div>
                            <div className="emi-info-amazon">
                                EMI starts at ₹{Math.round(currentPrice / 24).toLocaleString('en-IN')}.
                                <button className="emi-details-btn">No Cost EMI available ▼</button>
                            </div>
                        </div>

                        <div className="divider-amazon"></div>

                        {/* Offers Section */}
                        <div className="offers-section-amazon">
                            <h4 className="offers-title">🎁 Offers</h4>
                            <div className="offers-scroll">
                                <div className="offer-card-amazon">
                                    <div className="offer-icon">💳</div>
                                    <div className="offer-content">
                                        <div className="offer-title">No Cost EMI</div>
                                        <div className="offer-desc">Upto ₹{Math.round(currentPrice / 24).toLocaleString('en-IN')} EMI interest savings</div>
                                    </div>
                                </div>
                                <div className="offer-card-amazon">
                                    <div className="offer-icon">🏦</div>
                                    <div className="offer-content">
                                        <div className="offer-title">Bank Offer</div>
                                        <div className="offer-desc">Upto ₹10,000.00 discount on select Credit Cards</div>
                                    </div>
                                </div>
                                <div className="offer-card-amazon">
                                    <div className="offer-icon">💰</div>
                                    <div className="offer-content">
                                        <div className="offer-title">Cashback</div>
                                        <div className="offer-desc">Upto ₹3,899 cashback as Amazon Pay Balance</div>
                                    </div>
                                </div>
                                <div className="offer-card-amazon">
                                    <div className="offer-icon">🔄</div>
                                    <div className="offer-content">
                                        <div className="offer-title">Exchange Offer</div>
                                        <div className="offer-desc">Upto ₹20,000 off on exchange of any smartphone</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="divider-amazon"></div>

                        {/* Trust Icons */}
                        <div className="trust-icons-amazon">
                            <div className="trust-item">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
                                </svg>
                                <span>Free Delivery</span>
                            </div>
                            <div className="trust-item">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>
                                <span>7-Day Replacement</span>
                            </div>
                            <div className="trust-item">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <span>1 Year Warranty</span>
                            </div>
                            <div className="trust-item">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                                <span>Pay on Delivery</span>
                            </div>
                            <div className="trust-item">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                                    <polyline points="9 12 11 14 15 10"></polyline>
                                </svg>
                                <span>Secure Transaction</span>
                            </div>
                        </div>

                        <div className="divider-amazon"></div>

                        {/* Variant Selection */}
                        {product.hasVariants && variants.length > 0 && (
                            <>
                                <VariantList
                                    variants={variants}
                                    selectedVariant={selectedVariant}
                                    onVariantSelect={handleVariantChange}
                                    productName={product.name}
                                />
                                <div className="divider-amazon"></div>
                            </>
                        )}

                        {/* Delivery & Stock Info */}
                        <div className="delivery-section-amazon">
                            <div className="pincode-check">
                                <label>📍 Deliver to:</label>
                                <div className="pincode-input-group">
                                    <input
                                        type="text"
                                        placeholder="Enter pincode"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength="6"
                                    />
                                    <button onClick={handlePincodeCheck} className="btn-check-pincode">
                                        Check
                                    </button>
                                </div>
                                {deliveryInfo && (
                                    <div className="delivery-result">
                                        ✓ Get it by <strong>{deliveryInfo.date}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Stock Warning */}
                            {currentStock > 0 && currentStock <= 10 && (
                                <div className="stock-warning-amazon">
                                    ⚠️ Only {currentStock} left in stock - order soon
                                </div>
                            )}

                            {currentStock === 0 && (
                                <div className="out-of-stock-amazon">
                                    ❌ Currently out of stock
                                </div>
                            )}
                        </div>

                        <div className="divider-amazon"></div>

                        {/* Purchase Actions */}
                        <div className="purchase-actions-amazon">
                            {/* Quantity Selector */}
                            <div className="quantity-selector-amazon">
                                <label>Qty:</label>
                                <select
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    disabled={currentStock === 0}
                                >
                                    {[...Array(Math.min(currentStock, 10))].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                className="btn-add-to-cart-amazon"
                                onClick={handleAddToCart}
                                disabled={currentStock === 0}
                            >
                                🛒 Add to Cart
                            </button>

                            {/* Buy Now Button */}
                            <button
                                className="btn-buy-now-amazon"
                                onClick={handleBuyNow}
                                disabled={currentStock === 0}
                            >
                                ⚡ Buy Now
                            </button>
                        </div>

                        {/* Product Meta */}
                        <div className="product-meta-amazon">
                            {currentSKU && (
                                <div className="meta-item">
                                    <span className="meta-label">SKU:</span>
                                    <span className="meta-value">{currentSKU}</span>
                                </div>
                            )}
                            {product.tags && product.tags.length > 0 && (
                                <div className="meta-item">
                                    <span className="meta-label">Tags:</span>
                                    <div className="tags-list">
                                        {product.tags.map((tag, index) => (
                                            <span key={index} className="tag-badge">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Details Section (Tabs) */}
                <div className="pdp-details-section">
                    <div className="tabs-amazon">
                        <button
                            className={`tab ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>
                        <button
                            className={`tab ${activeTab === 'specifications' ? 'active' : ''}`}
                            onClick={() => setActiveTab('specifications')}
                        >
                            Specifications
                        </button>
                        <button
                            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Reviews & Ratings
                        </button>
                        <button
                            className={`tab ${activeTab === 'qa' ? 'active' : ''}`}
                            onClick={() => setActiveTab('qa')}
                        >
                            Questions & Answers
                        </button>
                    </div>

                    <div className="tab-content-amazon">
                        {activeTab === 'description' && (
                            <div className="tab-panel">
                                <h3>Product Description</h3>
                                <p>{product.description || 'No description available.'}</p>
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="tab-panel">
                                <h3>Technical Specifications</h3>
                                {product.specifications ? (
                                    <table className="specs-table">
                                        <tbody>
                                            {Object.entries(product.specifications).map(([key, value]) => (
                                                <tr key={key}>
                                                    <td className="spec-label">{key}</td>
                                                    <td className="spec-value">{value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No specifications available.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="tab-panel">
                                <h3>Customer Reviews</h3>
                                <p>Reviews coming soon...</p>
                            </div>
                        )}

                        {activeTab === 'qa' && (
                            <div className="tab-panel">
                                <h3>Questions & Answers</h3>
                                <p>Q&A coming soon...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="related-products-section">
                        <h2>Similar Products</h2>
                        <div className="products-grid-amazon">
                            {relatedProducts.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPageAmazon;
