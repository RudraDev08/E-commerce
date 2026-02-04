# 🎯 Variant Structure - Quick Reference

## ✅ CORRECT Variant Structure (Production-Ready)

```json
{
  "_id": "67a1234567890abcdef12345",
  "productId": "67a9876543210fedcba98765",
  "sku": "SAM-S23-BLK-128-8GB",
  
  "sellingPrice": 79999,
  "compareAtPrice": 95999,
  "currency": "INR",
  "stock": 45,
  
  "status": true,
  "isDeleted": false,
  
  "attributes": {
    "colorId": "67acolor123456789abcdef",    // ✅ CRITICAL: Use colorId, NOT color name
    "storage": "128GB",
    "ram": "8GB"
  },
  
  "image": "/uploads/variants/sam-s23-blk-128.jpg",
  "images": [
    "/uploads/variants/sam-s23-blk-128-front.jpg",
    "/uploads/variants/sam-s23-blk-128-back.jpg",
    "/uploads/variants/sam-s23-blk-128-side.jpg"
  ],
  
  "createdAt": "2026-02-04T10:00:00.000Z",
  "updatedAt": "2026-02-04T10:00:00.000Z"
}
```

---

## 🎨 Color Master Structure

```json
{
  "_id": "67acolor123456789abcdef",
  "name": "Phantom Black",
  "hexCode": "#2C2C2C",
  "colorCode": "#2C2C2C",
  "status": "active",
  "isDeleted": false,
  "createdAt": "2026-02-04T10:00:00.000Z",
  "updatedAt": "2026-02-04T10:00:00.000Z"
}
```

---

## 🔗 Relationship Diagram

```
Product
  ├── _id: "product_123"
  └── name: "Samsung Galaxy S23 5G"

Variants (Multiple)
  ├── Variant 1
  │   ├── _id: "variant_1"
  │   ├── productId: "product_123"  ← Links to Product
  │   ├── attributes:
  │   │   ├── colorId: "color_1"    ← Links to Color Master
  │   │   ├── storage: "128GB"
  │   │   └── ram: "8GB"
  │   ├── sellingPrice: 79999
  │   ├── stock: 45
  │   └── images: [...]
  │
  ├── Variant 2
  │   ├── _id: "variant_2"
  │   ├── productId: "product_123"  ← Links to Product
  │   ├── attributes:
  │   │   ├── colorId: "color_2"    ← Links to Color Master
  │   │   ├── storage: "256GB"
  │   │   └── ram: "12GB"
  │   ├── sellingPrice: 89999
  │   ├── stock: 20
  │   └── images: [...]
  │
  └── ...

Color Master
  ├── Color 1
  │   ├── _id: "color_1"
  │   ├── name: "Phantom Black"
  │   └── hexCode: "#2C2C2C"
  │
  ├── Color 2
  │   ├── _id: "color_2"
  │   ├── name: "Phantom Violet"
  │   └── hexCode: "#6B5B95"
  │
  └── ...
```

---

## ❌ WRONG Variant Structure (DO NOT USE)

```json
{
  "_id": "variant_123",
  "productId": "product_123",
  
  "attributes": {
    "color": "Phantom Black",  // ❌ WRONG: String name instead of colorId
    "storage": "128GB"
  },
  
  "image": "image.jpg"  // ❌ WRONG: Relative path without /uploads/
}
```

**Problems:**
- ❌ Color matching breaks if color name changes
- ❌ No multi-language support
- ❌ Fragile string matching
- ❌ Image path issues

---

## 🔄 Frontend Matching Logic

### Color Matching (CORRECT)
```javascript
// Step 1: User selects color swatch
handleAttributeSelect('colorId', 'color_id_123');

// Step 2: Find variant with matching colorId
const matchedVariant = variants.find(v => 
  v.attributes.colorId === 'color_id_123' &&
  v.attributes.storage === '128GB' &&
  v.attributes.ram === '8GB'
);

// Step 3: Resolve color details from Color Master
const colorObj = colorMaster.find(c => c._id === 'color_id_123');
const colorName = colorObj.name;  // "Phantom Black"
const colorHex = colorObj.hexCode;  // "#2C2C2C"
```

### Storage/RAM Matching (CORRECT)
```javascript
// Direct string matching (no master table needed)
const matchedVariant = variants.find(v => 
  v.attributes.storage === '256GB' &&
  v.attributes.ram === '12GB'
);
```

---

## 📦 Cart Payload Structure

```json
{
  "variantId": "variant_123",
  "productId": "product_123",
  "price": 79999,
  "currency": "INR",
  "quantity": 2,
  "attributes": {
    "colorId": "color_id_123",
    "storage": "128GB",
    "ram": "8GB"
  },
  "sku": "SAM-S23-BLK-128-8GB",
  "image": "/uploads/variants/sam-s23-blk-128.jpg"
}
```

**Display in Cart:**
```javascript
// Resolve color name for display
const colorObj = colorMaster.find(c => c._id === item.attributes.colorId);
const displayName = `${productName} - ${colorObj.name}, ${item.attributes.storage}, ${item.attributes.ram}`;
// "Samsung Galaxy S23 5G - Phantom Black, 128GB, 8GB"
```

---

## 🎨 Color Swatch Rendering

```jsx
{attributeGroups.ColorId?.map(colorId => {
  const colorObj = colorMaster.find(c => c._id === colorId);
  const isSelected = selectedAttributes.colorId === colorId;
  const isAvailable = isAttributeAvailable('colorId', colorId);
  
  return (
    <div
      key={colorId}
      className={`swatch-color ${isSelected ? 'selected' : ''}`}
      style={{ 
        backgroundColor: colorObj?.hexCode || '#ccc',
        opacity: isAvailable ? 1 : 0.3,
        cursor: isAvailable ? 'pointer' : 'not-allowed'
      }}
      onClick={() => isAvailable && handleAttributeSelect('colorId', colorId)}
      title={colorObj?.name || 'Unknown Color'}
    />
  );
})}
```

---

## 🔍 Attribute Groups Extraction

```javascript
// Extract unique attribute values from all variants
const attributeGroups = useMemo(() => {
  const groups = {};
  
  variants.forEach(variant => {
    Object.entries(variant.attributes).forEach(([key, value]) => {
      if (!groups[key]) groups[key] = new Set();
      groups[key].add(value);
    });
  });
  
  // Convert Sets to Arrays
  return Object.fromEntries(
    Object.entries(groups).map(([key, set]) => [key, Array.from(set)])
  );
}, [variants]);

// Result:
// {
//   colorId: ['color_id_1', 'color_id_2'],
//   storage: ['128GB', '256GB', '512GB'],
//   ram: ['8GB', '12GB', '16GB']
// }
```

---

## 📊 Stock Display Rules

| Stock Value | Display Text | Add to Cart |
|-------------|--------------|-------------|
| 0 | "Out of Stock" | Disabled ❌ |
| 1-9 | "Only X left in stock" | Enabled ✅ |
| 10+ | "In Stock" | Enabled ✅ |

```javascript
const stock = Number(selectedVariant?.stock) || 0;
const isOutOfStock = stock <= 0;

const stockMessage = isOutOfStock 
  ? 'Out of Stock' 
  : stock < 10 
    ? `Only ${stock} left in stock` 
    : 'In Stock';
```

---

## 💰 Price Display Rules

```javascript
// Always from selectedVariant
const price = selectedVariant?.sellingPrice || selectedVariant?.price || 0;
const comparePrice = selectedVariant?.compareAtPrice || selectedVariant?.basePrice || 0;
const currency = selectedVariant?.currency || 'INR';

// Calculate discount
const discount = (comparePrice && price && comparePrice > price) 
  ? Math.round(((comparePrice - price) / comparePrice) * 100) 
  : 0;

// Format with Intl.NumberFormat
const formatPrice = (amount, currencyCode) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode
  }).format(amount);
};
```

---

## 🖼️ Image Normalization

```javascript
// Always returns array
const galleryImages = useMemo(() => {
  if (!selectedVariant) return [];
  
  // Prefer images[] array
  if (Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
    return selectedVariant.images;
  }
  
  // Fallback to single image
  if (selectedVariant.image) {
    return [selectedVariant.image];
  }
  
  return [];
}, [selectedVariant]);
```

---

## ✅ Validation Checklist

### Variant Data
- [ ] `_id` is present and unique
- [ ] `productId` matches parent product
- [ ] `attributes.colorId` references Color Master `_id`
- [ ] `sellingPrice` is a number > 0
- [ ] `currency` is valid ISO code (INR, USD, EUR, GBP)
- [ ] `stock` is a number >= 0
- [ ] `sku` is unique across all variants
- [ ] `image` or `images[]` is present
- [ ] `status` is boolean
- [ ] `isDeleted` is boolean

### Color Master Data
- [ ] `_id` is present and unique
- [ ] `name` is present
- [ ] `hexCode` is valid hex color (#RRGGBB)
- [ ] `status` is "active"
- [ ] `isDeleted` is false

---

## 🚀 Quick Start

1. **Ensure Color Master has all colors:**
   ```bash
   GET /api/colors?status=active&isDeleted=false
   ```

2. **Create variants with colorId:**
   ```json
   {
     "attributes": {
       "colorId": "67acolor123456789abcdef",
       "storage": "128GB"
     }
   }
   ```

3. **Frontend automatically:**
   - Fetches Color Master
   - Resolves colorId to name and hex
   - Renders color swatches
   - Matches variants correctly

---

## 📞 Support

If you encounter issues:

1. **Color swatches not showing?**
   - Verify Color Master API returns data
   - Check `colorId` in variant matches Color Master `_id`

2. **Images not loading?**
   - Verify `VITE_UPLOADS_URL` environment variable
   - Check image paths start with `/uploads/`

3. **Variant matching fails?**
   - Verify all attributes match exactly (case-sensitive)
   - Check variant has all required attributes

4. **Price not updating?**
   - Verify `selectedVariant` is not null
   - Check `sellingPrice` field exists in variant

---

**Last Updated:** 2026-02-04
**Version:** 2.0 (Production-Hardened)
