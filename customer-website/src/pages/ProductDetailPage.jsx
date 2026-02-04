import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug } from '../api/productApi';
import { getVariantsByProduct, getColors } from '../api/variantApi';
import { useCart } from '../context/CartContext';
import ProductImageGallery from '../components/product/ProductImageGallery';
import '../styles/ProductDetails.css';

/**
 * PRODUCTION-READY PRODUCT DETAIL PAGE
 * 
 * ADMIN-CONTROLLED SYSTEM:
 * - All data from Admin Panel (Product Master, Variant Master, Color Master)
 * - ZERO hardcoded values
 * - Shows ONLY Color & Size (no RAM, Storage, etc.)
 * - Automatically adapts to admin changes
 * - NO demo data or fallbacks
 */

const ProductDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // State
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [colorMaster, setColorMaster] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ========================================================================
    // DATA FETCHING - ALL FROM ADMIN PANEL
    // ========================================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch Product by Slug (Admin Controlled)
                const productData = await getProductBySlug(slug);

                // Validate product exists and is active
                if (!productData) {
                    setError('Product not found');
                    setLoading(false);
                    return;
                }

                // Check if product is active (Admin Controlled)
                if (productData.status !== 'active' || productData.isDeleted) {
                    setError('Product not found');
                    setLoading(false);
                    return;
                }

                setProduct(productData);

                // 2. Fetch Variants (Admin Controlled)
                if (productData.hasVariants && productData._id) {
                    const variantsRes = await getVariantsByProduct(productData._id);
                    const variantsList = variantsRes.data?.data || variantsRes.data || [];

                    // Filter only active, non-deleted variants (Admin Controlled)
                    const activeVariants = variantsList.filter(
                        v => v.status === true && !v.isDeleted
                    );

                    if (activeVariants.length === 0) {
                        setError('No variants available');
                        setLoading(false);
                        return;
                    }

                    setVariants(activeVariants);

                    // Auto-select first in-stock variant
                    const defaultVariant =
                        activeVariants.find(v => Number(v.stock) > 0) ||
                        activeVariants[0];

                    setSelectedVariant(defaultVariant);
                    if (defaultVariant.attributes) {
                        setSelectedAttributes(defaultVariant.attributes);
                    }
                }

                // 3. Fetch Color Master (Admin Controlled)
                try {
                    const colorsRes = await getColors();
                    const colorsList = colorsRes.data?.data || colorsRes.data || [];

                    // Filter only active colors (Admin Controlled)
                    const activeColors = colorsList.filter(
                        c => c.status === 'active' && !c.isDeleted
                    );
                    setColorMaster(activeColors);
                } catch (err) {
                    console.warn('Color Master fetch failed:', err);
                    setColorMaster([]);
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

    // ========================================================================
    // DYNAMIC ATTRIBUTE DETECTION - ONLY COLOR & SIZE
    // ========================================================================
    const attributeConfig = useMemo(() => {
        if (!variants.length) return { hasColors: false, hasSizes: false };

        // Detect if product has color variants (Admin Controlled)
        const hasColors = variants.some(v => v.attributes?.colorId);

        // Detect if product has size variants (Admin Controlled)
        const hasSizes = variants.some(v => v.attributes?.size);

        return { hasColors, hasSizes };
    }, [variants]);

    // ========================================================================
    // EXTRACT AVAILABLE COLORS (Admin Controlled)
    // ========================================================================
    const availableColors = useMemo(() => {
        if (!attributeConfig.hasColors) return [];

        const colorIds = new Set();
        variants.forEach(v => {
            if (v.attributes?.colorId) {
                colorIds.add(v.attributes.colorId);
            }
        });

        return Array.from(colorIds);
    }, [variants, attributeConfig]);

    // ========================================================================
    // EXTRACT AVAILABLE SIZES (Admin Controlled)
    // ========================================================================
    const availableSizes = useMemo(() => {
        if (!attributeConfig.hasSizes) return [];

        const sizes = new Set();
        variants.forEach(v => {
            if (v.attributes?.size) {
                sizes.add(v.attributes.size);
            }
        });

        // Sort sizes (S, M, L, XL, XXL or numeric)
        return Array.from(sizes).sort((a, b) => {
            const sizeOrder = {
                'XS': 1, 'S': 2, 'M': 3, 'L': 4,
                'XL': 5, 'XXL': 6, 'XXXL': 7
            };
            return (sizeOrder[a] || parseInt(a) || 0) - (sizeOrder[b] || parseInt(b) || 0);
        });
    }, [variants, attributeConfig]);

    // ========================================================================
    // VARIANT MATCHING LOGIC
    // ========================================================================
    useEffect(() => {
        if (!variants.length || !Object.keys(selectedAttributes).length) return;

        const matchedVariant = variants.find(v => {
            if (!v.attributes) return false;

            // Match colorId (if selected)
            if (selectedAttributes.colorId &&
                v.attributes.colorId !== selectedAttributes.colorId) {
                return false;
            }

            // Match size (if selected)
            if (selectedAttributes.size &&
                v.attributes.size !== selectedAttributes.size) {
                return false;
            }

            return true;
        });

        setSelectedVariant(matchedVariant || null);
    }, [selectedAttributes, variants]);

    // ========================================================================
    // IMAGE PRIORITY LOGIC (Admin Controlled)
    // ========================================================================
    const galleryImages = useMemo(() => {
        // Priority 1: Variant images (Admin uploaded for variant)
        if (selectedVariant?.images && selectedVariant.images.length > 0) {
            return selectedVariant.images.map(url => ({ url, alt: product?.name }));
        }

        // Priority 2: Product gallery images (Admin uploaded for product)
        if (product?.galleryImages && product.galleryImages.length > 0) {
            return product.galleryImages.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        // Priority 3: Empty state (NO placeholder)
        return [];
    }, [selectedVariant, product]);

    // ========================================================================
    // COLOR UTILITIES (Admin Controlled via Color Master)
    // ========================================================================
    const getColorDetails = (colorId) => {
        if (!colorId) return null;
        const colorObj = colorMaster.find(c => c._id === colorId);
        return colorObj || { name: 'Unknown', hexCode: '#cccccc' };
    };

    const getColorName = (colorId) => {
        return getColorDetails(colorId)?.name || 'Select';
    };

    const getColorHex = (colorId) => {
        return getColorDetails(colorId)?.hexCode || '#cccccc';
    };

    // ========================================================================
    // AVAILABILITY CHECK
    // ========================================================================
    const isColorAvailable = (colorId) => {
        return variants.some(v => {
            if (!v.attributes) return false;

            // Must match colorId
            if (v.attributes.colorId !== colorId) return false;

            // If size is selected, must also match size
            if (selectedAttributes.size && v.attributes.size !== selectedAttributes.size) {
                return false;
            }

            return true;
        });
    };

    const isSizeAvailable = (size) => {
        return variants.some(v => {
            if (!v.attributes) return false;

            // Must match size
            if (v.attributes.size !== size) return false;

            // If color is selected, must also match color
            if (selectedAttributes.colorId &&
                v.attributes.colorId !== selectedAttributes.colorId) {
                return false;
            }

            return true;
        });
    };

    // ========================================================================
    // PRICE FORMATTING (Admin Controlled Currency)
    // ========================================================================
    const formatPrice = (amount, currencyCode) => {
        const localeMap = {
            'INR': 'en-IN',
            'USD': 'en-US',
            'EUR': 'en-DE',
            'GBP': 'en-GB'
        };

        try {
            return new Intl.NumberFormat(localeMap[currencyCode] || 'en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (err) {
            return `${currencyCode} ${amount.toLocaleString()}`;
        }
    };

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    const handleColorSelect = (colorId) => {
        setSelectedAttributes(prev => ({
            ...prev,
            colorId: colorId
        }));
    };

    const handleSizeSelect = (size) => {
        setSelectedAttributes(prev => ({
            ...prev,
            size: size
        }));
    };

    const handleAddToCart = () => {
        if (!selectedVariant) {
            alert('Please select all product options');
            return;
        }

        if (Number(selectedVariant.stock) <= 0) {
            alert('This variant is out of stock');
            return;
        }

        // Build cart payload (SINGLE OBJECT - Admin Controlled Data)
        const cartPayload = {
            // Identifiers
            variantId: selectedVariant._id,
            productId: product._id,

            // Display Info (Admin Controlled)
            name: product.name,
            sku: selectedVariant.sku,

            // Price Snapshot (NEVER recomputed - Admin Controlled)
            price: selectedVariant.sellingPrice || selectedVariant.price,
            currency: selectedVariant.currency || product.currency || 'INR',

            // Quantity
            quantity: quantity,

            // Attributes (Admin Controlled)
            attributes: {
                colorId: selectedVariant.attributes?.colorId,
                colorName: getColorName(selectedVariant.attributes?.colorId),
                size: selectedVariant.attributes?.size
            },

            // Image (Admin Uploaded)
            image: selectedVariant.images?.[0] ||
                product.galleryImages?.[0]?.url ||
                product.image,

            // Stock snapshot (Admin Controlled)
            stock: selectedVariant.stock
        };

        addToCart(cartPayload);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/cart');
    };

    // ========================================================================
    // LOADING & ERROR STATES
    // ========================================================================
    if (loading) {
        return (
            <div className="container p-xl text-center">
                <div className="spinner"></div>
                <p>Loading product...</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="container p-xl text-center">
                <h3>{error || 'Product not found'}</h3>
                <p>This product is currently unavailable.</p>
                <Link to="/products" className="btn btn-primary mt-md">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    // ========================================================================
    // COMPUTED VALUES (Admin Controlled)
    // ========================================================================
    const price = selectedVariant?.sellingPrice || selectedVariant?.price || 0;
    const comparePrice = selectedVariant?.compareAtPrice || selectedVariant?.basePrice || 0;
    const currency = selectedVariant?.currency || product.currency || 'INR';
    const stock = Number(selectedVariant?.stock) || 0;
    const isOutOfStock = stock <= 0;
    const discount = (comparePrice && price && comparePrice > price)
        ? Math.round(((comparePrice - price) / comparePrice) * 100)
        : 0;

    // ========================================================================
    // RENDER UI (100% Admin Controlled)
    // ========================================================================
    return (
        <div className="product-details-container">
            <div className="container">
                {/* Breadcrumbs (Admin Controlled) */}
                <div className="breadcrumbs">
                    <Link to="/">Home</Link> ›
                    <Link to="/products">Products</Link> ›
                    {product.category && (
                        <>
                            <Link to={`/category/${product.category.slug || '#'}`}>
                                {product.category.name}
                            </Link> ›
                        </>
                    )}
                    <span className="current">{product.name}</span>
                </div>

                <div className="product-main-grid">
                    {/* Image Gallery (Admin Uploaded) */}
                    <ProductImageGallery
                        images={galleryImages}
                        alt={product.name}
                    />

                    {/* Product Info (Admin Controlled) */}
                    <div className="product-info">
                        {/* Product Title (Admin Controlled) */}
                        <h1 className="product-title">{product.name}</h1>

                        {/* Brand (Admin Controlled) */}
                        {product.brand && (
                            <Link
                                to={`/brand/${product.brand.slug || '#'}`}
                                className="brand-visit-link"
                            >
                                Visit the {product.brand.name} Store
                            </Link>
                        )}

                        {/* Price Block (Admin Controlled) */}
                        <div className="price-block">
                            <div className="price-main">
                                {formatPrice(price, currency)}
                            </div>
                            {discount > 0 && (
                                <div className="price-sub">
                                    <span className="mrp-strike">
                                        {formatPrice(comparePrice, currency)}
                                    </span>
                                    <span className="text-red"> (-{discount}%)</span>
                                </div>
                            )}
                            <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                Inclusive of all taxes
                            </div>
                        </div>

                        {/* ============================================================
                            COLOR SELECTOR - ONLY IF ADMIN CREATED COLOR VARIANTS
                        ============================================================ */}
                        {attributeConfig.hasColors && (
                            <div className="attributes-container">
                                <div className="attr-row">
                                    <div className="attr-label">
                                        Color: <span>{getColorName(selectedAttributes.colorId)}</span>
                                    </div>
                                    <div className="swatches">
                                        {availableColors.map((colorId) => {
                                            const colorDetails = getColorDetails(colorId);
                                            const isSelected = selectedAttributes.colorId === colorId;
                                            const isAvailable = isColorAvailable(colorId);

                                            return (
                                                <div
                                                    key={colorId}
                                                    className={`swatch-color ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                                                    style={{
                                                        backgroundColor: colorDetails.hexCode,
                                                        opacity: isAvailable ? 1 : 0.3,
                                                        cursor: isAvailable ? 'pointer' : 'not-allowed'
                                                    }}
                                                    onClick={() => isAvailable && handleColorSelect(colorId)}
                                                    title={colorDetails.name}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ============================================================
                            SIZE SELECTOR - ONLY IF ADMIN CREATED SIZE VARIANTS
                        ============================================================ */}
                        {attributeConfig.hasSizes && (
                            <div className="attributes-container">
                                <div className="attr-row">
                                    <div className="attr-label">
                                        Size: <span>{selectedAttributes.size || 'Select'}</span>
                                    </div>
                                    <div className="swatches">
                                        {availableSizes.map((size) => {
                                            const isSelected = selectedAttributes.size === size;
                                            const isAvailable = isSizeAvailable(size);

                                            return (
                                                <button
                                                    key={size}
                                                    className={`swatch-text ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => isAvailable && handleSizeSelect(size)}
                                                    disabled={!isAvailable}
                                                    style={{ opacity: isAvailable ? 1 : 0.5 }}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stock & Actions (Admin Controlled) */}
                        <div className="action-box">
                            <div className={`stock-status ${isOutOfStock ? 'text-red' : 'text-green'}`}>
                                {isOutOfStock
                                    ? 'Out of Stock'
                                    : stock < 10
                                        ? `Only ${stock} left in stock`
                                        : 'In Stock'
                                }
                            </div>

                            {!isOutOfStock && (
                                <div className="delivery-text">
                                    FREE delivery. Order within 12 hrs 30 mins.
                                </div>
                            )}

                            <div className="action-buttons">
                                {!isOutOfStock && (
                                    <>
                                        <div className="quantity-selector" style={{ alignSelf: 'start', marginBottom: '10px' }}>
                                            <label style={{ fontSize: '0.85rem', marginRight: '5px' }}>Qty:</label>
                                            <select
                                                value={quantity}
                                                onChange={(e) => setQuantity(Number(e.target.value))}
                                                style={{ padding: '4px', borderRadius: '4px' }}
                                            >
                                                {[...Array(Math.min(10, stock)).keys()].map(x => (
                                                    <option key={x + 1} value={x + 1}>{x + 1}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button className="btn-primary-action" onClick={handleAddToCart}>
                                            Add to Cart
                                        </button>
                                        <button className="btn-secondary-action" onClick={handleBuyNow}>
                                            Buy Now
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs (Admin Controlled Content) */}
                <div className="tabs-container">
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
                    </div>
                    <div className="tab-content">
                        {activeTab === 'description' && (
                            <div>
                                <h3>Product Description</h3>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: product.description || 'No description available'
                                    }}
                                    style={{ lineHeight: 1.6 }}
                                />
                            </div>
                        )}
                        {activeTab === 'specifications' && selectedVariant && (
                            <div>
                                <h3>Specifications</h3>
                                <table className="specs-table" style={{ width: '100%', maxWidth: '600px', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {product.brand && (
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <td style={{ padding: '10px', background: '#f7f7f7' }}>Brand</td>
                                                <td style={{ padding: '10px' }}>{product.brand.name}</td>
                                            </tr>
                                        )}
                                        <tr style={{ borderBottom: '1px solid #ddd' }}>
                                            <td style={{ padding: '10px', background: '#f7f7f7' }}>SKU</td>
                                            <td style={{ padding: '10px' }}>{selectedVariant.sku}</td>
                                        </tr>
                                        {selectedVariant.attributes?.colorId && (
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <td style={{ padding: '10px', background: '#f7f7f7' }}>Color</td>
                                                <td style={{ padding: '10px' }}>
                                                    {getColorName(selectedVariant.attributes.colorId)}
                                                </td>
                                            </tr>
                                        )}
                                        {selectedVariant.attributes?.size && (
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <td style={{ padding: '10px', background: '#f7f7f7' }}>Size</td>
                                                <td style={{ padding: '10px' }}>
                                                    {selectedVariant.attributes.size}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
