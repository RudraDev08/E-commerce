import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug } from '../api/productApi';
import { getVariantsByProduct } from '../api/variantApi';
import { getInventoryByProductId } from '../api/inventoryApi';
import { useCart } from '../context/CartContext';
import ProductImageGallery from '../components/product/ProductImageGallery';
import { ProductConfigurator } from '../components/product/configurator/ProductConfigurator';
import { PriceDisplay, StockIndicator } from '../components/product/configurator/PriceStockComponents';
import '../styles/ProductDetails.css';

const ProductDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // State
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // UI State
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const productData = await getProductBySlug(slug);

                if (!productData || productData.status !== 'active' || productData.isDeleted) {
                    setError('Product not found');
                    setLoading(false);
                    return;
                }

                setProduct(productData);

                if (productData._id) {
                    // Parallel Fetch: Variants & Inventory
                    const [variantsRes, inventoryRes] = await Promise.all([
                        getVariantsByProduct(productData._id),
                        getInventoryByProductId(productData._id)
                    ]);

                    const variantsList = variantsRes.data?.data || variantsRes.data || [];
                    const inventories = inventoryRes.data || [];

                    // Create Inventory Map
                    const inventoryMap = {};
                    console.log('DEBUG: Variants fetched:', variantsList.length);
                    console.log('DEBUG: Inventory records:', inventories.length);

                    inventories.forEach(inv => {
                        if (!inv.variantId) return; // Skip invalid records
                        // Handle both string ID and object ID and ensure string
                        const vId = (typeof inv.variantId === 'object' && inv.variantId._id)
                            ? String(inv.variantId._id)
                            : String(inv.variantId);

                        // DEBUG
                        // console.log(`DEBUG: Mapping Inv Variant ${vId} -> Stock ${inv.totalStock}`);

                        inventoryMap[vId] = inv.totalStock; // Available Stock
                    });

                    console.log('DEBUG: Inventory Map Keys:', Object.keys(inventoryMap));

                    const activeVariants = variantsList.filter(v =>
                        (v.status === true || v.status === 'active') && !v.isDeleted
                    ).map(v => {
                        const vIdString = String(v._id);
                        const stock = inventoryMap[vIdString] !== undefined ? inventoryMap[vIdString] : 0;

                        // DEBUG
                        // if (stock === 0) console.log(`DEBUG: Variant ${vIdString} has 0 stock (Map value: ${inventoryMap[vIdString]})`);

                        return {
                            ...v,
                            // STRICT SOURCE OF TRUTH: Inventory Master
                            // If no inventory record exists, stock is 0. No fallback to legacy variant.stock.
                            stock: stock
                        };
                    });

                    console.log('DEBUG: Active Variants with Stock:', activeVariants.map(v => ({ id: v._id, stock: v.stock })));



                    setVariants(activeVariants);
                }

            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchData();
    }, [slug]);

    const galleryImages = useMemo(() => {
        if (selectedVariant?.images && selectedVariant.images.length > 0) {
            return selectedVariant.images.map(img => typeof img === 'string' ? img : img.url);
        }
        if (product?.gallery && product.gallery.length > 0) {
            return product.gallery.map(img => img.url);
        }
        if (product?.image) return [product.image];
        return ['https://via.placeholder.com/600x600?text=No+Image'];
    }, [selectedVariant, product]);

    // Dynamic Title
    const displayTitle = useMemo(() => {
        if (!selectedVariant) return product?.name || 'Product';
        // Try structured color first
        const colorName = selectedVariant.color?.name || selectedVariant.color?.value;
        if (colorName) return `${product?.name} - ${colorName}`;
        return product?.name || 'Product'; // Fallback
    }, [product, selectedVariant]);

    // Alternative Suggestions (if current is OOS)
    const alternatives = useMemo(() => {
        const stock = selectedVariant ? selectedVariant.stock : null;
        if (!selectedVariant || (stock !== null && stock > 0)) return [];
        // Find other variants that match at least ONE attribute (e.g. same size but different color, or same color different size)
        // For simplicity, find ANY in stock.
        return variants.filter(v => v.stock > 0 && v._id !== selectedVariant._id).slice(0, 2);
    }, [selectedVariant, variants]);

    // Validate quantity against stock
    useEffect(() => {
        const stock = selectedVariant ? selectedVariant.stock : 0;
        if (selectedVariant && stock > 0 && quantity > stock) {
            setQuantity(1);
        }
    }, [selectedVariant, quantity]);

    const handleAddToCart = () => {
        if (!selectedVariant) {
            alert('Please select all product options');
            return;
        }
        if (selectedVariant.stock <= 0) {
            // Notify Me logic would go here
            alert('We will notify you when this item is back in stock.');
            return;
        }

        const cartPayload = {
            variantId: selectedVariant._id,
            productId: product._id,
            name: product.name,
            sku: selectedVariant.sku,
            price: selectedVariant.price,
            currency: selectedVariant.currency || product.currency || 'INR',
            quantity: quantity,
            attributes: selectedVariant.attributes,
            image: galleryImages[0],
            stock: selectedVariant.stock
        };

        addToCart(cartPayload);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/cart');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'description':
                return (
                    <div className="tab-pane fade-in">
                        <div className="description-content" dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }} />
                    </div>
                );
            case 'features':
                return (
                    <div className="tab-pane fade-in">
                        {product.features && product.features.length > 0 ? (
                            <ul className="features-list">
                                {product.features.map((feature, idx) => (
                                    <li key={idx}>
                                        <span className="bullet-point"></span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-data">No specific features listed.</p>
                        )}
                    </div>
                );
            case 'specs':
                return (
                    <div className="tab-pane fade-in specs-grid">
                        {/* Physical Details */}
                        {product.dimensions && (
                            <div className="specs-section">
                                <h4>Physical Details</h4>
                                <div className="specs-table">
                                    {product.dimensions.length > 0 && (
                                        <div className="spec-row"><span className="label">Length</span><span className="value">{product.dimensions.length} {product.dimensions.unit || 'cm'}</span></div>
                                    )}
                                    {product.dimensions.width > 0 && (
                                        <div className="spec-row"><span className="label">Width</span><span className="value">{product.dimensions.width} {product.dimensions.unit || 'cm'}</span></div>
                                    )}
                                    {product.dimensions.height > 0 && (
                                        <div className="spec-row"><span className="label">Height</span><span className="value">{product.dimensions.height} {product.dimensions.unit || 'cm'}</span></div>
                                    )}
                                    {product.dimensions.weight > 0 && (
                                        <div className="spec-row"><span className="label">Weight</span><span className="value">{product.dimensions.weight} kg</span></div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="specs-section">
                                <h4>Tags & Keywords</h4>
                                <div className="tags-list">
                                    {product.tags.map((tag, idx) => (
                                        <span key={idx} className="tag-pill">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
    if (error || !product) return (
        <div className="error-container">
            <h3>{error || 'Product not found'}</h3>
            <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
    );

    const currentPrice = selectedVariant ? selectedVariant.price : product.price;
    const currentStock = selectedVariant ? selectedVariant.stock : null;
    const isOutOfStock = currentStock === 0;





    return (
        <div className="product-details-container">
            <div className="container">
                {/* Breadcrumbs */}
                <nav className="breadcrumbs">
                    <Link to="/">Home</Link>
                    <span className="separator">/</span>
                    <Link to="/products">Products</Link>
                    <span className="separator">/</span>
                    <span className="current">{product.name}</span>
                </nav>

                <div className="product-card">
                    <div className="product-main-grid">
                        {/* Left Column: Gallery */}
                        <div className="gallery-section">
                            <ProductImageGallery images={galleryImages} alt={displayTitle} />
                        </div>

                        {/* Right Column: Details */}
                        <div className="product-info-section">
                            {/* Header */}
                            <div className="product-header">
                                {product.brand && (
                                    <div className="product-brand">{product.brand.name || 'Brand'}</div>
                                )}
                                <h1 className="product-title">{displayTitle}</h1>
                                {product.shortDescription && (
                                    <p className="product-short-desc">{product.shortDescription}</p>
                                )}
                            </div>

                            {/* Price & Stock */}
                            <div className="price-stock-row">
                                <PriceDisplay
                                    price={currentPrice}
                                    originalPrice={selectedVariant?.compareAtPrice || product.compareAtPrice}
                                    currency={product.currency}
                                />
                                {selectedVariant && (
                                    <div className="stock-wrapper">
                                        <div className="flex flex-col">
                                            <StockIndicator stock={currentStock} />
                                            {/* Alternatives Badge */}
                                            {isOutOfStock && alternatives.length > 0 && (
                                                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                                                    <span className="font-semibold text-gray-800">Available in:</span>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {alternatives.map(alt => (
                                                            <button
                                                                key={alt._id}
                                                                onClick={() => setSelectedVariant(alt)}
                                                                className="text-primary-600 hover:underline cursor-pointer flex items-center"
                                                            >
                                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                                                {alt.color?.name || 'Variant'} {alt.size?.name ? `• ${alt.size.name}` : ''}
                                                                <span className="text-gray-500 text-xs ml-1">({alt.stock} left)</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Configurator */}
                            <div className="configurator-wrapper">
                                <ProductConfigurator
                                    product={product}
                                    variants={variants}
                                    onVariantChange={setSelectedVariant}
                                    controlledVariant={selectedVariant}
                                />
                            </div>

                            {/* Actions */}
                            <div className="action-box">
                                <div className="action-row">
                                    <div className="quantity-group">
                                        <label>Qty</label>
                                        <select
                                            className="qty-select"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            disabled={isOutOfStock || !selectedVariant}
                                        >
                                            {selectedVariant && currentStock > 0 ? (
                                                [...Array(Math.min(10, currentStock))].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))
                                            ) : (
                                                <option value={1}>1</option>
                                            )}
                                        </select>
                                    </div>

                                    <button
                                        className={`btn-add-cart ${!selectedVariant || isOutOfStock ? 'disabled' : ''}`}
                                        onClick={handleAddToCart}
                                        disabled={!selectedVariant}
                                    >
                                        {!selectedVariant
                                            ? 'Select Options'
                                            : (isOutOfStock
                                                ? 'Notify Me'
                                                : 'Add to Cart')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                {/* Details Tab Section Kept as requested for specs/desc */}
                <div className="content-tabs-container">
                    <div className="tabs-header">
                        {['description', 'features', 'specs'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab === 'specs' ? 'Details & Specs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="tab-content-area pl-4">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
