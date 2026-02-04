# Product Detail Page - Component Structure

## File Organization

```
customer-website/
├── src/
│   ├── pages/
│   │   └── ProductDetailPage.jsx          ← Main PDP Component (MODIFIED)
│   ├── components/
│   │   └── product/
│   │       ├── ProductImageGallery.jsx    ← Image gallery component
│   │       └── ProductCard.jsx            ← Product card (for related products)
│   ├── styles/
│   │   └── ProductDetails.css             ← PDP styles (MODIFIED)
│   ├── api/
│   │   ├── productApi.js                  ← Product API calls
│   │   ├── variantApi.js                  ← Variant API calls
│   │   └── axios.config.js                ← API configuration
│   ├── context/
│   │   └── CartContext.jsx                ← Cart state management
│   └── utils/
│       └── formatters.js                  ← Utility functions
```

---

## Component Hierarchy

```
<ProductDetailPage>
  │
  ├── Breadcrumbs
  │   └── Home › Products › Category › Product Name
  │
  ├── <div className="product-main-grid">
  │   │
  │   ├── <ProductImageGallery>
  │   │   ├── Main Viewport (with zoom)
  │   │   ├── Thumbnail Strip (desktop)
  │   │   ├── Mobile Dots (mobile)
  │   │   └── Lightbox Modal
  │   │
  │   └── <div className="product-info">
  │       ├── Product Title
  │       ├── Brand Link
  │       ├── Price Block
  │       │   ├── Selling Price
  │       │   ├── Compare Price (strikethrough)
  │       │   └── Discount Badge
  │       │
  │       ├── Variant Selectors
  │       │   ├── Color Swatches (if color attribute exists)
  │       │   └── Text Buttons (for storage/RAM/size)
  │       │
  │       └── Action Box
  │           ├── Stock Status
  │           ├── Delivery Info
  │           ├── Quantity Selector
  │           ├── Add to Cart Button
  │           └── Buy Now Button
  │
  └── <div className="tabs-container">
      ├── Tabs Header
      │   ├── Description Tab
      │   └── Specifications Tab
      │
      └── Tab Content
          ├── Description Panel
          └── Specifications Table
```

---

## State Management

### Component State
```javascript
const [product, setProduct] = useState(null);
const [variants, setVariants] = useState([]);
const [colorMaster, setColorMaster] = useState([]);
const [selectedVariant, setSelectedVariant] = useState(null);
const [selectedAttributes, setSelectedAttributes] = useState({});
const [quantity, setQuantity] = useState(1);
const [activeTab, setActiveTab] = useState('description');
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### Computed Values (useMemo)
```javascript
// Extracts unique attribute options from all variants
const attributeGroups = useMemo(() => {
  // Returns: { Color: ['Black', 'Violet'], Storage: ['128GB', '256GB'] }
}, [variants]);

// Gets images for currently selected variant
const galleryImages = useMemo(() => {
  // Returns: ['/uploads/variant1.jpg', '/uploads/variant2.jpg']
}, [selectedVariant]);
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Navigates to PDP                   │
│                    /product/:slug                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              useEffect (on mount / slug change)             │
│  1. Fetch Product by Slug                                   │
│  2. Fetch Variants by Product ID                            │
│  3. Fetch Color Master                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Filter Active Variants                    │
│         (status !== false && !isDeleted)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Auto-Select First Variant                      │
│  Priority: First in-stock variant OR first variant          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Update UI State                            │
│  - selectedVariant                                          │
│  - selectedAttributes                                       │
│  - galleryImages                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Render Product Page                       │
│  - Display variant images                                   │
│  - Show variant price                                       │
│  - Show stock status                                        │
│  - Render attribute selectors                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              User Selects Different Attribute               │
│         (e.g., changes color from Black to Violet)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           handleAttributeSelect(key, value)                 │
│  Updates: selectedAttributes = { color: 'Violet', ... }     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│        useEffect (on selectedAttributes change)             │
│  Find variant matching all selected attributes              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Update selectedVariant                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         galleryImages useMemo Re-computes                   │
│  Loads new variant's images into gallery                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                UI Updates Automatically                     │
│  - Gallery shows new images                                 │
│  - Price updates                                            │
│  - Stock updates                                            │
│  - Availability updates                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              User Clicks "Add to Cart"                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               handleAddToCart()                             │
│  1. Validate selectedVariant exists                         │
│  2. Check stock availability                                │
│  3. Create cart item with variantId                         │
│  4. Call addToCart(product, selectedVariant, quantity)      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   CartContext                               │
│  Stores item with variantId, price snapshot, etc.           │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Functions

### 1. handleAttributeSelect
```javascript
const handleAttributeSelect = (key, value) => {
  setSelectedAttributes(prev => ({
    ...prev,
    [key.toLowerCase()]: value
  }));
};
```
**Purpose:** Updates selected attributes when user clicks color/size/storage

---

### 2. isAttributeAvailable
```javascript
const isAttributeAvailable = (attrKey, attrValue) => {
  return variants.some(v => {
    if (!v.attributes) return false;
    const matchesOtherAttrs = Object.entries(selectedAttributes).every(([key, value]) => {
      if (key.toLowerCase() === attrKey.toLowerCase()) return true;
      const vVal = v.attributes[key] || v.attributes[key.toLowerCase()];
      return vVal === value;
    });
    const matchesThisAttr = (v.attributes[attrKey] || v.attributes[attrKey.toLowerCase()]) === attrValue;
    return matchesOtherAttrs && matchesThisAttr && v.stock > 0;
  });
};
```
**Purpose:** Checks if an attribute option is available (has stock) given current selections

---

### 3. getColorHex
```javascript
const getColorHex = (colorName) => {
  const colorObj = colorMaster.find(c => 
    c.name?.toLowerCase() === colorName?.toLowerCase()
  );
  return colorObj?.hexCode || colorObj?.colorCode || '#cccccc';
};
```
**Purpose:** Gets hex color code from Color Master for color swatches

---

### 4. handleAddToCart
```javascript
const handleAddToCart = () => {
  if (!selectedVariant) {
    alert('Please select all product options');
    return;
  }

  if (selectedVariant.stock <= 0) {
    alert('This variant is out of stock');
    return;
  }

  const cartItem = {
    variantId: selectedVariant._id,
    productId: product._id,
    name: product.name,
    price: selectedVariant.sellingPrice || selectedVariant.price,
    currency: selectedVariant.currency,
    image: selectedVariant.image || selectedVariant.images?.[0],
    attributes: selectedVariant.attributes,
    sku: selectedVariant.sku
  };

  addToCart(product, selectedVariant, quantity);
};
```
**Purpose:** Validates and adds selected variant to cart

---

## Responsive Breakpoints

```css
/* Desktop (default) */
.product-main-grid {
  grid-template-columns: 45% 55%;
  gap: 4rem;
}

/* Mobile (< 768px) */
@media (max-width: 768px) {
  .product-main-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .action-box {
    position: fixed;
    bottom: 0;
    /* Sticky cart buttons */
  }
}
```

---

## CSS Classes Reference

### Layout
- `.product-details-container` - Main wrapper
- `.product-main-grid` - Two-column layout (desktop)
- `.product-info` - Right column with product details

### Gallery
- `.gallery-wrapper` - Image gallery container
- `.main-viewport` - Main image display area
- `.thumbnails-strip` - Vertical thumbnail list
- `.mobile-dots` - Mobile image indicators

### Variant Selectors
- `.attributes-container` - Wrapper for each attribute group
- `.attr-row` - Single attribute selector row
- `.attr-label` - Attribute name label
- `.swatches` - Container for color/size options
- `.swatch-color` - Color circle button
- `.swatch-text` - Text button (storage/RAM/size)

### Pricing
- `.price-block` - Price section wrapper
- `.price-main` - Large selling price
- `.price-sub` - Compare price and discount
- `.currency` - Currency symbol
- `.amount` - Price number

### Actions
- `.action-box` - Stock and cart buttons container
- `.stock-status` - Stock availability text
- `.delivery-text` - Delivery information
- `.btn-primary-action` - Add to Cart button
- `.btn-secondary-action` - Buy Now button

### Tabs
- `.tabs-container` - Tabs section wrapper
- `.tabs-header` - Tab buttons row
- `.tab-btn` - Individual tab button
- `.tab-content` - Tab panel content

---

## Performance Optimizations

### 1. Memoization
```javascript
// Only recalculates when variants change
const attributeGroups = useMemo(() => { ... }, [variants]);

// Only recalculates when selectedVariant changes
const galleryImages = useMemo(() => { ... }, [selectedVariant]);
```

### 2. Conditional Rendering
```javascript
// Only render if variant is selected
{selectedVariant && (
  <SpecificationsTable variant={selectedVariant} />
)}
```

### 3. Efficient Updates
```javascript
// useEffect only runs when selectedAttributes or variants change
useEffect(() => {
  // Find matching variant
}, [selectedAttributes, variants]);
```

---

## Error States

### 1. Product Not Found
```jsx
if (error || !product) {
  return (
    <div className="container p-xl text-center">
      <h3>{error || 'Product not found'}</h3>
      <Link to="/products">Continue Shopping</Link>
    </div>
  );
}
```

### 2. Loading State
```jsx
if (loading) {
  return (
    <div className="container p-xl text-center">
      <div className="spinner"></div>
    </div>
  );
}
```

### 3. No Variant Selected
```jsx
if (!selectedVariant) {
  alert('Please select all product options');
  return;
}
```

---

## Integration Points

### 1. Cart Context
```javascript
import { useCart } from '../context/CartContext';
const { addToCart } = useCart();
```

### 2. Product API
```javascript
import { getProductBySlug } from '../api/productApi';
const productData = await getProductBySlug(slug);
```

### 3. Variant API
```javascript
import { getVariantsByProduct, getColors } from '../api/variantApi';
const variantsRes = await getVariantsByProduct(productData._id);
const colorsRes = await getColors();
```

### 4. Formatters
```javascript
import { formatCurrency, getImageUrl } from '../utils/formatters';
```

---

## Testing Guide

### Unit Tests
```javascript
// Test variant matching
test('finds correct variant when attributes selected', () => {
  const variants = [...];
  const selected = { color: 'Black', storage: '128GB' };
  const result = findMatchingVariant(variants, selected);
  expect(result.sku).toBe('SAM-S23-BLK-128');
});

// Test availability checking
test('disables unavailable combinations', () => {
  const available = isAttributeAvailable('storage', '512GB');
  expect(available).toBe(false);
});
```

### Integration Tests
```javascript
// Test full flow
test('user can select variant and add to cart', async () => {
  render(<ProductDetailPage />);
  await waitFor(() => expect(screen.getByText('Samsung Galaxy S23')).toBeInTheDocument());
  
  // Select color
  fireEvent.click(screen.getByTitle('Phantom Black'));
  
  // Select storage
  fireEvent.click(screen.getByText('256GB'));
  
  // Add to cart
  fireEvent.click(screen.getByText('Add to Cart'));
  
  expect(mockAddToCart).toHaveBeenCalledWith(
    expect.objectContaining({ variantId: expect.any(String) })
  );
});
```

---

## Deployment Checklist

- [ ] Environment variables configured (`VITE_UPLOADS_URL`)
- [ ] API endpoints accessible from frontend
- [ ] Image URLs resolve correctly
- [ ] Color Master populated with all colors
- [ ] All variants have required fields
- [ ] Stock levels are accurate
- [ ] Currency codes are valid
- [ ] Error boundaries implemented
- [ ] Loading states tested
- [ ] Mobile responsive verified
- [ ] Cross-browser tested
- [ ] Performance profiled
- [ ] SEO meta tags added
- [ ] Analytics tracking added
