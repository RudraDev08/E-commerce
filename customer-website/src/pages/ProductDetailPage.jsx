import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug } from '../api/productApi';
import { getVariantsByProduct } from '../api/variantApi';
import { useCart } from '../context/CartContext';
import ProductImageGallery from '../components/product/ProductImageGallery';
import { ProductConfigurator } from '../components/product/configurator/ProductConfigurator';
import { PriceDisplay, StockIndicator } from '../components/product/configurator/PriceStockComponents';
import '../styles/ProductDetails.css';

const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount));
};

// ─── INLINE TOAST ─────────────────────────────────────────────────────────────
const useToast = () => {
    const [toast, setToast] = useState(null);
    const timerRef = useRef(null);

    const show = (message, type = 'info') => {
        clearTimeout(timerRef.current);
        setToast({ message, type, id: Date.now() });
        timerRef.current = setTimeout(() => setToast(null), 3500);
    };

    return { toast, show };
};

// ─── SHIMMER SKELETON ─────────────────────────────────────────────────────────
const PDPSkeleton = () => (
    <div className="pdp-skeleton">
        <div className="pdp-skeleton__gallery">
            <div className="shimmer-block" style={{ height: 440 }} />
            <div className="shimmer-thumbs">
                {[0, 1, 2, 3].map(i => <div key={i} className="shimmer-thumb" />)}
            </div>
        </div>
        <div className="pdp-skeleton__info">
            <div className="shimmer-bar shimmer-bar--xs" style={{ width: 80 }} />
            <div className="shimmer-bar shimmer-bar--lg" style={{ marginTop: 12 }} />
            <div className="shimmer-bar shimmer-bar--sm" style={{ width: '60%', marginTop: 8 }} />
            <div className="shimmer-bar shimmer-bar--lg" style={{ marginTop: 24, width: 120 }} />
            <div className="shimmer-block" style={{ height: 80, marginTop: 24 }} />
            <div className="shimmer-block" style={{ height: 56, marginTop: 12 }} />
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const ProductDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toast, show: showToast } = useToast();
    const selectorRef = useRef(null);

    // State
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    // Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const productData = await getProductBySlug(slug);

                if (!productData || productData.status !== 'ACTIVE' || productData.isDeleted) {
                    setError('Product not found');
                    setLoading(false);
                    return;
                }

                setProduct(productData);

                if (productData._id) {
                    // ✅ P0: Single Source of Truth — Variant schema now includes inventory
                    const variantsRes = await getVariantsByProduct(productData._id);
                    const variantsList = variantsRes.data?.data || variantsRes.data || [];

                    const activeVariants = variantsList
                        .filter(v => v.status === 'ACTIVE' && !v.isDeleted) // ✅ Strict Enum Check
                        .map(v => ({
                            ...v,
                            // ✅ Map canonical inventory path
                            stock: v.inventory?.quantityOnHand ?? 0,
                        }));

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

    // ─── P0 FIX: Canonical price resolution ───────────────────────────────────
    // NEVER use base `price` for customer display.
    // resolvedPrice is the backend-computed authoritative price from the
    // Decimal.js Price Resolution Engine (includes attribute modifiers).
    // Values come from backend as strings (Decimal128 serialized); parse safely.
    const parseDecimalSafe = (val) => {
        if (val === null || val === undefined) return null;
        const n = parseFloat(String(val));
        return isNaN(n) ? null : n;
    };

    // The canonical customer-facing price — MUST be resolvedPrice.
    // Falls back to null (never falls back to base price silently).
    const currentPrice = useMemo(() => {
        if (selectedVariant) {
            return parseDecimalSafe(selectedVariant.resolvedPrice);
        }
        // Before variant is selected, show no price (or placeholder) rather than
        // misleading with an un-modified base price.
        return null;
    }, [selectedVariant]);

    // compareAtPrice is only valid if it is strictly greater than resolvedPrice.
    // If backend rejects compareAtPrice <= price, this mirrors that guard in UI.
    const compareAtPrice = useMemo(() => {
        const cap = parseDecimalSafe(
            selectedVariant?.compareAtPrice ?? product?.compareAtPrice
        );
        if (cap === null || currentPrice === null) return null;
        // Only show strike-through if compare price is strictly greater
        return cap > currentPrice ? cap : null;
    }, [selectedVariant, product, currentPrice]);

    // Gallery images
    const galleryImages = useMemo(() => {
        // Prefer structured imageGallery (enterprise schema)
        if (selectedVariant?.imageGallery?.length > 0) {
            // Sort by sortOrder, primary first
            return [...selectedVariant.imageGallery]
                .sort((a, b) => {
                    if (a.isPrimary && !b.isPrimary) return -1;
                    if (!a.isPrimary && b.isPrimary) return 1;
                    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
                })
                .map(img => img.url);
        }
        if (selectedVariant?.images?.length > 0)
            return selectedVariant.images.map(img => typeof img === 'string' ? img : img.url);
        if (product?.gallery?.length > 0) return product.gallery.map(img => img.url);
        if (product?.image) return [product.image];
        return ['https://via.placeholder.com/600x600?text=No+Image'];
    }, [selectedVariant, product]);

    // Dynamic title
    const displayTitle = useMemo(() => {
        if (!selectedVariant) return product?.name || 'Product';
        const colorName = selectedVariant.color?.name || selectedVariant.color?.displayName;
        return colorName ? `${product?.name} — ${colorName}` : product?.name || 'Product';
    }, [product, selectedVariant]);

    // Alternatives for OOS variant
    const alternatives = useMemo(() => {
        if (!selectedVariant || (selectedVariant.stock ?? 0) > 0) return [];
        // ✅ P0: Lifecycle bypass prevention — alternatives must also be ACTIVE
        return variants.filter(v => v.status === 'ACTIVE' && v.stock > 0 && v._id !== selectedVariant._id).slice(0, 3);
    }, [selectedVariant, variants]);

    // ✅ P2: Quantity Reset Hardening — Sync quantity with selected variant's availability
    useEffect(() => {
        const stock = selectedVariant?.stock ?? 0;
        if (selectedVariant && (!selectedVariant.stock || stock === 0 || quantity > stock)) {
            setQuantity(1);
        }
    }, [selectedVariant, quantity, selectedVariant?.stock]);

    const handleAddToCart = async () => {
        if (!selectedVariant) {
            showToast('Please select all product options first.', 'warn');
            selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        if ((selectedVariant.stock ?? 0) <= 0) {
            showToast('We\'ll notify you when this item is back in stock.', 'info');
            return;
        }

        setAddingToCart(true);
        try {
            // ✅ P1: Never Trust Cart Price — Always refetch and lock price before proceeding
            const freshnessCheck = await getVariantsByProduct(product._id);
            const freshVariants = freshnessCheck.data?.data || freshnessCheck.data || [];
            const authoritativeVariant = freshVariants.find(v => v._id === selectedVariant._id);

            if (!authoritativeVariant || authoritativeVariant.status !== 'ACTIVE') {
                showToast('This item is no longer available. Please refresh the page.', 'error');
                return;
            }

            const clientPrice = selectedVariant.resolvedPrice?.toString() || currentPrice?.toString();
            const authoritativePrice = authoritativeVariant.resolvedPrice?.toString();

            if (clientPrice !== authoritativePrice) {
                showToast('Price mismatch detected due to a recent update. Refreshing prices...', 'error');
                // Auto-refresh variants list so UI catches up
                setVariants(freshVariants.filter(v => v.status === 'ACTIVE').map(v => ({ ...v, stock: v.inventory?.quantityOnHand ?? 0 })));
                return;
            }

            const cartPayload = {
                variantId: selectedVariant._id,
                productId: product._id,
                name: product.name,
                sku: selectedVariant.sku,
                // ✅ P1: Financial Safety — Send price as STRING to prevent float drift
                price: selectedVariant.resolvedPrice?.toString() || currentPrice?.toString(),
                currency: selectedVariant.currency || product.currency || 'INR',
                quantity,
                // ✅ P0: Structured Identity — Remove legacy flat attributes object
                attributes: {
                    size: selectedVariant.size?.displayName || selectedVariant.size?.name,
                    color: selectedVariant.color?.name
                },
                attributeValueIds: selectedVariant.attributeValueIds || [],
                image: galleryImages[0],
                stock: selectedVariant.stock,
            };
            addToCart(cartPayload);
            showToast(`${product.name} added to cart!`, 'success');
        } finally {
            setAddingToCart(false);
        }
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
                        <div
                            className="description-content"
                            dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }}
                        />
                    </div>
                );
            case 'features':
                return (
                    <div className="tab-pane fade-in">
                        {product.features?.length > 0 ? (
                            <ul className="features-list">
                                {product.features.map((f, idx) => (
                                    <li key={idx}>
                                        <span className="bullet-point" />
                                        <span>{f}</span>
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
                        {product.dimensions && (
                            <div className="specs-section">
                                <h4>Physical Details</h4>
                                <div className="specs-table">
                                    {product.dimensions.length > 0 && <div className="spec-row"><span className="label">Length</span><span className="value">{product.dimensions.length} {product.dimensions.unit || 'cm'}</span></div>}
                                    {product.dimensions.width > 0 && <div className="spec-row"><span className="label">Width</span><span className="value">{product.dimensions.width} {product.dimensions.unit || 'cm'}</span></div>}
                                    {product.dimensions.height > 0 && <div className="spec-row"><span className="label">Height</span><span className="value">{product.dimensions.height} {product.dimensions.unit || 'cm'}</span></div>}
                                    {product.dimensions.weight > 0 && <div className="spec-row"><span className="label">Weight</span><span className="value">{product.dimensions.weight} kg</span></div>}
                                </div>
                            </div>
                        )}
                        {product.tags?.length > 0 && (
                            <div className="specs-section">
                                <h4>Tags &amp; Keywords</h4>
                                <div className="tags-list">
                                    {product.tags.map((tag, idx) => <span key={idx} className="tag-pill">#{tag}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default: return null;
        }
    };

    // ── RENDER ─────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="product-details-container">
            <div className="container"><PDPSkeleton /></div>
        </div>
    );

    if (error || !product) return (
        <div className="error-container">
            <h3>{error || 'Product not found'}</h3>
            <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
    );

    const currentStock = selectedVariant ? (selectedVariant.stock ?? null) : null;
    const isOutOfStock = currentStock === 0;
    const isFullySelected = !!selectedVariant;

    return (
        <div className="product-details-container">
            {/* ── Toast notification ── */}
            {toast && (
                <div className={`pdp-toast pdp-toast--${toast.type}`} role="alert" aria-live="polite">
                    {toast.message}
                </div>
            )}

            <div className="container">
                {/* Breadcrumbs */}
                <nav className="breadcrumbs" aria-label="breadcrumb">
                    <Link to="/">Home</Link>
                    <span className="separator" aria-hidden="true">/</span>
                    <Link to="/products">Products</Link>
                    <span className="separator" aria-hidden="true">/</span>
                    <span className="current" aria-current="page">{product.name}</span>
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
                                    originalPrice={compareAtPrice}
                                    currency={product.currency}
                                    loading={loading}
                                    noVariantSelected={!selectedVariant}
                                />
                                {selectedVariant && (
                                    <div className="stock-wrapper">
                                        <StockIndicator stock={currentStock} />
                                        {/* Alternatives for OOS */}
                                        {isOutOfStock && alternatives.length > 0 && (
                                            <div className="alternatives-box">
                                                <span className="alternatives-label">Also available:</span>
                                                <div className="alternatives-list">
                                                    {alternatives.map(alt => (
                                                        <button
                                                            key={alt._id}
                                                            onClick={() => setSelectedVariant(alt)}
                                                            className="alt-btn"
                                                        >
                                                            <span className="alt-dot" />
                                                            {alt.color?.name || 'Variant'}
                                                            {alt.size?.displayName ? ` · ${alt.size.displayName}` : ''}
                                                            <span className="alt-stock">({alt.stock} left)</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Configurator */}
                            <div className="configurator-wrapper" ref={selectorRef}>
                                <ProductConfigurator
                                    product={product}
                                    variants={variants}
                                    onVariantChange={setSelectedVariant}
                                    controlledVariant={selectedVariant}
                                />
                            </div>

                            {/* Desktop Actions */}
                            <div className="action-box pdp-actions--desktop">
                                <div className="action-row">
                                    <div className="quantity-group">
                                        <label htmlFor="qty-select">Qty</label>
                                        <select
                                            id="qty-select"
                                            className="qty-select"
                                            value={quantity}
                                            onChange={e => setQuantity(Number(e.target.value))}
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
                                        className={`btn-add-cart ${!isFullySelected || isOutOfStock ? 'disabled' : ''} ${addingToCart ? 'loading' : ''}`}
                                        onClick={handleAddToCart}
                                        disabled={addingToCart}
                                        aria-disabled={!isFullySelected || isOutOfStock}
                                    >
                                        {addingToCart
                                            ? 'Adding…'
                                            : !isFullySelected
                                                ? 'Select Options'
                                                : isOutOfStock
                                                    ? 'Notify Me'
                                                    : 'Add to Cart'}
                                    </button>

                                    {isFullySelected && !isOutOfStock && (
                                        <button className="btn-buy-now" onClick={handleBuyNow}>
                                            Buy Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="content-tabs-container">
                    <div className="tabs-header" role="tablist">
                        {['description', 'features', 'specs'].map((tab) => (
                            <button
                                key={tab}
                                role="tab"
                                aria-selected={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab === 'specs' ? 'Details & Specs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="tab-content-area pl-4" role="tabpanel">
                        {renderTabContent()}
                    </div>
                </div>
            </div>

            {/* ── Mobile Sticky Bar ────────────────────────────────────────── */}
            <div className="mobile-sticky-bar" aria-hidden="false">
                <div className="mobile-sticky-bar__price">
                    {currentPrice !== null
                        ? formatCurrency(currentPrice, product.currency || 'INR')
                        : '—'}
                </div>
                <button
                    className={`btn-add-cart btn-add-cart--mobile ${!isFullySelected || isOutOfStock ? 'disabled' : ''}`}
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                >
                    {!isFullySelected ? 'Select Options' : isOutOfStock ? 'Notify Me' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
};

export default ProductDetailPage;
