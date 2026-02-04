# 🔍 Inventory Product Loading Issue - Diagnostic Report

**Date**: February 4, 2026  
**Issue**: Products not loading in inventory

---

## 🐛 Problem Identified

Looking at your inventory service (`inventory.service.js` line 903-904):

```javascript
const [inventories, total] = await Promise.all([
  InventoryMaster.find(query)
    .populate('productId', 'name category brand')  // ← Only selecting limited fields
    .populate('variantId', 'attributes image')      // ← Only selecting limited fields
    .populate('locations.warehouseId', 'name code')
    .sort({ lastStockUpdate: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
  InventoryMaster.countDocuments(query)
]);
```

**The issue**: The populate is working, but it's only selecting specific fields. If products are not showing, it could be:

1. ❌ **Product documents don't exist** (deleted or missing)
2. ❌ **ProductId reference is broken** (invalid ObjectId)
3. ❌ **Products are soft-deleted** (isDeleted: true)
4. ❌ **Variants are soft-deleted** (isDeleted: true)

---

## 🔍 Diagnostic Steps

### **Step 1: Check if inventory records exist**

Run this in MongoDB Compass or via API:

```javascript
// GET /api/inventory
// Should return inventory records
```

### **Step 2: Check if productId references are valid**

```javascript
db.inventoryMasters.find({}).forEach(inv => {
  const product = db.products.findOne({ _id: inv.productId });
  if (!product) {
    print(`Inventory ${inv.sku} has invalid productId: ${inv.productId}`);
  }
});
```

### **Step 3: Check if products are soft-deleted**

```javascript
db.products.find({ isDeleted: true }).count();
// If this returns > 0, you have soft-deleted products
```

---

## 🛠️ Solutions

### **Solution 1: Fix Populate to Include Soft-Deleted Check**

Update `inventory.service.js` line 902-904:

```javascript
const [inventories, total] = await Promise.all([
  InventoryMaster.find(query)
    .populate({
      path: 'productId',
      select: 'name category brand images slug',
      match: { isDeleted: false }  // ← Only populate non-deleted products
    })
    .populate({
      path: 'variantId',
      select: 'attributes image price sku stock',
      match: { isDeleted: false }  // ← Only populate non-deleted variants
    })
    .populate('locations.warehouseId', 'name code')
    .sort({ lastStockUpdate: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
  InventoryMaster.countDocuments(query)
]);
```

### **Solution 2: Add Null Check in Frontend**

If products are null after populate, filter them out:

```javascript
// In your admin panel component
const validInventories = inventories.filter(inv => 
  inv.productId && inv.variantId
);
```

### **Solution 3: Restore Soft-Deleted Products**

If products are soft-deleted, restore them:

```javascript
// In MongoDB Compass or via script
db.products.updateMany(
  { isDeleted: true },
  { $set: { isDeleted: false, deletedAt: null } }
);
```

---

## 🧪 Quick Test Script

Create this file to test: `Backend/scripts/testInventoryPopulate.js`

```javascript
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import Product from '../models/Product/ProductSchema.js';
import ProductVariant from '../models/variant/productVariantSchema.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db';

async function testInventoryPopulate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Count total inventory records
    const totalInventory = await InventoryMaster.countDocuments();
    console.log(`\n📊 Total Inventory Records: ${totalInventory}`);

    // 2. Count inventory with valid products
    const inventories = await InventoryMaster.find()
      .populate('productId')
      .populate('variantId')
      .limit(10)
      .lean();

    console.log(`\n🔍 First 10 Inventory Records:\n`);
    
    inventories.forEach((inv, index) => {
      console.log(`${index + 1}. SKU: ${inv.sku}`);
      console.log(`   Product: ${inv.productId ? inv.productId.name : '❌ NULL (Product not found)'}`);
      console.log(`   Variant: ${inv.variantId ? inv.variantId.sku : '❌ NULL (Variant not found)'}`);
      console.log(`   Stock: ${inv.totalStock}`);
      console.log('');
    });

    // 3. Check for broken references
    const brokenRefs = inventories.filter(inv => !inv.productId || !inv.variantId);
    console.log(`\n⚠️  Broken References: ${brokenRefs.length}/${inventories.length}`);

    if (brokenRefs.length > 0) {
      console.log('\n❌ Inventory records with broken references:');
      brokenRefs.forEach(inv => {
        console.log(`   SKU: ${inv.sku}`);
        console.log(`   ProductId: ${inv.productId || 'NULL'}`);
        console.log(`   VariantId: ${inv.variantId || 'NULL'}`);
      });
    }

    // 4. Check soft-deleted products
    const deletedProducts = await Product.countDocuments({ isDeleted: true });
    const deletedVariants = await ProductVariant.countDocuments({ isDeleted: true });
    
    console.log(`\n🗑️  Soft-Deleted Records:`);
    console.log(`   Products: ${deletedProducts}`);
    console.log(`   Variants: ${deletedVariants}`);

    await mongoose.disconnect();
    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testInventoryPopulate();
```

**Run it**:
```bash
cd Backend
node scripts/testInventoryPopulate.js
```

---

## 📋 Checklist

- [ ] Run diagnostic script to check inventory
- [ ] Check if products exist in database
- [ ] Check if products are soft-deleted
- [ ] Check if variants are soft-deleted
- [ ] Fix populate query to exclude soft-deleted
- [ ] Add null checks in frontend
- [ ] Restore soft-deleted products if needed

---

## 🎯 Most Likely Cause

Based on your previous conversations about inventory, the most likely issue is:

**Products or Variants are soft-deleted (`isDeleted: true`)**

This happens when:
1. You deleted products/variants in admin panel
2. The inventory records still exist (they're auto-created)
3. The populate returns `null` because products are soft-deleted

**Quick Fix**:
```javascript
// In MongoDB Compass, run:
db.products.updateMany(
  { isDeleted: true },
  { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
);

db.productVariants.updateMany(
  { isDeleted: true },
  { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
);
```

---

## 📞 Next Steps

1. **Run the diagnostic script** to see what's happening
2. **Share the output** with me
3. **I'll provide the exact fix** based on the results

---

**Created**: February 4, 2026  
**Status**: 🔍 Diagnostic Ready  
**Action**: Run test script to identify issue
