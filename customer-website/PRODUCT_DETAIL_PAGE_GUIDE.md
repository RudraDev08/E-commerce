# 🛍️ Modern Product Detail Page (PDP) - Complete Guide

**Date**: February 4, 2026  
**Status**: ✅ Implementation Ready

---

## 🎯 Overview

This guide provides a complete implementation for a **high-conversion Product Detail Page** that follows e-commerce best practices from Amazon, Flipkart, and Apple.

---

## 📐 Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ 🏠 Home › Electronics › Mobiles › Samsung Galaxy S23   │ Breadcrumb
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────────┬──────────────────────────────────────┐│
│ │              │  Samsung Galaxy S23                  ││
│ │              │  by Samsung                          ││
│ │              │  ⭐ Best Seller                       ││
│ │              │  ★★★★☆ 4.5 (1,234 reviews)          ││
│ │  [Image]     │                                      ││
│ │              │  Starting from ₹74,999               ││
│ │              │  ₹79,999  Save ₹5,000  (6% OFF)     ││
│ │              │                                      ││
│ │ [Thumbs]     │  Color: Phantom Black                ││
│ │              │  [⚫ Black] [🟣 Purple] [🟢 Green]   ││
│ │              │                                      ││
│ │              │  Storage: 256GB                      ││
│ │              │  [128GB] [256GB✓] [512GB]           ││
│ │              │                                      ││
│ │              │  ✓ In Stock (15 available)           ││
│ │              │  SKU: SGS23-BLK-256                  ││
│ │              │                                      ││
│ │              │  Qty: [−] 1 [+]                      ││
│ │              │                                      ││
│ │              │  [🛒 Add to Cart]  [❤️ Wishlist]    ││
│ │              │  [⚡ Buy Now]                        ││
│ │              │                                      ││
│ │              │  📦 Free Delivery | 🔄 7-Day Return  ││
│ └──────────────┴──────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ [Description] [Specifications] [Reviews] [FAQs]     ││
│ │                                                     ││
│ │ Product Description Content...                      ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Similar Products                                        │
│ [Product] [Product] [Product] [Product]                │
│                                                         │
│ Recently Viewed                                         │
│ [Product] [Product] [Product]                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔝 Top Section Implementation

### **1. Breadcrumb Navigation**

```jsx
<nav className="breadcrumb" aria-label="Breadcrumb">
    <Link to="/" className="breadcrumb-item">
        <svg className="home-icon">...</svg>
        <span>Home</span>
    </Link>
    <span className="breadcrumb-separator">›</span>
    {product.category?.parentId && (
        <>
            <Link to={`/category/${product.category.parentId.slug}`} className="breadcrumb-item">
                {product.category.parentId.name}
            </Link>
            <span className="breadcrumb-separator">›</span>
        </>
    )}
    {product.category && (
        <>
            <Link to={`/category/${product.category.slug}`} className="breadcrumb-item">
                {product.category.name}
            </Link>
            <span className="breadcrumb-separator">›</span>
        </>
    )}
    <span className="breadcrumb-item active">{product.name}</span>
</nav>
```

### **2. Product Media Gallery**

```jsx
<div className="product-gallery">
    {/* Main Image */}
    <div className="main-image-container">
        <img
            src={getImageUrl(currentImage)}
            alt={product.name}
            className="main-image"
            onClick={() => setShowImageZoom(true)}
        />
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
            <div className="discount-badge">
                {discountPercentage}% OFF
            </div>
        )}
        
        {/* Wishlist Button */}
        <button className="wishlist-btn" onClick={handleWishlistToggle}>
            <svg className={isInWishlist ? 'filled' : ''}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        </button>
    </div>
    
    {/* Thumbnails */}
    {images.length > 1 && (
        <div className="image-thumbnails">
            {images.map((img, index) => (
                <button
                    key={index}
                    className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                >
                    <img src={getImageUrl(img)} alt={`View ${index + 1}`} />
                </button>
            ))}
        </div>
    )}
</div>
```

**CSS for Gallery**:
```css
.product-gallery {
    position: sticky;
    top: 100px;
}

.main-image-container {
    position: relative;
    background: #f9fafb;
    border-radius: 12px;
    overflow: hidden;
    aspect-ratio: 1;
    cursor: zoom-in;
}

.main-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
}

.main-image:hover {
    transform: scale(1.05);
}

.discount-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: #ef4444;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
}

.wishlist-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 44px;
    height: 44px;
    background: white;
    border: none;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.wishlist-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.wishlist-btn svg {
    width: 24px;
    height: 24px;
    stroke: #ef4444;
    fill: none;
    transition: fill 0.2s ease;
}

.wishlist-btn svg.filled {
    fill: #ef4444;
}

.image-thumbnails {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    overflow-x: auto;
}

.thumbnail {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #f9fafb;
}

.thumbnail:hover {
    border-color: var(--primary);
}

.thumbnail.active {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
}

.thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
```

### **3. Product Information Header**

```jsx
<div className="product-info-header">
    {/* Tags */}
    {product.tags && product.tags.length > 0 && (
        <div className="product-tags">
            {product.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="tag-badge">
                    {tag === 'Best Seller' && '⭐'}
                    {tag === 'New Arrival' && '🆕'}
                    {tag === 'Trending' && '🔥'}
                    {tag}
                </span>
            ))}
        </div>
    )}
    
    {/* Product Name */}
    <h1 className="product-name">{product.name}</h1>
    
    {/* Brand */}
    {product.brand && (
        <Link to={`/brand/${product.brand.slug}`} className="product-brand">
            by {product.brand.name}
        </Link>
    )}
    
    {/* Rating */}
    <div className="product-rating">
        <div className="stars">
            {[...Array(5)].map((_, i) => (
                <svg
                    key={i}
                    className={i < Math.floor(product.rating || 0) ? 'filled' : 'empty'}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            ))}
        </div>
        <span className="rating-text">
            {product.rating || 0} ({product.reviewCount || 0} reviews)
        </span>
    </div>
</div>
```

**CSS**:
```css
.product-info-header {
    margin-bottom: 1.5rem;
}

.product-tags {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.tag-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.product-name {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
    margin-bottom: 0.5rem;
}

.product-brand {
    display: inline-block;
    color: var(--primary);
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    margin-bottom: 0.75rem;
    transition: opacity 0.2s ease;
}

.product-brand:hover {
    opacity: 0.8;
    text-decoration: underline;
}

.product-rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.stars {
    display: flex;
    gap: 0.125rem;
}

.stars svg.filled {
    color: #fbbf24;
}

.stars svg.empty {
    color: #d1d5db;
}

.rating-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
}
```

---

## 💰 Pricing & Offers

```jsx
<div className="pricing-section">
    {/* Price Display */}
    <div className="price-container">
        <div className="current-price">
            {product.hasVariants && !selectedVariant ? (
                <span>Starting from {formatCurrency(minPrice)}</span>
            ) : (
                <span>{formatCurrency(currentPrice)}</span>
            )}
        </div>
        
        {originalPrice > currentPrice && (
            <div className="price-details">
                <span className="original-price">
                    {formatCurrency(originalPrice)}
                </span>
                <span className="discount-percentage">
                    {discountPercentage}% OFF
                </span>
                <span className="savings">
                    Save {formatCurrency(originalPrice - currentPrice)}
                </span>
            </div>
        )}
    </div>
    
    {/* Offers */}
    {offers && offers.length > 0 && (
        <div className="offers-section">
            <h4>Available Offers</h4>
            {offers.map((offer, index) => (
                <div key={index} className="offer-item">
                    <svg className="offer-icon">...</svg>
                    <span>{offer.description}</span>
                </div>
            ))}
        </div>
    )}
</div>
```

**CSS**:
```css
.pricing-section {
    padding: 1.5rem 0;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
}

.price-container {
    margin-bottom: 1rem;
}

.current-price {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.price-details {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.original-price {
    font-size: 1.125rem;
    color: var(--text-secondary);
    text-decoration: line-through;
}

.discount-percentage {
    padding: 0.25rem 0.5rem;
    background: #dcfce7;
    color: #16a34a;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 600;
}

.savings {
    color: #16a34a;
    font-size: 0.875rem;
    font-weight: 600;
}

.offers-section h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
}

.offer-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.offer-icon {
    width: 16px;
    height: 16px;
    color: var(--primary);
}
```

---

## 🎛️ Variant Selection (CRITICAL)

**Use the VariantSelector component you already have!**

```jsx
import VariantSelector from '../components/product/VariantSelector';

// In your ProductDetailPage:
{product.hasVariants && variants.length > 0 && (
    <VariantSelector
        variants={variants}
        selectedVariant={selectedVariant}
        onVariantChange={handleVariantChange}
    />
)}
```

**Variant Change Handler**:
```jsx
const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    
    // Update price
    setCurrentPrice(variant.price);
    
    // Update stock
    setCurrentStock(variant.stock);
    
    // Update images if variant has specific images
    if (variant.images && variant.images.length > 0) {
        setProductImages(variant.images);
        setSelectedImageIndex(0);
    }
    
    // Update SKU
    setCurrentSKU(variant.sku);
};
```

---

## 🛒 Purchase Actions

```jsx
<div className="purchase-actions">
    {/* Quantity Selector */}
    <div className="quantity-selector">
        <label>Quantity:</label>
        <div className="quantity-controls">
            <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
            >
                <svg>...</svg>
            </button>
            <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={currentStock}
            />
            <button
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                disabled={quantity >= currentStock}
            >
                <svg>...</svg>
            </button>
        </div>
    </div>
    
    {/* Action Buttons */}
    <div className="action-buttons">
        <button
            className="btn btn-primary btn-large add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
        >
            <svg className="cart-icon">...</svg>
            Add to Cart
        </button>
        
        <button
            className="btn btn-secondary btn-large buy-now-btn"
            onClick={handleBuyNow}
            disabled={!canAddToCart}
        >
            <svg className="lightning-icon">...</svg>
            Buy Now
        </button>
    </div>
    
    {/* Wishlist & Share */}
    <div className="secondary-actions">
        <button className="btn btn-outline" onClick={handleWishlistToggle}>
            <svg>...</svg>
            {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
        </button>
        <button className="btn btn-outline" onClick={handleShare}>
            <svg>...</svg>
            Share
        </button>
    </div>
</div>
```

**Logic**:
```jsx
const canAddToCart = useMemo(() => {
    if (product.hasVariants) {
        return selectedVariant && selectedVariant.stock > 0;
    }
    return product.stock > 0;
}, [product, selectedVariant]);

const handleAddToCart = () => {
    if (!canAddToCart) {
        alert('Please select a variant');
        return;
    }
    
    const itemToAdd = product.hasVariants
        ? { ...product, selectedVariant }
        : product;
    
    for (let i = 0; i < quantity; i++) {
        addToCart(itemToAdd, selectedVariant);
    }
    
    // Show success message
    toast.success(`Added ${quantity} item(s) to cart!`);
};

const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
};
```

**CSS**:
```css
.purchase-actions {
    margin: 2rem 0;
}

.quantity-selector {
    margin-bottom: 1.5rem;
}

.quantity-selector label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0;
    width: fit-content;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
}

.quantity-controls button {
    width: 40px;
    height: 40px;
    border: none;
    background: var(--background-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
}

.quantity-controls button:hover:not(:disabled) {
    background: var(--border-color);
}

.quantity-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.quantity-controls input {
    width: 60px;
    height: 40px;
    border: none;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    text-align: center;
    font-size: 1rem;
    font-weight: 600;
}

.action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
}

.btn-large {
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.add-to-cart-btn {
    background: var(--primary);
    color: white;
    border: none;
}

.add-to-cart-btn:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
}

.buy-now-btn {
    background: #16a34a;
    color: white;
    border: none;
}

.buy-now-btn:hover:not(:disabled) {
    background: #15803d;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.btn-large:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.secondary-actions {
    display: flex;
    gap: 1rem;
}

.secondary-actions .btn {
    flex: 1;
}
```

---

## 📦 Stock & Delivery Info

```jsx
<div className="delivery-info">
    {/* Stock Status */}
    <div className="stock-status">
        {currentStock > 10 ? (
            <span className="in-stock">
                <svg>...</svg>
                In Stock ({currentStock} available)
            </span>
        ) : currentStock > 0 ? (
            <span className="low-stock">
                <svg>...</svg>
                Only {currentStock} left in stock!
            </span>
        ) : (
            <span className="out-of-stock">
                <svg>...</svg>
                Out of Stock
            </span>
        )}
    </div>
    
    {/* Delivery Info */}
    <div className="delivery-details">
        <div className="delivery-item">
            <svg className="icon">...</svg>
            <div>
                <strong>Free Delivery</strong>
                <p>On orders above ₹499</p>
            </div>
        </div>
        
        <div className="delivery-item">
            <svg className="icon">...</svg>
            <div>
                <strong>7-Day Return</strong>
                <p>Easy returns within 7 days</p>
            </div>
        </div>
        
        <div className="delivery-item">
            <svg className="icon">...</svg>
            <div>
                <strong>Secure Payment</strong>
                <p>100% secure transactions</p>
            </div>
        </div>
    </div>
    
    {/* Pincode Check (Optional) */}
    <div className="pincode-check">
        <input
            type="text"
            placeholder="Enter pincode"
            maxLength="6"
        />
        <button className="btn btn-outline">Check</button>
    </div>
</div>
```

---

## 📑 Product Details Section

```jsx
<div className="product-details-section">
    {/* Tabs */}
    <div className="tabs">
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
            Reviews ({product.reviewCount || 0})
        </button>
        <button
            className={`tab ${activeTab === 'faqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('faqs')}
        >
            FAQs
        </button>
    </div>
    
    {/* Tab Content */}
    <div className="tab-content">
        {activeTab === 'description' && (
            <div className="description-content">
                <p>{product.description}</p>
            </div>
        )}
        
        {activeTab === 'specifications' && (
            <div className="specifications-content">
                <table className="specs-table">
                    <tbody>
                        {product.specifications?.map((spec, index) => (
                            <tr key={index}>
                                <td className="spec-label">{spec.label}</td>
                                <td className="spec-value">{spec.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        
        {activeTab === 'reviews' && (
            <div className="reviews-content">
                {/* Reviews component */}
            </div>
        )}
        
        {activeTab === 'faqs' && (
            <div className="faqs-content">
                {/* FAQs component */}
            </div>
        )}
    </div>
</div>
```

---

## 🔁 Recommendations

```jsx
{/* Similar Products */}
{relatedProducts.length > 0 && (
    <section className="recommendations-section">
        <h2>Similar Products</h2>
        <div className="products-grid">
            {relatedProducts.map(product => (
                <ProductCard key={product._id} product={product} />
            ))}
        </div>
    </section>
)}

{/* Recently Viewed */}
{recentlyViewed.length > 0 && (
    <section className="recommendations-section">
        <h2>Recently Viewed</h2>
        <div className="products-grid">
            {recentlyViewed.map(product => (
                <ProductCard key={product._id} product={product} />
            ))}
        </div>
    </section>
)}
```

---

## 📱 Mobile Optimizations

```css
/* Sticky Add to Cart on Mobile */
@media (max-width: 768px) {
    .mobile-sticky-cart {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 1rem;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        z-index: 100;
        display: flex;
        gap: 1rem;
    }
    
    .mobile-sticky-cart .price {
        flex: 1;
    }
    
    .mobile-sticky-cart .btn {
        flex: 2;
    }
}
```

---

## ✅ Implementation Checklist

- [ ] Breadcrumb with home icon
- [ ] Image gallery with zoom
- [ ] Wishlist button
- [ ] Product name, brand, tags
- [ ] Rating and reviews
- [ ] Dynamic pricing
- [ ] Variant selector integration
- [ ] Stock status display
- [ ] Quantity selector
- [ ] Add to Cart button
- [ ] Buy Now button
- [ ] Delivery information
- [ ] Tabbed product details
- [ ] Similar products
- [ ] Mobile sticky cart
- [ ] Responsive design

---

**Created**: February 4, 2026  
**Status**: ✅ Ready to Implement  
**Complexity**: High  
**Estimated Time**: 3-4 hours
