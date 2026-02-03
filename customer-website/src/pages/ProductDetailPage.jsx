import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, getProducts } from '../api/productApi';
import { getVariantsByProduct } from '../api/variantApi';
import { useCart } from '../context/CartContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const { addToCart } = useCart();

    useEffect(() => {
        loadProduct();
        window.scrollTo(0, 0);
    }, [slug]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const productData = await getProductBySlug(slug);
            setProduct(productData);

            // Load variants if product has variants
            if (productData.hasVariants) {
                const variantsData = await getVariantsByProduct(productData._id);
                setVariants(variantsData.data || []);
                if (variantsData.data?.length > 0) {
                    setSelectedVariant(variantsData.data[0]);
                }
            }

            // Load related products (same category)
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

    const handleAddToCart = () => {
        try {
            if (product.hasVariants && !selectedVariant) {
                alert('Please select a variant');
                return;
            }

            const itemToAdd = product.hasVariants
                ? { ...product, selectedVariant }
                : product;

            for (let i = 0; i < quantity; i++) {
                addToCart(itemToAdd, selectedVariant);
            }

            alert(`Added ${quantity} item(s) to cart!`);
            setQuantity(1);
        } catch (error) {
            alert(error.message);
        }
    };

    const currentPrice = selectedVariant?.price || product?.price || 0;
    const currentStock = selectedVariant?.stock || product?.stock || 0;
    const currentSKU = selectedVariant?.sku || product?.sku || '';

    // Mock images for gallery (in real app, these would come from product.images array)
    const productImages = product?.images || [product?.image] || [];

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h2>Product not found</h2>
                <Link to="/products" className="btn btn-primary" style={{ marginTop: '2rem' }}>
                    Back to Products
                </Link>
            </div>
        );
    }

    return (
        <div className="product-detail-page">
            <div className="container">
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/products">Products</Link>
                    {product.category && (
                        <>
                            <span>/</span>
                            <Link to={`/category/${product.category.slug}`}>
                                {product.category.name}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span>{product.name}</span>
                </nav>

                {/* Product Main Section */}
                <div className="product-main">
                    {/* Image Gallery */}
                    <div className="product-gallery">
                        <div className="main-image">
                            <img
                                src={getImageUrl(productImages[selectedImage])}
                                alt={product.name}
                                onError={(e) => {
                                    e.target.src = 'https://placehold.co/600x600?text=No+Image';
                                }}
                            />
                            {product.discount > 0 && (
                                <span className="discount-badge">{product.discount}% OFF</span>
                            )}
                        </div>

                        {productImages.length > 1 && (
                            <div className="image-thumbnails">
                                {productImages.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={getImageUrl(img)} alt={`${product.name} ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="product-info-section">
                        <div className="product-header">
                            <h1>{product.name}</h1>
                            {product.brand && (
                                <Link to={`/brand/${product.brand.slug}`} className="product-brand">
                                    by {product.brand.name}
                                </Link>
                            )}
                        </div>

                        {/* Rating */}
                        <div className="product-rating">
                            <div className="stars">
                                {'★'.repeat(Math.floor(product.rating || 4))}
                                {'☆'.repeat(5 - Math.floor(product.rating || 4))}
                            </div>
                            <span className="rating-text">
                                {product.rating || 4.0} ({product.reviewCount || 0} reviews)
                            </span>
                        </div>

                        {/* Price */}
                        <div className="product-price">
                            <span className="current-price">{formatCurrency(currentPrice)}</span>
                            {product.basePrice > currentPrice && (
                                <>
                                    <span className="original-price">{formatCurrency(product.basePrice)}</span>
                                    <span className="save-amount">
                                        Save {formatCurrency(product.basePrice - currentPrice)}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Stock Status */}
                        <div className="stock-status">
                            {currentStock > 0 ? (
                                <span className="in-stock">
                                    ✓ In Stock ({currentStock} available)
                                </span>
                            ) : (
                                <span className="out-of-stock">✗ Out of Stock</span>
                            )}
                        </div>

                        {/* Variant Selection */}
                        {product.hasVariants && variants.length > 0 && (
                            <div className="variant-selection">
                                <h3>Select Variant:</h3>
                                <div className="variant-options">
                                    {variants.map(variant => (
                                        <button
                                            key={variant._id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`variant-btn ${selectedVariant?._id === variant._id ? 'active' : ''} ${variant.stock === 0 ? 'disabled' : ''}`}
                                            disabled={variant.stock === 0}
                                        >
                                            <div className="variant-info">
                                                {variant.attributes?.size && <span className="variant-size">{variant.attributes.size}</span>}
                                                {variant.attributes?.color && (
                                                    <span className="variant-color" style={{ background: variant.attributes.color }}></span>
                                                )}
                                                <span className="variant-label">
                                                    {Object.values(variant.attributes || {}).join(' / ')}
                                                </span>
                                            </div>
                                            {variant.stock === 0 && <span className="variant-stock">Out of Stock</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="quantity-section">
                            <label>Quantity:</label>
                            <div className="quantity-controls">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="qty-btn"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="qty-input"
                                    min="1"
                                    max={currentStock}
                                />
                                <button
                                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                    className="qty-btn"
                                    disabled={quantity >= currentStock}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="product-actions">
                            <button
                                className="btn btn-primary btn-lg add-to-cart"
                                onClick={handleAddToCart}
                                disabled={currentStock === 0}
                            >
                                {currentStock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                            </button>
                            <button className="btn btn-outline btn-lg">
                                ♡ Add to Wishlist
                            </button>
                        </div>

                        {/* Product Meta */}
                        <div className="product-meta">
                            <div className="meta-item">
                                <strong>SKU:</strong> {currentSKU}
                            </div>
                            {product.category && (
                                <div className="meta-item">
                                    <strong>Category:</strong>{' '}
                                    <Link to={`/category/${product.category.slug}`}>
                                        {product.category.name}
                                    </Link>
                                </div>
                            )}
                            {product.tags && product.tags.length > 0 && (
                                <div className="meta-item">
                                    <strong>Tags:</strong> {product.tags.join(', ')}
                                </div>
                            )}
                        </div>

                        {/* Features */}
                        <div className="product-features">
                            <div className="feature-item">
                                <span className="feature-icon">🚚</span>
                                <span>Free Delivery</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">↩️</span>
                                <span>7 Days Return</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">✓</span>
                                <span>Warranty Available</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Tabs */}
                <div className="product-details-tabs">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
                            onClick={() => setActiveTab('specifications')}
                        >
                            Specifications
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Reviews ({product.reviewCount || 0})
                        </button>
                    </div>

                    <div className="tabs-content">
                        {activeTab === 'description' && (
                            <div className="tab-panel">
                                <h3>Product Description</h3>
                                <p>{product.description || 'No description available.'}</p>
                                {product.features && product.features.length > 0 && (
                                    <>
                                        <h4>Key Features:</h4>
                                        <ul>
                                            {product.features.map((feature, index) => (
                                                <li key={index}>{feature}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="tab-panel">
                                <h3>Specifications</h3>
                                <table className="specs-table">
                                    <tbody>
                                        <tr>
                                            <td><strong>SKU</strong></td>
                                            <td>{currentSKU}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Brand</strong></td>
                                            <td>{product.brand?.name || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Category</strong></td>
                                            <td>{product.category?.name || 'N/A'}</td>
                                        </tr>
                                        {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                                            <tr key={key}>
                                                <td><strong>{key}</strong></td>
                                                <td>{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="tab-panel">
                                <h3>Customer Reviews</h3>
                                <div className="reviews-summary">
                                    <div className="average-rating">
                                        <div className="rating-number">{product.rating || 4.0}</div>
                                        <div className="stars-large">
                                            {'★'.repeat(Math.floor(product.rating || 4))}
                                            {'☆'.repeat(5 - Math.floor(product.rating || 4))}
                                        </div>
                                        <p>{product.reviewCount || 0} reviews</p>
                                    </div>
                                </div>
                                <p className="no-reviews">Reviews feature coming soon!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="related-products">
                        <h2>Related Products</h2>
                        <div className="products-grid">
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

export default ProductDetailPage;
