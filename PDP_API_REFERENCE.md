# Product Detail Page - API Reference

## Required API Endpoints

### 1. Get Product by Slug
```
GET /api/products/slug/:slug
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id_123",
    "name": "Samsung Galaxy S23 5G",
    "slug": "samsung-galaxy-s23-5g",
    "description": "Premium smartphone with advanced features...",
    "brand": {
      "_id": "brand_id",
      "name": "Samsung",
      "slug": "samsung"
    },
    "category": {
      "_id": "category_id",
      "name": "Smartphones",
      "slug": "smartphones"
    },
    "status": "active",
    "isDeleted": false
  }
}
```

---

### 2. Get Variants by Product ID
```
GET /api/variants?productId=product_id_123
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "variant_id_1",
      "productId": "product_id_123",
      "sku": "SAM-S23-BLK-128",
      "sellingPrice": 79999,
      "compareAtPrice": 95999,
      "currency": "INR",
      "stock": 45,
      "status": true,
      "isDeleted": false,
      "attributes": {
        "color": "Phantom Black",
        "storage": "128GB",
        "ram": "8GB"
      },
      "image": "/uploads/variants/variant1.jpg",
      "images": [
        "/uploads/variants/variant1-1.jpg",
        "/uploads/variants/variant1-2.jpg",
        "/uploads/variants/variant1-3.jpg"
      ]
    },
    {
      "_id": "variant_id_2",
      "productId": "product_id_123",
      "sku": "SAM-S23-VIO-256",
      "sellingPrice": 89999,
      "compareAtPrice": 105999,
      "currency": "INR",
      "stock": 20,
      "status": true,
      "isDeleted": false,
      "attributes": {
        "color": "Phantom Violet",
        "storage": "256GB",
        "ram": "12GB"
      },
      "image": "/uploads/variants/variant2.jpg",
      "images": [
        "/uploads/variants/variant2-1.jpg",
        "/uploads/variants/variant2-2.jpg"
      ]
    }
  ]
}
```

---

### 3. Get Color Master
```
GET /api/colors?status=active&isDeleted=false
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "color_id_1",
      "name": "Phantom Black",
      "hexCode": "#2C2C2C",
      "status": "active",
      "isDeleted": false
    },
    {
      "_id": "color_id_2",
      "name": "Phantom Violet",
      "hexCode": "#6B5B95",
      "status": "active",
      "isDeleted": false
    }
  ]
}
```

---

## Cart Integration

### Add to Cart Payload
```javascript
{
  variantId: "variant_id_1",           // Required: Unique variant identifier
  productId: "product_id_123",         // Required: Parent product ID
  name: "Samsung Galaxy S23 5G",       // Product name
  price: 79999,                        // Variant selling price (snapshot)
  currency: "INR",                     // Currency code (snapshot)
  quantity: 2,                         // User-selected quantity
  attributes: {                        // Variant attributes for display
    color: "Phantom Black",
    storage: "128GB",
    ram: "8GB"
  },
  sku: "SAM-S23-BLK-128",             // SKU for tracking
  image: "/uploads/variants/variant1.jpg" // Variant image
}
```

---

## Data Validation Rules

### Product Data
- ✅ `_id` must be present
- ✅ `name` must be present
- ✅ `slug` must be unique and URL-safe
- ✅ `status` should be "active" for display
- ✅ `isDeleted` should be false

### Variant Data
- ✅ `_id` must be present
- ✅ `productId` must match parent product
- ✅ `sellingPrice` must be > 0
- ✅ `currency` must be valid ISO code (INR, USD, EUR, etc.)
- ✅ `stock` must be >= 0
- ✅ `attributes` object must contain at least one attribute
- ✅ `image` or `images[]` must be present
- ✅ `sku` must be unique

### Color Master Data
- ✅ `name` must be present
- ✅ `hexCode` must be valid hex color (#RRGGBB)
- ✅ Alternative: `colorCode` field can be used

---

## Error Handling

### Product Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```
**Frontend Action:** Show "Product not found" page with link to continue shopping

### No Variants Available
```json
{
  "success": true,
  "data": []
}
```
**Frontend Action:** Show "Product currently unavailable" message

### All Variants Out of Stock
**Frontend Action:** 
- Show all variant options
- Disable "Add to Cart" button
- Display "Out of Stock" message
- Allow users to see product details

---

## Image URL Handling

The frontend uses `getImageUrl()` utility to construct full URLs:

```javascript
// Backend returns: "/uploads/variants/image.jpg"
// Frontend converts to: "http://localhost:5000/uploads/variants/image.jpg"

// Backend returns: "https://cdn.example.com/image.jpg"
// Frontend uses as-is (already full URL)
```

**Environment Variable:**
```
VITE_UPLOADS_URL=http://localhost:5000/uploads
```

---

## Currency Handling

Supported currencies with auto-formatting:

| Currency | Symbol | Locale |
|----------|--------|--------|
| INR | ₹ | en-IN |
| USD | $ | en-US |
| EUR | € | en-DE |
| GBP | £ | en-GB |

**Example:**
```javascript
price: 79999
currency: "INR"
// Displays as: ₹79,999
```

---

## Stock Display Logic

| Stock Level | Display | Action Button |
|-------------|---------|---------------|
| 0 | "Out of Stock" | Disabled |
| 1-9 | "Only X left in stock" | Enabled |
| 10+ | "In Stock" | Enabled |

---

## Variant Matching Algorithm

When user selects attributes, the frontend finds matching variant:

```javascript
// User selects: color="Phantom Black", storage="128GB"
// Frontend searches variants where:
variant.attributes.color === "Phantom Black" 
  AND 
variant.attributes.storage === "128GB"
  AND
variant.stock > 0
```

If no exact match found → Show "Combination not available"

---

## Performance Considerations

### Caching Strategy
- Product data: Cache for 5 minutes
- Variant data: Cache for 2 minutes (stock changes frequently)
- Color Master: Cache for 1 hour (rarely changes)

### Image Optimization
- Use WebP format when possible
- Lazy load images below the fold
- Serve responsive images based on device

### API Response Time
- Product fetch: < 200ms
- Variants fetch: < 300ms
- Color Master: < 100ms

---

## Testing Scenarios

### 1. Single Variant Product
- Product has only 1 variant
- Auto-select that variant
- Hide variant selectors
- Show price and stock directly

### 2. Multi-Variant Product
- Product has multiple variants
- Show all attribute selectors
- Update price/stock on selection
- Disable unavailable combinations

### 3. Out of Stock Variant
- User selects out-of-stock variant
- Disable "Add to Cart"
- Show "Out of Stock" message
- Allow viewing other variants

### 4. Price Variations
- Different variants have different prices
- Price updates when variant changes
- Discount calculation updates
- Currency remains consistent

---

## Common Issues & Solutions

### Issue: Images not loading
**Solution:** Check `VITE_UPLOADS_URL` environment variable

### Issue: Variants not showing
**Solution:** Verify `productId` in variant API call matches product `_id`

### Issue: Color swatches showing gray
**Solution:** Ensure Color Master API returns valid `hexCode` values

### Issue: "Add to Cart" not working
**Solution:** Verify `selectedVariant` has all required fields (`_id`, `price`, `stock`)

---

## Production Checklist

- [ ] All API endpoints return correct data structure
- [ ] Images are accessible via configured URL
- [ ] Color Master has all colors used in variants
- [ ] Variant stock is accurate and real-time
- [ ] Currency codes are valid ISO codes
- [ ] SKUs are unique across all variants
- [ ] Product slugs are URL-safe and unique
- [ ] Error responses follow standard format
- [ ] API response times are acceptable
- [ ] CORS is configured for frontend domain
