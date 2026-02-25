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

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);          // ALL ACTIVE variants (inc. OOS)
    const [allVariantsOOS, setAllVariantsOOS] = useState(false); // Phase 4 safe guard
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

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
                const [variantsRes, attrTypesRes] = await Promise.all([
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
                const allOOS = activeVariants.every(v => v.stock !== null && v.stock !== undefined && v.stock === 0);
                if (!cancelled) setAllVariantsOOS(allOOS);

                const mappedVariants = activeVariants.map(v => ({
                    ...v,
                    // stock already joined by backend; null = unknown, 0 = OOS, N = sellable
                    stock: v.stock ?? null,
                    // Prices already parsed to float by backend flattenVariant
                    resolvedPrice: v.resolvedPrice ?? null,
                    compareAtPrice: v.compareAtPrice ?? null,
                    price: v.price ?? null,
                }));

                if (!cancelled) setVariants(mappedVariants);

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
        if (selectedVariant?.imageGallery?.length > 0) {
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

    // ── Dynamic title ─────────────────────────────────────────────────────────
    const displayTitle = useMemo(() => {
        if (!selectedVariant) return product?.name || 'Product';
        const colorObj = selectedVariant.colorId && typeof selectedVariant.colorId === 'object'
            ? selectedVariant.colorId
            : selectedVariant.color;
        const colorName = colorObj?.displayName || colorObj?.name;
        return colorName ? `${product?.name} — ${colorName}` : (product?.name || 'Product');
    }, [product, selectedVariant]);

    // ── Alternatives for OOS ──────────────────────────────────────────────────
    const alternatives = useMemo(() => {
        if (!selectedVariant || (selectedVariant.stock ?? 0) > 0) return [];
        return variants
            .filter(v => v.status === 'ACTIVE' && (v.stock ?? 0) > 0 && v._id !== selectedVariant._id)
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
    }, [selectedVariant]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── PHASE 6 — handleAddToCart with freshness validation ───────────────────
    const handleAddToCart = useCallback(async () => {
        if (!selectedVariant) {
            showToast('Please select all product options first.', 'warn');
            selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // PHASE 5: Block if price is unavailable
        if (currentPrice === null || currentPrice === undefined) {
            showToast('Price unavailable. Please reselect options.', 'error');
            return;
        }

        const availableStock = selectedVariant.stock ?? 0;
        if (availableStock <= 0) {
            showToast("We'll notify you when back in stock.", 'info');
            return;
        }

        // Guard: ensure variant has a valid ID before API call
        if (!selectedVariant?._id) {
            console.error('[handleAddToCart] selectedVariant missing _id:', selectedVariant);
            showToast('Selected item is invalid. Please refresh.', 'error');
            return;
        }

        setAddingToCart(true);
        try {
            // PHASE 8 — Server-side freshness validation (3 gates: status, stock, price)
            const validationResult = await validateVariantForCart({
                variantId: selectedVariant._id,
                quantity,
                clientPrice: currentPrice,
            });

            // If middleware returns a specific logic error (200 OK but success: false)
            // Note: axios usually throws on 4xx/5xx, but if API returns 200 with { success: false }...
            if (!validationResult.success) {
                const code = validationResult.code;
                if (code === 'PRICE_MISMATCH') {
                    showToast(validationResult.message || 'Price changed. Please refresh.', 'error');
                    // Auto-update price if provided
                    if (validationResult.serverPrice) {
                        // Logic to update local price could go here
                    }
                } else if (code === 'INSUFFICIENT_STOCK') {
                    showToast(validationResult.message || 'Not enough stock.', 'error');
                } else {
                    showToast(validationResult.message || 'Item no longer available. Please refresh.', 'error');
                }
                return;
            }

            // Build cart payload with locked authoritative price from server
            const serverPrice = parseFloat(validationResult.data?.serverPrice ?? currentPrice);
            const cartPayload = {
                variantId: selectedVariant._id,
                productId: product._id,
                name: product.name,
                sku: selectedVariant.sku,
                // Always use server-validated price
                price: serverPrice,
                currency: product.currency || 'INR',
                quantity,
                attributes: {
                    // Pull display values from populated color/size objects
                    color: (selectedVariant.colorId?.displayName || selectedVariant.colorId?.name
                        || selectedVariant.color?.displayName || selectedVariant.color?.name),
                    size: (selectedVariant.sizes?.[0]?.sizeId?.displayName
                        || selectedVariant.sizes?.[0]?.sizeId?.value
                        || selectedVariant.size?.displayName
                        || selectedVariant.size?.name),
                },
                attributeValueIds: Array.isArray(selectedVariant.attributeValueIds)
                    ? selectedVariant.attributeValueIds.map(a => (typeof a === 'object' ? a._id : a))
                    : [],
                image: galleryImages[0],
                stock: selectedVariant.stock,
            };

            addToCart(cartPayload);
            showToast(`${product.name} added to cart!`, 'success');

        } catch (err) {
            // If the validation endpoint itself fails (network), still use client-side guards
            console.error('[handleAddToCart] Validation error:', err);
            const errCode = err?.code || err?.data?.code || err?.response?.data?.code;

            if (errCode === 'PRICE_MISMATCH') {
                showToast('Price has changed. Please refresh the page.', 'error');
            } else if (errCode === 'INSUFFICIENT_STOCK') {
                showToast('Not enough stock available.', 'error');
            } else if (errCode === 'VARIANT_INACTIVE') {
                showToast('This item is no longer available.', 'error');
            } else if (errCode === 'INVALID_ID') {
                // Handle 400 Bad Request explicitly
                showToast('Invalid item selected. Please refresh.', 'error');
            } else {
                // Fallback: only add if we are sure it's just a network glitch, not a logic error.
                // If error is 400/422, we should probably BLOCK.
                // But for now, we keep the fallback for 500s.
                if (err?.response?.status === 400 || err?.response?.status === 422) {
                    showToast(err?.response?.data?.message || 'Cannot add item to cart.', 'error');
                    return;
                }

                addToCart({
                    variantId: selectedVariant._id,
                    productId: product._id,
                    name: product.name,
                    sku: selectedVariant.sku,
                    price: currentPrice,
                    currency: product.currency || 'INR',
                    quantity,
                    attributes: {},
                    image: galleryImages[0],
                    stock: selectedVariant.stock,
                });
                showToast(`${product.name} added to cart!`, 'success');
            }
        } finally {
            setAddingToCart(false);
        }
    }, [selectedVariant, currentPrice, quantity, product, galleryImages, addToCart, showToast]);

    const handleBuyNow = useCallback(async () => {
        await handleAddToCart();
        navigate('/cart');
    }, [handleAddToCart, navigate]);

    // ── Tab content ───────────────────────────────────────────────────────────
    const renderTabContent = () => {
        switch (activeTab) {
            case 'description':
                return (
                    <div className="tab-pane fade-in">
                        <div
                            className="description-content"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(product.description || '', {
                                    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote'],
                                    ALLOWED_ATTR: [],
                                })
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
                                    <li key={idx}><span className="bullet-point" /><span>{f}</span></li>
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
                        {/* PHASE 4: Render SPECIFICATION attributes beautifully */}
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
            }
            default: return null;
        }
    };

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
                    <div className="product-main-grid">
                        {/* Left: Gallery */}
                        <div className="gallery-section">
                            <ProductImageGallery images={galleryImages} alt={displayTitle} />
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
                                    price={currentPrice}
                                    originalPrice={compareAtPrice}
                                    currency={product.currency}
                                    loading={loading}
                                    noVariantSelected={!selectedVariant}
                                />
                                {selectedVariant && (
                                    <div className="stock-wrapper">
                                        <StockIndicator stock={currentStock} />
                                        {/* Alternatives for OOS variant */}
                                        {isOutOfStock && alternatives.length > 0 && (
                                            <div className="alternatives-box">
                                                <span className="alternatives-label">Also available:</span>
                                                <div className="alternatives-list">
                                                    {alternatives.map(alt => {
                                                        const altColor = alt.colorId?.displayName || alt.colorId?.name || alt.color?.name;
                                                        const altSize = alt.sizes?.[0]?.sizeId?.displayName || alt.size?.displayName;
                                                        return (
                                                            <button
                                                                key={alt._id}
                                                                onClick={() => setSelectedVariant(alt)}
                                                                className="alt-btn"
                                                            >
                                                                <span className="alt-dot" />
                                                                {altColor || 'Variant'}
                                                                {altSize ? ` · ${altSize}` : ''}
                                                                <span className="alt-stock">({alt.stock} left)</span>
                                                            </button>
                                                        );
                                                    })}
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
                                            disabled={isOutOfStock || !selectedVariant}
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
                                        aria-disabled={!canAddToCart}
                                    >
                                        {addingToCart
                                            ? 'Validating…'
                                            : !isFullySelected
                                                ? 'Select Options'
                                                : isOutOfStock
                                                    ? 'Out of Stock'
                                                    : 'Add to Cart'}
                                    </button>

                                    {isFullySelected && !isOutOfStock && (
                                        <button
                                            id="buy-now-btn"
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
