
# 🚀 PHASE 1 CRITICAL STABILIZATION - DEPLOYMENT PLAN

## Overview
This deployment fixes 5 critical production blockers:
1. Price calculation fallback bug
2. Missing SearchDocument sync
3. Reservation race conditions
4. Draft variant leakage
5. Index RAM explosion

## Pre-Deployment Checklist
- [ ] Backup MongoDB database
- [ ] Test in staging environment
- [ ] Verify Redis is running (for caching)
- [ ] Create rollback plan
- [ ] Schedule maintenance window (recommended: 2 hours)

## Deployment Steps (Sequential - DO NOT SKIP)

### STEP 1: Deploy Schema Changes (Zero Downtime)
**Files Changed:**
- `Backend/models/variant/variantSchema.js` (text index commented out)
- `Backend/models/inventory/InventoryMaster.model.js` (added alias fields)
- `Backend/models/SearchDocument.model.js` (already exists)

**Actions:**
```bash
# 1. Deploy code
git pull origin main

# 2. Restart backend (schema changes are additive)
pm2 restart backend
```

**Verification:**
```bash
# Check logs for successful startup
pm2 logs backend --lines 50
```

**Risk:** LOW - Schema changes are additive (new fields, commented index)

---

### STEP 2: Deploy Service Layer Updates
**Files Changed:**
- `Backend/services/VariantService.js` (price calculation + sync)
- `Backend/services/InventoryService.js` (NEW - atomic reservations)
- `Backend/middlewares/customerQueryFilter.middleware.js` (NEW)

**Actions:**
```bash
# Already deployed in Step 1, but verify imports work
node -e "import('./Backend/services/VariantService.js').then(() => console.log('✅ OK'))"
```

**Verification:**
- Create a test variant via admin panel
- Check logs for "SearchDocument Synced" message
- Query SearchDocument collection to verify data exists

**Risk:** MEDIUM - New service logic, but backward compatible

---

### STEP 3: Run Index Cleanup Script (CRITICAL)
**Purpose:** Drop the RAM-heavy text index on `filterIndex.$**`

**Actions:**
```bash
# Run cleanup script
node Backend/scripts/cleanupIndexes.js
```

**Expected Output:**
```
✅ Dropped wildcard text index on filterIndex.$**
Remaining Indexes: [_id, product_1_size_1_color_1, filterIndex.$**, sku_1, indexedPrice_1, ...]
✅ Index cleanup complete
```

**Verification:**
```javascript
// In MongoDB shell
db.variants.getIndexes()
// Should NOT see: sku_text_filterIndex.$**_text
```

**Risk:** MEDIUM - Index drop is instant but may briefly lock collection

---

### STEP 4: Backfill SearchDocument (Background)
**Purpose:** Populate SearchDocument for existing variants

**Actions:**
```bash
# Create backfill script
node Backend/scripts/backfillSearchDocument.js
```

**Script Content (create this file):**
```javascript
import mongoose from 'mongoose';
import Variant from './models/variant/variantSchema.js';
import VariantService from './services/VariantService.js';
import connectDB from './config/db.js';

const backfill = async () => {
    await connectDB();
    const variants = await Variant.find({}).populate('product').limit(1000);
    
    for (const v of variants) {
        await VariantService.syncToSearchDocument(v);
    }
    
    console.log('✅ Backfill complete');
    process.exit(0);
};

backfill();
```

**Risk:** LOW - Runs in background, doesn't affect live traffic

---

### STEP 5: Enable Customer Query Filter Middleware
**Purpose:** Prevent draft variants from appearing in customer queries

**Actions:**
Update `Backend/src/server.js` or main app file:
```javascript
import { customerQueryFilter } from './middlewares/customerQueryFilter.middleware.js';

// Add BEFORE route definitions
app.use(customerQueryFilter);
```

**Verification:**
```bash
# Test customer endpoint
curl http://localhost:5000/api/products
# Should NOT return variants with status: 'draft'

# Test admin endpoint
curl http://localhost:5000/api/admin/products
# SHOULD return all variants including drafts
```

**Risk:** MEDIUM - Could hide products if misconfigured

---

### STEP 6: Update Controllers to Use VariantService
**Purpose:** Ensure all variant writes go through service layer

**Actions:**
Find all controllers that create/update variants:
```bash
grep -r "new Variant(" Backend/controllers/
grep -r "Variant.create(" Backend/controllers/
grep -r "Variant.findOneAndUpdate(" Backend/controllers/
```

Replace with:
```javascript
// OLD
const variant = await Variant.create(data);

// NEW
const variant = await VariantService.upsertVariant(productId, data, basePrice);
```

**Risk:** HIGH - Breaking change if not tested thoroughly

---

### STEP 7: Deploy Inventory Reservation Logic (Optional - Phase 2)
**Purpose:** Enable atomic reservations for cart functionality

**Actions:**
- Update checkout flow to use `InventoryService.createReservation()`
- Add cron job to release expired reservations:
  ```javascript
  // Every 5 minutes
  cron.schedule('*/5 * * * *', () => {
      InventoryService.releaseExpiredReservations();
  });
  ```

**Risk:** HIGH - Requires cart/checkout refactor

---

## Post-Deployment Verification

### 1. Price Calculation
```bash
# Create variant with attribute modifiers
# Verify finalPrice and indexedPrice are set correctly
# Check logs for "Price Calculation Failed" errors (should be ZERO)
```

### 2. SearchDocument Sync
```bash
# Update a variant price
# Verify SearchDocument.price updates immediately
db.searchdocuments.findOne({ sku: "TEST-SKU" })
```

### 3. Draft Filter
```bash
# Create variant with status: 'draft'
# Verify it does NOT appear in customer API
curl http://localhost:5000/api/products?search=draft-sku
# Should return empty
```

### 4. Index RAM Usage
```bash
# Check MongoDB Atlas metrics
# Index size should drop by ~30-50% after cleanup
```

---

## Rollback Plan

### If Price Calculation Breaks:
```bash
# Revert VariantService.js
git checkout HEAD~1 Backend/services/VariantService.js
pm2 restart backend
```

### If SearchDocument Sync Fails:
```javascript
// Disable sync temporarily
// In VariantService.upsertVariant, comment out:
// await this.syncToSearchDocument(variant);
```

### If Draft Filter Breaks Customer Site:
```bash
# Remove middleware
# Comment out app.use(customerQueryFilter) in server.js
pm2 restart backend
```

---

## Success Criteria
- ✅ Zero "Price Calculation Failed" errors in logs
- ✅ SearchDocument collection has same count as Variant collection
- ✅ Draft variants invisible to customers
- ✅ Index RAM usage reduced by 30%+
- ✅ No 500 errors in production

## Timeline
- **Step 1-2:** 10 minutes
- **Step 3:** 5 minutes (index drop)
- **Step 4:** 30-60 minutes (background)
- **Step 5:** 10 minutes
- **Step 6:** 1-2 hours (code refactor + testing)
- **Step 7:** Phase 2 (separate deployment)

**Total Downtime:** ZERO (all changes are backward compatible)
**Total Deployment Time:** ~2 hours (excluding Step 7)
