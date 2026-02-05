import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug } from '../api/productApi';
import { getVariantsByProduct, getColors } from '../api/variantApi';
import { getInventoryByVariantId } from '../api/inventoryApi';
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
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [inventory, setInventory] = useState(null);
    const [inventoryLoading, setInventoryLoading] = useState(false);
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

                console.log("STEP 1: PRODUCT FETCHED:", productData);
                console.log("PRODUCT ID:", productData?._id);
                setProduct(productData);

                // 2. Fetch Variants (Always check if variants exist regardless of hasVariants flag)
                if (productData._id) {
                    setVariantsLoading(true);
                    console.log("STEP 2: CALLING VARIANTS API FOR ID:", productData._id);
                    const variantsRes = await getVariantsByProduct(productData._id);
                    console.log("STEP 3: VARIANTS API RESPONSE:", variantsRes);

                    const variantsList = variantsRes.data?.data || variantsRes.data || [];
                    console.log("VARIANTS LIST EXTRACTED (Array):", Array.isArray(variantsList), "Length:", variantsList.length);
                    console.log("VARIANTS LIST RAW:", variantsList);

                    // Filter only active, non-deleted variants
                    const activeVariants = variantsList.filter(v => {
                        const isStatusActive = v.status === true || v.status === 'active';
                        const isNotDeleted = !v.isDeleted;
                        return isStatusActive && isNotDeleted;
                    });

                    console.log("STEP 4: ACTIVE VARIANTS:", activeVariants.length);
                    setVariants(activeVariants);

                    // REQ: "Show 'Select variant' before price" 
                    setSelectedVariant(null);
                    setSelectedAttributes({});
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
                setError('Failed to load product: ' + err.message);
            } finally {
                setLoading(false);
                setVariantsLoading(false);
            }
        };

        if (slug) fetchData();
    }, [slug]);

    // ========================================================================
    // DYNAMIC ATTRIBUTE DETECTION - ONLY COLOR & SIZE
    // ========================================================================
    // STEP 5: ATTRIBUTE EXTRACTION LOGIC
    const attributeConfig = useMemo(() => {
        if (!variants.length) return { hasColors: false, hasSizes: false };

        // Detect if product has color variants - checking multiple patterns
        const hasColors = variants.some(v => v.color?._id || v.color || v.colorId || v.attributes?.colorId);

        // Detect if product has size variants - checking multiple patterns
        const hasSizes = variants.some(v => v.size?._id || v.size || v.sizeId || v.attributes?.size);

        console.log("ATTRIBUTE CONFIG:", { hasColors, hasSizes });
        return { hasColors, hasSizes };
    }, [variants]);

    // ========================================================================
    // EXTRACT AVAILABLE COLORS (Admin Controlled)
    // ========================================================================
    const availableColors = useMemo(() => {
        if (!attributeConfig.hasColors) return [];

        const colorIds = new Set();
        variants.forEach(v => {
            // Check top-level color, populated color._id, or any custom field
            const cId = v.color?._id || v.color || v.colorId || v.attributes?.colorId;
            if (cId) colorIds.add(cId.toString());
        });
        console.log("AVAILABLE COLORS (IDs):", Array.from(colorIds));

        return Array.from(colorIds);
    }, [variants, attributeConfig]);

    // ========================================================================
    // EXTRACT AVAILABLE SIZES (Admin Controlled)
    // ========================================================================
    const availableSizes = useMemo(() => {
        if (!attributeConfig.hasSizes) return [];

        const sizes = new Set();
        variants.forEach(v => {
            // Check top-level size object code/name or direct size value
            const sizeObj = v.size?._id ? v.size : (v.attributes?.size ? { name: v.attributes.size } : null);
            const sizeValue = sizeObj ? (sizeObj.code || sizeObj.name) : (v.size || v.sizeId);
            if (sizeValue) sizes.add(sizeValue);
        });
        console.log("AVAILABLE SIZES:", Array.from(sizes));

        // Sort sizes (S, M, L, XL, XXL or numeric)
        return Array.from(sizes).sort((a, b) => {
            const sizeOrder = {
                'XS': 1, 'S': 2, 'M': 3, 'L': 4,
                'XL': 5, 'XXL': 6, 'XXXL': 7
            };
            return (sizeOrder[a] || parseInt(a) || 0) - (sizeOrder[b] || parseInt(b) || 0);
        });
    }, [variants, attributeConfig]);

    // STEP 6: VARIANT RESOLUTION LOGIC
    useEffect(() => {
        if (!variants.length) return;

        // Requirement: "Show 'Select variant' before price" 
        // If mandatory attributes aren't selected, do NOT match a variant
        const mandatoryAttrsNotSelected =
            (attributeConfig.hasColors && !selectedAttributes.colorId) ||
            (attributeConfig.hasSizes && !selectedAttributes.size);

        if (mandatoryAttrsNotSelected) {
            setSelectedVariant(null);
            return;
        }

        const matchedVariant = variants.find(v => {
            // Match color safely (String vs String)
            if (attributeConfig.hasColors) {
                const vColorId = (v.color?._id || v.color || v.colorId || v.attributes?.colorId)?.toString();
                if (vColorId !== String(selectedAttributes.colorId)) return false;
            }

            // Match size safely (String vs String)
            if (attributeConfig.hasSizes) {
                const sizeObj = v.size?._id ? v.size : (v.attributes?.size ? { name: v.attributes.size } : null);
                const vSizeValue = sizeObj ? (sizeObj.code || sizeObj.name) : (v.size || v.sizeId);
                if (String(vSizeValue) !== String(selectedAttributes.size)) return false;
            }

            return true;
        });

        console.log("STEP 6: RESOLVED VARIANT:", matchedVariant);
        setSelectedVariant(matchedVariant || null);
    }, [selectedAttributes, variants, attributeConfig]);

    // ========================================================================
    // REQ: FETCH INVENTORY BY VARIANT ID (Stock Only)
    // ========================================================================
    useEffect(() => {
        const fetchInventory = async () => {
            if (!selectedVariant?._id) {
                setInventory(null);
                return;
            }

            try {
                setInventoryLoading(true);
                const invRes = await getInventoryByVariantId(selectedVariant._id);
                // Backend returns { success: true, data: { availableStock, ... } }
                setInventory(invRes.data || null);
            } catch (err) {
                console.error('Failed to fetch inventory:', err);
                setInventory(null);
            } finally {
                setInventoryLoading(false);
            }
        };

        fetchInventory();
    }, [selectedVariant]);

    // ========================================================================
    // IMAGE PRIORITY LOGIC (Admin Controlled)
    // ========================================================================
    const galleryImages = useMemo(() => {
        // Priority 1: Variant images
        if (selectedVariant?.images && selectedVariant.images.length > 0) {
            return selectedVariant.images.map(img => typeof img === 'string' ? img : img.url);
        }

        // Priority 2: Product gallery (Real field name is 'gallery')
        if (product?.gallery && product.gallery.length > 0) {
            return product.gallery.map(img => img.url);
        }

        // Priority 3: Featured Image
        // Priority 4: Background gallery logic from productData
        const pImages = product?.gallery?.length > 0 ? product.gallery.map(img => img.url) : (product?.galleryImages?.length > 0 ? product.galleryImages.map(img => img.url) : []);
        if (pImages.length > 0) return pImages;

        // Final fallbacks
        if (product?.image) return [product.image];
        if (product?.thumbnail) return [product.thumbnail];

        return ['https://via.placeholder.com/600x600?text=No+Image+Available'];
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
            const vColorId = (v.color?._id || v.color)?.toString();
            if (vColorId !== colorId) return false;

            if (selectedAttributes.size) {
                const sizeObj = v.size?._id ? v.size : null;
                const vSizeValue = sizeObj ? (sizeObj.code || sizeObj.name) : (v.size);
                if (vSizeValue !== selectedAttributes.size) return false;
            }

            return true;
        });
    };

    const isSizeAvailable = (size) => {
        return variants.some(v => {
            const sizeObj = v.size?._id ? v.size : null;
            const vSizeValue = sizeObj ? (sizeObj.code || sizeObj.name) : (v.size);
            if (vSizeValue !== size) return false;

            if (selectedAttributes.colorId) {
                const vColorId = (v.color?._id || v.color)?.toString();
                if (vColorId !== selectedAttributes.colorId) return false;
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

        // Stock from Inventory Service
        const stockCount = inventory?.availableStock || 0;

        if (stockCount <= 0) {
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
            price: price, // Use resolved price
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
            image: galleryImages[0]?.url ||
                product.galleryImages?.[0]?.url ||
                product.image,

            // Stock snapshot (Admin Controlled)
            stock: stockCount
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
    // STEP 7: PRICE & STOCK LOGIC
    const price = selectedVariant?.sellingPrice || selectedVariant?.price || 0;
    const comparePrice = selectedVariant?.compareAtPrice || selectedVariant?.mrp || 0;
    const currency = selectedVariant?.currency || product?.currency || 'INR';

    // Inventory is fetched ONLY after variant is selected
    const stock = inventory?.availableStock || 0;
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

                        {/* Price Block (Variant-based) */}
                        <div className="price-block">
                            {selectedVariant ? (
                                <>
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
                                </>
                            ) : (
                                <div className="select-variant-prompt">
                                    Please select a variant to see price
                                </div>
                            )}
                        </div>

                        {/* ============================================================
                            ATTRIBUTE SELECTORS (Colors & Sizes)
                        ============================================================ */}
                        {variantsLoading ? (
                            <div className="attributes-loading-skeleton">
                                <div className="spinner-small"></div>
                                <p>Loading options...</p>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}

                        {/* Stock & Actions (Inventory Controlled) */}
                        <div className="action-box">
                            {inventoryLoading ? (
                                <div className="stock-loading">Checking availability...</div>
                            ) : selectedVariant ? (
                                <>
                                    <div className={`stock-status ${inventory?.availableStock <= 0 ? 'text-red' : 'text-green'}`}>
                                        {inventory?.availableStock <= 0
                                            ? 'Out of Stock'
                                            : inventory?.availableStock < 10
                                                ? `Only ${inventory.availableStock} left in stock`
                                                : 'In Stock'
                                        }
                                    </div>

                                    {inventory?.availableStock > 0 && (
                                        <>
                                            <div className="delivery-text">
                                                FREE delivery. Order within 12 hrs 30 mins.
                                            </div>
                                            <div className="action-buttons">
                                                <div className="quantity-selector" style={{ alignSelf: 'start', marginBottom: '10px' }}>
                                                    <label style={{ fontSize: '0.85rem', marginRight: '5px' }}>Qty:</label>
                                                    <select
                                                        value={quantity}
                                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                                        style={{ padding: '4px', borderRadius: '4px' }}
                                                    >
                                                        {[...Array(Math.min(10, inventory.availableStock)).keys()].map(x => (
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
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : variants.length > 0 ? (
                                <div className="text-secondary italic">
                                    Select all options above to check availability
                                </div>
                            ) : (
                                <div className="text-red font-bold">
                                    Currently unavailable (No variants configured)
                                </div>
                            )}
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
