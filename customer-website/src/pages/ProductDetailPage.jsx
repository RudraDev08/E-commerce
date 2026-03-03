import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { getProductBySlug } from '../api/productApi';
import { getVariantsByProduct, validateVariantForCart } from '../api/variantApi';
import { getAttributeTypes } from '../api/attributeApi';
import { useCart } from '../context/CartContext';
import ProductImageGallery from '../components/product/ProductImageGallery';
import { ProductConfigurator } from '../components/product/configurator/ProductConfigurator';
import { PriceDisplay, StockIndicator } from '../components/product/configurator/PriceStockComponents';
import { useSubmissionLock } from '../hooks/useSubmissionLock';
import '../styles/ProductDetails.css';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(amount));

/**
 * PHASE 5 — Safe float parse for Decimal128-serialized prices.
 * Returns null (never 0) when the value is unavailable, so UI can
 * distinguish "unparseable" from "genuinely zero".
 */
const parsePrice = (val) => {
    if (val === null || val === undefined) return null;
    // Backend serialises Decimal128 as { $numberDecimal: "..." } or plain string
    const raw = typeof val === 'object' && val.$numberDecimal ? val.$numberDecimal : val;
    const n = parseFloat(String(raw));
    if (isNaN(n)) return null;
    // Float safety: round to 2dp so 189900.000001 becomes 189900.00
    return Number(n.toFixed(2));
};

// ─── INLINE TOAST ─────────────────────────────────────────────────────────────
const useToast = () => {
    const [toast, setToast] = useState(null);
    const timerRef = useRef(null);
    const show = useCallback((message, type = 'info') => {
        clearTimeout(timerRef.current);
        setToast({ message, type, id: Date.now() });
        timerRef.current = setTimeout(() => setToast(null), 3500);
    }, []);
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
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ProductDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toast, show: showToast } = useToast();
    const selectorRef = useRef(null);
    const { executeSafe, isSubmitting: addingToCart } = useSubmissionLock();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [allVariantsOOS, setAllVariantsOOS] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [lastResolvedVariant, setLastResolvedVariant] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [conflictInfo, setConflictInfo] = useState(null);

    // ── DATA FETCHING ─────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                setError(null);

                const productData = await getProductBySlug(slug);

                if (!productData || productData.status?.toLowerCase() !== 'active' || productData.isDeleted) {
                    if (!cancelled) setError('Product not found');
                    return;
                }

                if (!cancelled) setProduct(productData);

                if (!productData._id) return;

                const idStr = String(productData._id);
                if (!/^[a-f\d]{24}$/i.test(idStr)) {
                    if (!cancelled) setError('Invalid product ID format');
                    return;
                }

                // Fetch variants + attribute types in parallel
                const [variantsRes] = await Promise.all([
                    getVariantsByProduct(productData._id),
                    getAttributeTypes(),
                ]);

                if (cancelled) return;

                // Unwrap enterprise API response shape.
                // axios interceptor: response → response.data, so:
                //   variantsRes = { success, count, selectors, data: [...variants] }
                // We want the `data` array.
                const rawVariants = Array.isArray(variantsRes)
                    ? variantsRes                            // already an array
                    : (variantsRes?.data ?? variantsRes ?? []);  // unwrap .data or fallback
                const variantsList = Array.isArray(rawVariants) ? rawVariants : [];

                // ─────────────────────────────────────────────────────────────

                // PHASE 3 — Safe variant filtering
                // Rule: show ALL ACTIVE variants to the configurator.
                //   isActive     → passes to variants[] (configurator uses this)
                //   hasStock     → gates Add-to-Cart only
                //
                // null stock = no inventory record (pass-through; gate at cart)
                // 0 stock    = explicit OOS (show in configurator, cart blocked)
                // N stock    = sellable
                // ─────────────────────────────────────────────────────────────
                const activeVariants = variantsList.filter(v => v.status === 'ACTIVE');

                // PHASE 4 — PDP never disappears
                // If no ACTIVE variants at all, set error (true product not found)
                if (activeVariants.length === 0) {
                    if (!cancelled) setError('No active variants found for this product.');
                    return;
                }

                // If all ACTIVE variants are explicitly OOS (stock === 0),
                // set a banner flag but still render the page.
                const allOOS = activeVariants.every(v => (v.stock ?? 0) === 0);
                if (!cancelled) {
                    setAllVariantsOOS(allOOS);
                    setVariants(activeVariants);
                }

            } catch (err) {
                console.error('[ProductDetailPage] fetchData error:', err);
                if (!cancelled) setError('Failed to load product');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => { cancelled = true; };
    }, [slug]);

    // ── Phase 8: Image Gallery Switch Race Protection ───────────────────────
    // Using a derived key to force React to remount/reset the gallery on variant change
    const galleryKey = useMemo(() => {
        return selectedVariant?._id || 'product-base';
    }, [selectedVariant]);

    // Track resolution for UX stability
    useEffect(() => {
        if (selectedVariant) {
            setLastResolvedVariant(selectedVariant);
            setConflictInfo(null); // Clear old conflicts on new selection
        }
    }, [selectedVariant]);

    // ── PHASE 5 — Canonical price from resolved variant ───────────────────────
    // currentPrice is ONLY the resolvedPrice — never the base price.
    const currentPrice = useMemo(() => {
        if (!selectedVariant) return null;
        return parsePrice(selectedVariant.resolvedPrice);
    }, [selectedVariant]);

    // compareAtPrice is shown ONLY when strictly greater than resolvedPrice.
    const compareAtPrice = useMemo(() => {
        const cap = parsePrice(selectedVariant?.compareAtPrice ?? product?.compareAtPrice);
        if (cap === null || currentPrice === null) return null;
        return cap > currentPrice ? cap : null;
    }, [selectedVariant, product, currentPrice]);

    // ── Gallery images ────────────────────────────────────────────────────────
    const galleryImages = useMemo(() => {
        const target = selectedVariant || product;
        if (!target) return ['https://via.placeholder.com/600x600?text=No+Image'];

        const imgs = target.imageGallery?.length > 0 ? target.imageGallery : target.images;
        if (!imgs || imgs.length === 0) return ['https://via.placeholder.com/600x600?text=No+Image'];

        return imgs.map(img => typeof img === 'string' ? img : img.url);
    }, [selectedVariant, product]);

    // ── Dynamic title ─────────────────────────────────────────────────────────
    const displayTitle = useMemo(() => {
        if (!selectedVariant) return product?.name || 'Product';
        const color = selectedVariant.colorId?.name || selectedVariant.color?.name;
        return color ? `${product.name} — ${color}` : product.name;
    }, [product, selectedVariant]);

    // ── Alternatives for OOS ──────────────────────────────────────────────────
    const alternatives = useMemo(() => {
        if (!selectedVariant || (selectedVariant.stock ?? 0) > 0) return [];
        return variants
            .filter(v => (v.stock ?? 0) > 0 && v._id !== selectedVariant._id)
            .slice(0, 3);
    }, [selectedVariant, variants]);

    // ── PHASE 4 — Quantity safety on variant switch ───────────────────────────
    useEffect(() => {
        if (!selectedVariant) return;
        const avail = selectedVariant.stock ?? 0;
        if (avail === 0) {
            setQuantity(1);
        } else if (quantity > avail) {
            // Clamp to max available
            setQuantity(avail);
        }
    }, [selectedVariant, quantity]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── PHASE 6 — handleAddToCart with freshness validation ───────────────────
    const handleAddToCart = useCallback(async () => {
        if (!selectedVariant) {
            showToast('Please select all options first.', 'warn');
            selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        await executeSafe(async () => {
            try {
                // 1. Lightweight Server Validation (Phase 1)
                const validation = await validateVariantForCart({
                    variantId: selectedVariant._id,
                    quantity,
                    clientPrice: currentPrice,
                });

                if (!validation.success) {
                    // Phase 10: Conflict Handling
                    if (validation.code === 'PRICE_MISMATCH') {
                        setConflictInfo({
                            type: 'PRICE',
                            oldPrice: currentPrice,
                            newPrice: validation.serverPrice,
                            message: validation.message
                        });
                        return;
                    }
                    if (validation.code === 'INSUFFICIENT_STOCK') {
                        showToast(validation.message || 'Item just sold out.', 'error');
                        // Suggest recovery (Phase 9)
                        return;
                    }
                    throw new Error(validation.message || 'Validation failed');
                }

                // 2. Add to Cart with authoritative data
                const finalPrice = validation.data?.serverPrice ?? currentPrice;

                // Construct human-readable attributes for cart UI
                const displayAttributes = {};
                if (selectedVariant.colorId?.name) displayAttributes.Color = selectedVariant.colorId.name;
                (selectedVariant.sizes || []).forEach(sz => {
                    if (sz.category) displayAttributes[sz.category] = sz.sizeId?.displayName || sz.sizeId?.value;
                });

                addToCart({
                    variantId: selectedVariant._id,
                    productId: product._id,
                    name: product.name,
                    sku: selectedVariant.sku,
                    price: finalPrice,
                    currency: product.currency || 'INR',
                    quantity,
                    image: galleryImages[0],
                    attributes: displayAttributes,
                    attributeValueIds: selectedVariant.attributeValueIds || [],
                    stock: validation.data?.availableStock ?? selectedVariant.stock
                });
                showToast('Added to cart!', 'success');

            } catch (err) {
                console.error('[PDP_CART_ERROR]', err);
                showToast(err.message || 'Failed to add item.', 'error');
            }
        });
    }, [selectedVariant, currentPrice, quantity, product, galleryImages, executeSafe, addToCart, showToast]);

    const handleBuyNow = useCallback(async () => {
        await handleAddToCart();
        navigate('/cart');
    }, [handleAddToCart, navigate]);

    // ── Tab content ───────────────────────────────────────────────────────────
    const renderTabContent = () => {
        if (!product) return null;
        switch (activeTab) {
            case 'description':
                return (
                    <div className="tab-pane fade-in">
                        <div
                            className="description-content"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(product.description || '')
                            }}
                        />
                    </div>
                );
            case 'features':
                return (
                    <div className="tab-pane fade-in">
                        {product.features?.length > 0 ? (
                            <ul className="features-list">
                                {product.features.map((f, idx) => (
                                    <li key={idx}><span>{f}</span></li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-data">No specific features listed.</p>
                        )}
                    </div>
                );
            case 'specs': {
                const specAttrs = selectedVariant?.attributes?.filter(a => a.role === 'SPECIFICATION') || [];
                return (
                    <div className="tab-pane fade-in specs-grid">
                        {specAttrs.length > 0 && (
                            <div className="specs-section">
                                <h4>Technical Specifications</h4>
                                <div className="specs-table">
                                    {specAttrs.map((attr, idx) => (
                                        <div className="spec-row" key={idx}>
                                            <span className="label">{attr.type}</span>
                                            <span className="value">{attr.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            default: return null;
        }
    };

    const ConflictBanner = ({ info, onResolve }) => (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <span className="text-amber-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-amber-800">
                        <span className="font-bold">Price Update:</span> {info.message}
                    </p>
                    <div className="mt-2 text-xs text-amber-700 flex space-x-4">
                        <span>Original: <del>₹{info.oldPrice}</del></span>
                        <span className="font-bold text-amber-900">New: ₹{info.newPrice}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={onResolve}
                        className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded transition-colors"
                    >
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );

    // ── RENDER ────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="product-details-container">
            <div className="container"><PDPSkeleton /></div>
        </div>
    );

    // PHASE 4 — Only hide the page if the product itself is not found.
    // OOS / inventory issues render an inline banner, NOT a blank page.
    if (!product) return (
        <div className="error-container">
            <h3>Product not found</h3>
            <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <h3>{error}</h3>
            <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
    );

    // PHASE 3 — Stock-aware Add-to-Cart gate
    // isActive is guaranteed (only ACTIVE variants are in state)
    // hasStock controls whether the cart action is permitted
    const currentStock = selectedVariant ? (selectedVariant.stock ?? null) : null;
    // isOutOfStock: only true when stock is EXPLICITLY 0 — not when null (unknown)
    const isOutOfStock = currentStock === 0;
    // canAddToCart: needs a selected variant with stock > 0 OR unknown stock (null)
    const canAddToCart = selectedVariant && currentStock !== 0;
    const isFullySelected = !!selectedVariant;
    const maxQty = Math.min(10, currentStock ?? 1); // null stock → allow qty 1 (gated at server)

    return (
        <div className="product-details-container">
            {/* Toast */}
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
                    {/* PHASE 4 — All-OOS inline banner (page stays visible) */}
                    {allVariantsOOS && (
                        <div className="oos-banner" role="alert">
                            <span className="oos-banner__icon">🔔</span>
                            <span className="oos-banner__text">
                                All configurations of this product are currently out of stock.
                                You can still browse options below.
                            </span>
                        </div>
                    )}

                    {conflictInfo && (
                        <ConflictBanner
                            info={conflictInfo}
                            onResolve={() => setConflictInfo(null)}
                        />
                    )}

                    <div className="product-main-grid">
                        {/* Left: Gallery */}
                        <div className="gallery-section">
                            {/* Phase 8: Key forces gallery reset on switch */}
                            <ProductImageGallery
                                key={galleryKey}
                                images={galleryImages}
                                alt={displayTitle}
                            />
                        </div>

                        {/* Right: Details */}
                        <div className="product-info-section">
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
                                    price={conflictInfo?.newPrice ?? currentPrice}
                                    originalPrice={compareAtPrice}
                                    currency={product.currency}
                                    loading={loading}
                                    noVariantSelected={!selectedVariant}
                                />
                                {selectedVariant && (
                                    <div className="stock-wrapper">
                                        <StockIndicator stock={currentStock} />

                                        {/* Phase 9: Recovery Suggestion */}
                                        {isOutOfStock && alternatives.length > 0 && (
                                            <div className="alternatives-box mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Available Alternatives:</span>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {alternatives.map(alt => (
                                                        <button
                                                            key={alt._id}
                                                            onClick={() => setSelectedVariant(alt)}
                                                            className="text-xs bg-white hover:border-blue-500 border border-slate-200 px-3 py-2 rounded-md shadow-sm transition-all flex items-center"
                                                        >
                                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                                            {alt.colorId?.name || 'In Stock'} ({alt.stock})
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Configurator — receives ONLY sellable variants */}
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
                                            disabled={isOutOfStock || !isFullySelected}
                                        >
                                            {/* PHASE 4: Clamp to availableStock */}
                                            {[...Array(maxQty)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        id="add-to-cart-btn"
                                        className={`btn-add-cart ${!isFullySelected ? 'btn-add-cart--unselected' :
                                            isOutOfStock ? 'btn-add-cart--oos' :
                                                addingToCart ? 'btn-add-cart--loading' : ''
                                            }`}
                                        onClick={handleAddToCart}
                                        // PHASE 3: disabled only when fully OOS (stock===0)
                                        // Unselected shows tooltip-like hint, not disabled
                                        disabled={addingToCart || isOutOfStock}
                                    >
                                        {addingToCart
                                            ? 'Validating…'
                                            : isOutOfStock
                                                ? 'Just Sold Out'
                                                : !isFullySelected
                                                    ? 'Select Options'
                                                    : 'Add to Cart'}
                                    </button>

                                    {isFullySelected && !isOutOfStock && (
                                        <button
                                            id="buy-now-btn"
                                            disabled={addingToCart}
                                            className="btn-buy-now"
                                            onClick={handleBuyNow}
                                        >
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

            {/* Mobile Sticky Bar */}
            <div className="mobile-sticky-bar" aria-hidden="false">
                <div className="mobile-sticky-bar__price">
                    {(conflictInfo?.newPrice ?? currentPrice) !== null
                        ? `₹${conflictInfo?.newPrice ?? currentPrice}`
                        : '—'}
                </div>
                <button
                    className={`btn-add-cart btn-add-cart--mobile ${!isFullySelected || isOutOfStock ? 'disabled' : ''}`}
                    onClick={handleAddToCart}
                    disabled={addingToCart || isOutOfStock}
                >
                    {addingToCart ? '...' : !isFullySelected ? 'Select Options' : isOutOfStock ? 'OOS' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
};

export default ProductDetailPage;
