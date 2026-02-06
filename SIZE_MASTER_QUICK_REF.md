# Size Master - Quick Reference Card

## 🚀 Quick Start

### 1. Seed Sample Data
```bash
cd Backend
node scripts/seedSizes.js
```

### 2. Access Admin Panel
```
http://localhost:3000/admin/sizes
```

---

## 📋 Common API Calls

### Get All Sizes
```javascript
GET /api/sizes
GET /api/sizes?sizeCategory=clothing_alpha&gender=men&status=active
```

### Get Sizes by Category
```javascript
GET /api/sizes/category/clothing_alpha?gender=men
GET /api/sizes/category/shoe_uk?sizeGroup=Men's Footwear
```

### Create Size
```javascript
POST /api/sizes
{
  "name": "XL",
  "code": "CLOTH-ALPHA-XL-M",
  "fullName": "Extra Large",
  "category": "clothing_alpha",
  "sizeGroup": "Men's Clothing",
  "gender": "men",
  "displayOrder": 5,
  "status": "active"
}
```

### Convert Size
```javascript
GET /api/sizes/convert?fromSize=8&fromSystem=uk&toSystem=us
```

### Get Size Groups
```javascript
GET /api/sizes/groups
```

---

## 🎨 Size Categories

| Code | Label | Example |
|------|-------|---------|
| `clothing_alpha` | Clothing (Alpha) | XS, S, M, L, XL |
| `clothing_numeric` | Clothing (Numeric) | 28, 30, 32, 34 |
| `shoe_uk` | Shoes (UK) | 6, 7, 8, 9, 10 |
| `shoe_us` | Shoes (US) | 7, 8, 9, 10, 11 |
| `shoe_eu` | Shoes (EU) | 39, 40, 41, 42 |
| `ring` | Ring Sizes | 6, 7, 8, 9 |
| `belt` | Belt Sizes | 28, 30, 32 |
| `generic` | Generic | Small, Medium, Large |
| `custom` | Custom | One Size, Free Size |
| `bra` | Bra Sizes | 32A, 34B, 36C |
| `electronics` | Electronics | 8GB, 256GB |

---

## 🔧 Common Code Snippets

### Frontend: Fetch Sizes by Category
```javascript
const fetchSizes = async (category, gender) => {
  const { data } = await axios.get(
    `/api/sizes/category/${category}?gender=${gender}`
  );
  return data.data;
};

// Usage
const menShirtSizes = await fetchSizes('clothing_alpha', 'men');
```

### Frontend: Create Size
```javascript
const createSize = async (sizeData) => {
  const { data } = await axios.post('/api/sizes', sizeData);
  return data.data;
};

// Usage
const newSize = await createSize({
  name: 'XXL',
  code: 'CLOTH-ALPHA-XXL-M',
  category: 'clothing_alpha',
  sizeGroup: "Men's Clothing",
  gender: 'men'
});
```

### Backend: Get Sizes for Variant Builder
```javascript
// In your variant controller
const getSizesForProduct = async (req, res) => {
  const { category, gender } = req.query;
  
  const sizes = await Size.findBySizeCategory(category, { gender });
  
  res.json({ success: true, data: sizes });
};
```

### Backend: Use in Variant Creation
```javascript
const createVariant = async (req, res) => {
  const { productId, colorId, sizeId, sku, price, stock } = req.body;
  
  // Verify size exists
  const size = await Size.findById(sizeId);
  if (!size || size.isDeleted) {
    return res.status(404).json({ 
      success: false, 
      message: 'Size not found' 
    });
  }
  
  const variant = await Variant.create({
    product: productId,
    color: colorId,
    size: sizeId,
    sku,
    price,
    stock
  });
  
  res.json({ success: true, data: variant });
};
```

---

## 📊 Size Naming Best Practices

### Clothing Alpha
```
XS, S, M, L, XL, XXL, XXXL
```

### Clothing Numeric
```
28, 30, 32, 34, 36, 38, 40, 42
```

### Shoes
```
6, 7, 8, 9, 10, 11, 12
7.5, 8.5, 9.5 (half sizes)
```

### Code Format
```
{CATEGORY}-{SIZE}-{GENDER}

Examples:
CLOTH-ALPHA-XL-M
SHOE-UK-8-M
GENERIC-SMALL
CUSTOM-ONE-SIZE
```

---

## 🎯 Integration with Variants

### Step 1: Create Sizes
```javascript
// Create clothing sizes
await axios.post('/api/sizes/bulk', {
  sizes: [
    { name: 'S', code: 'CLOTH-S-M', category: 'clothing_alpha', ... },
    { name: 'M', code: 'CLOTH-M-M', category: 'clothing_alpha', ... },
    { name: 'L', code: 'CLOTH-L-M', category: 'clothing_alpha', ... }
  ]
});
```

### Step 2: Use in Variant Builder
```javascript
// Fetch available sizes
const sizes = await axios.get('/api/sizes/category/clothing_alpha?gender=men');

// Create variant with size
const variant = await axios.post('/api/variants', {
  product: productId,
  color: colorId,
  size: sizes.data[0]._id,  // ← Size from Size Master
  sku: 'PROD-M-RED',
  price: 2999,
  stock: 50
});
```

### Step 3: Display on Product Page
```javascript
// Fetch product variants with sizes
const { data } = await axios.get(`/api/variants/product/${productId}`);

// Extract unique sizes
const availableSizes = [...new Set(
  data.data
    .filter(v => v.stock > 0)
    .map(v => v.size)
)];

// Render size selector
<SizeSelector sizes={availableSizes} />
```

---

## 🔍 Filtering Examples

### By Category
```javascript
GET /api/sizes?sizeCategory=clothing_alpha
```

### By Gender
```javascript
GET /api/sizes?gender=men
```

### By Size Group
```javascript
GET /api/sizes?sizeGroup=Men's Clothing
```

### Combined Filters
```javascript
GET /api/sizes?sizeCategory=clothing_alpha&gender=men&status=active&sort=displayOrder
```

### Search
```javascript
GET /api/sizes?search=XL
```

---

## 🛠️ Troubleshooting

### Size Not Showing in Dropdown
**Check:**
1. Is size active? (`status: 'active'`)
2. Is size deleted? (`isDeleted: false`)
3. Does category match?
4. Does gender match?

### Duplicate Code Error
**Solution:** Use unique codes with format:
```
{CATEGORY}-{SIZE}-{GENDER}-{UNIQUE_ID}
```

### Size Conversion Not Working
**Check:**
1. Does size have `internationalConversions` data?
2. Is category a shoe category?
3. Are fromSystem and toSystem valid?

---

## 📦 Files Reference

### Backend
- **Model:** `Backend/models/Size.model.js`
- **Controller:** `Backend/controllers/size.controller.js`
- **Routes:** `Backend/routes/size/sizeRoutes.js`
- **Seed:** `Backend/scripts/seedSizes.js`

### Frontend
- **Admin:** `src/modules/sizeMaster/SizeMasterManagement.jsx`

### Documentation
- **Full Docs:** `docs/SIZE_MASTER_DOCUMENTATION.md`
- **Summary:** `SIZE_MASTER_SUMMARY.md`
- **Quick Ref:** `SIZE_MASTER_QUICK_REF.md` (this file)

---

## ✅ Production Checklist

- [ ] Run seed script
- [ ] Test all API endpoints
- [ ] Verify admin UI works
- [ ] Test size creation
- [ ] Test size filtering
- [ ] Test size conversion
- [ ] Integrate with variant builder
- [ ] Test on product page
- [ ] Verify soft delete works
- [ ] Check performance with large dataset

---

**Quick Help:** See `docs/SIZE_MASTER_DOCUMENTATION.md` for complete documentation.
