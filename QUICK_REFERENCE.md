# 🚀 Variant-First System - Quick Reference Card

## 📋 QUICK COMMANDS

### Database Setup
```bash
# Seed database with sample data
cd Backend
npm run seed:variant
```

### API Testing
```bash
# Get all variants for a product group
curl http://localhost:5000/api/variants/group/FOLD6_2024

# Get configurations (sizes, colors)
curl http://localhost:5000/api/variants/group/FOLD6_2024/configurations

# Get single variant
curl http://localhost:5000/api/variants/{variantId}

# Get stock info
curl http://localhost:5000/api/variants/{variantId}/stock
```

---

## 🗂️ KEY FILES

| File | Purpose |
|------|---------|
| `Backend/models/VariantMaster.js` | Core variant model |
| `Backend/models/VariantInventory.js` | Stock management |
| `Backend/controllers/variant.controller.js` | API logic |
| `Backend/routes/variant.routes.js` | API routes |
| `Backend/scripts/seedDatabase.js` | Sample data |
| `customer-website/src/components/ProductDetailPage.jsx` | React PDP |

---

## 🔑 KEY CONCEPTS

### 1. Product Grouping
```javascript
productGroup: "FOLD6_2024"
```
All variants with same `productGroup` = one product on frontend

### 2. Configuration Hash (Duplicate Prevention)
```javascript
configHash = SHA256(productGroup + sizes + color + attributes)
```
Automatically prevents duplicate configurations

### 3. SKU Format
```
SAM-FOLD6-512GB-12GB-BLK
BRAND-GROUP-SIZE1-SIZE2-COLOR
```

### 4. Inventory Structure
```javascript
{
    variant: ObjectId,
    warehouse: ObjectId,
    quantity: 50,
    reservedQuantity: 5,
    availableQuantity: 45  // Virtual field
}
```

---

## 📊 DATABASE MODELS

### SizeMaster
```javascript
{
    category: 'storage' | 'ram' | 'clothing' | 'shoe',
    value: '512GB',
    displayName: '512 GB',
    sortOrder: 3,
    isActive: true
}
```

### ColorMaster
```javascript
{
    name: 'Phantom Black',
    hexCode: '#1a1a1a',
    category: 'solid' | 'metallic' | 'gradient',
    isActive: true
}
```

### VariantMaster
```javascript
{
    productGroup: 'FOLD6_2024',
    productName: 'Samsung Galaxy Z Fold 6',
    brand: 'Samsung',
    sku: 'SAM-FOLD6-512GB-12GB-BLK',
    configHash: 'a1b2c3...',
    color: ObjectId,
    sizes: [{ sizeId, category, value }],
    price: 164999,
    images: [{ url, isPrimary, sortOrder }],
    status: 'active' | 'inactive' | 'deleted'
}
```

---

## 🎯 API ENDPOINTS

### Public (Customer)
```
GET  /api/variants/group/:productGroup
GET  /api/variants/group/:productGroup/configurations
GET  /api/variants/:id
GET  /api/variants/:id/stock
```

### Admin
```
POST   /api/variants
PUT    /api/variants/:id
DELETE /api/variants/:id
POST   /api/variants/inventory/adjust
POST   /api/variants/:id/images
```

---

## 🎨 FRONTEND USAGE

```jsx
import ProductDetailPage from './components/ProductDetailPage';

function App() {
    return (
        <ProductDetailPage productGroup="FOLD6_2024" />
    );
}
```

### Component Features
- ✅ Dynamic variant selection
- ✅ Availability detection
- ✅ Real-time price updates
- ✅ Stock display
- ✅ Image gallery
- ✅ Responsive design

---

## 🔧 COMMON OPERATIONS

### Create a Variant
```javascript
POST /api/variants
{
    "productGroup": "FOLD6_2024",
    "productName": "Samsung Galaxy Z Fold 6",
    "brand": "Samsung",
    "category": "Smartphones",
    "color": "colorId",
    "sizes": [
        { "sizeId": "...", "category": "storage", "value": "512GB" },
        { "sizeId": "...", "category": "ram", "value": "12GB" }
    ],
    "price": 164999,
    "images": [{ "url": "...", "isPrimary": true }]
}
```

### Adjust Inventory
```javascript
POST /api/variants/inventory/adjust
{
    "variantId": "...",
    "warehouseId": "...",
    "adjustment": 50,
    "transactionType": "in",
    "notes": "New stock received"
}
```

---

## 🔍 IMPORTANT INDEXES

```javascript
// VariantMaster
{ productGroup: 1, status: 1 }      // Product group queries
{ sku: 1 }                          // Unique SKU lookup
{ configHash: 1 }                   // Duplicate prevention
{ category: 1, subcategory: 1, status: 1 }

// VariantInventory
{ variant: 1, warehouse: 1 }        // Unique constraint
{ variant: 1 }                      // Stock lookups

// InventoryTransaction
{ variant: 1, createdAt: -1 }       // Transaction history
```

---

## ✅ VALIDATION RULES

1. **SKU must be unique** across all variants
2. **configHash must be unique** (prevents duplicates)
3. **Only one primary image** per variant
4. **Price must be positive**
5. **Stock cannot be negative**
6. **Reserved quantity ≤ total quantity**

---

## 🚨 COMMON ERRORS

### Duplicate Configuration
```json
{
    "success": false,
    "message": "Duplicate configHash. This configuration already exists."
}
```
**Solution:** Change size/color combination

### Insufficient Stock
```json
{
    "success": false,
    "message": "Insufficient stock. Available: 10, Requested: 20"
}
```
**Solution:** Adjust inventory or reduce quantity

---

## 📈 PERFORMANCE TIPS

1. **Use `.lean()`** for read-only queries
2. **Cache product groups** in Redis
3. **Use aggregation** for complex stock calculations
4. **Index all query fields**
5. **Limit population** to necessary fields only

---

## 🎓 BEST PRACTICES

1. ✅ Always use `configHash` for duplicate prevention
2. ✅ Use transactions for inventory adjustments
3. ✅ Soft delete variants (don't hard delete)
4. ✅ Log all inventory changes
5. ✅ Validate inputs before saving
6. ✅ Use status field for filtering
7. ✅ Keep masters centralized
8. ✅ Auto-generate SKUs
9. ✅ Maintain one primary image
10. ✅ Track all stock movements

---

## 🔐 SECURITY CHECKLIST

- [ ] Add authentication middleware to admin routes
- [ ] Implement rate limiting
- [ ] Validate all inputs (Joi/Zod)
- [ ] Sanitize user inputs
- [ ] Use HTTPS in production
- [ ] Set up CORS properly
- [ ] Enable MongoDB replica set for transactions
- [ ] Add request logging
- [ ] Set up error monitoring

---

## 📚 DOCUMENTATION

1. **README_VARIANT_SYSTEM.md** - Complete overview
2. **VARIANT_FIRST_ARCHITECTURE.md** - Technical architecture
3. **VARIANT_SYSTEM_IMPLEMENTATION_GUIDE.md** - Setup guide
4. **API_TESTING_GUIDE.md** - API reference

---

## 🎯 SAMPLE PRODUCT GROUPS

After seeding, you'll have:
- **FOLD6_2024** - Samsung Galaxy Z Fold 6 (4 variants)
  - 512GB + 12GB RAM + Black
  - 512GB + 12GB RAM + Silver
  - 256GB + 8GB RAM + Black
  - 256GB + 8GB RAM + Green

---

## 💡 QUICK TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Variants not showing | Check `status: 'active'` |
| Duplicate error | Check configHash conflict |
| Stock not updating | Verify warehouse ID |
| Images not showing | Check isPrimary flag |
| Selector disabled | Check variant availability |

---

**System:** Variant-First E-commerce  
**Tech:** React + Tailwind + Node.js + MongoDB  
**Status:** ✅ Production Ready  
**Version:** 1.0
