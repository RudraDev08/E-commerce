# SIZE MASTER - Complete Implementation Guide

## 🐛 CRITICAL FIX - Mongoose Async Hook Error

### **The Problem:**
```javascript
// ❌ WRONG - This causes "next is not a function" error
sizeMasterSchema.pre('save', async function(next) {
  // ... code ...
  next(); // ERROR: Can't call next() in async function
});
```

### **The Solution:**
```javascript
// ✅ CORRECT - Async function WITHOUT next()
sizeMasterSchema.pre('save', async function() {
  // ... code ...
  // No next() needed - async functions return promises automatically
});
```

**Why?** Mongoose 5.x+ automatically handles promise returns from async middleware. Calling `next()` in an async function causes a runtime error.

---

## 📋 ENTERPRISE SIZE MASTER SCHEMA

### **Architecture Overview**
```
SizeMaster (Enterprise)
├── Identity Layer (canonicalId, value, displayName)
├── Scoping (category, gender, primaryRegion)
├── Normalization (normalizedRank, numericValue, sortOrder)
├── Measurements (unit, min, max, equivalents)
├── Regional Conversions (US, UK, EU, JP, AU, CN)
├── Lifecycle Management (DRAFT → ACTIVE → DEPRECATED → ARCHIVED)
├── Governance (isLocked, usageCount, version)
└── Audit Trail (createdBy, updatedBy, auditLog)
```

### **Key Features:**
1. ✅ **Multi-Category Support** - CLOTHING, FOOTWEAR, ACCESSORIES, STORAGE, RAM, DISPLAY, DIMENSION
2. ✅ **International Sizing** - US, UK, EU, JP, AU, CN, GLOBAL equivalents
3. ✅ **Smart Sorting** - normalizedRank for proper ordering (XS=10, S=20, M=30, L=40, XL=50)
4. ✅ **Usage Tracking** - Prevents deletion of sizes in use
5. ✅ **Gender Support** - MEN, WOMEN, UNISEX, BOYS, GIRLS, INFANT, KIDS
6. ✅ **Lifecycle States** - DRAFT, ACTIVE, DEPRECATED, ARCHIVED with transition validation
7. ✅ **Lock Enforcement** - Prevents accidental modification of production sizes

---

## 🗂️ SIZE CATEGORIES & EXAMPLES

### **1. CLOTHING Sizes**
```javascript
{
  value: "M",
  displayName: "Medium",
  category: "CLOTHING",
  gender: "UNISEX",
  primaryRegion: "GLOBAL",
  normalizedRank: 50,
  measurements: {
    unit: "CM",
    min: 96,
    max: 102,
    typical: 99,
    equivalentCm: 99,
    equivalentInch: 39
  },
  conversions: [
    { region: "US", value: "M", numericEquivalent: 4 },
    { region: "EU", value: "48-50", numericEquivalent: 49 }
  ],
  lifecycleState: "ACTIVE"
}
```

**Common Clothing Sizes:**
```javascript
const clothingSizes = [
  { value: "XXS", displayName: "Extra Extra Small", normalizedRank: 10 },
  { value: "XS", displayName: "Extra Small", normalizedRank: 20 },
  { value: "S", displayName: "Small", normalizedRank: 30 },
  { value: "M", displayName: "Medium", normalizedRank: 50 },
  { value: "L", displayName: "Large", normalizedRank: 70 },
  { value: "XL", displayName: "Extra Large", normalizedRank: 80 },
  { value: "XXL", displayName: "Double Extra Large", normalizedRank: 90 },
  { value: "3XL", displayName: "Triple Extra Large", normalizedRank: 95 }
];
```

---

### **2. FOOTWEAR Sizes**
```javascript
{
  value: "UK8",
  displayName: "UK Size 8",
  category: "FOOTWEAR",
  gender: "MEN",
  primaryRegion: "UK",
  normalizedRank: 80,
  numericValue: 8,
  measurements: {
    unit: "CM",
    min: 26.5,
    max: 27,
    typical: 26.7
  },
  conversions: [
    { region: "US", value: "9", numericEquivalent: 9 },
    { region: "EU", value: "42", numericEquivalent: 42 },
    { region: "JP", value: "26.5", numericEquivalent: 26.5 }
  ],
  lifecycleState: "ACTIVE"
}
```

**Common Shoe Sizes:**
```javascript
// UK Men's Sizes
const ukMenShoes = [
  { value: "UK6", displayName: "UK Size 6", normalizedRank: 60, conversions: [
    { region: "US", value: "7" }, { region: "EU", value: "39-40" }
  ]},
  { value: "UK7", displayName: "UK Size 7", normalizedRank: 70, conversions: [
    { region: "US", value: "8" }, { region: "EU", value: "40-41" }
  ]},
  { value: "UK8", displayName: "UK Size 8", normalizedRank: 80, conversions: [
    { region: "US", value: "9" }, { region: "EU", value: "42" }
  ]},
  { value: "UK9", displayName: "UK Size 9", normalizedRank: 90, conversions: [
    { region: "US", value: "10" }, { region: "EU", value: "43" }
  ]},
  { value: "UK10", displayName: "UK Size 10", normalizedRank: 100, conversions: [
    { region: "US", value: "11" }, { region: "EU", value: "44" }
  ]}
];
```

---

### **3. STORAGE Sizes**
```javascript
{
  value: "128GB",
  displayName: "128 GB",
  category: "STORAGE",
  gender: "UNISEX",
  primaryRegion: "GLOBAL",
  normalizedRank: 40,
  numericValue: 128,
  measurements: {
    unit: "GB"
  },
  lifecycleState: "ACTIVE"
}
```

**Common Storage Sizes:**
```javascript
const storageSizes = [
  { value: "16GB", displayName: "16 GB", normalizedRank: 10, numericValue: 16 },
  { value: "32GB", displayName: "32 GB", normalizedRank: 20, numericValue: 32 },
  { value: "64GB", displayName: "64 GB", normalizedRank: 30, numericValue: 64 },
  { value: "128GB", displayName: "128 GB", normalizedRank: 40, numericValue: 128 },
  { value: "256GB", displayName: "256 GB", normalizedRank: 50, numericValue: 256 },
  { value: "512GB", displayName: "512 GB", normalizedRank: 60, numericValue: 512 },
  { value: "1TB", displayName: "1 TB", normalizedRank: 70, numericValue: 1024 },
  { value: "2TB", displayName: "2 TB", normalizedRank: 80, numericValue: 2048 }
];
```

---

### **4. RAM Sizes**
```javascript
{
  value: "8GB",
  displayName: "8 GB RAM",
  category: "RAM",
  gender: "UNISEX",
  primaryRegion: "GLOBAL",
  normalizedRank: 30,
  numericValue: 8,
  measurements: {
    unit: "GB"
  },
  lifecycleState: "ACTIVE"
}
```

**Common RAM Sizes:**
```javascript
const ramSizes = [
  { value: "2GB", displayName: "2 GB", normalizedRank: 10 },
  { value: "4GB", displayName: "4 GB", normalizedRank: 20 },
  { value: "6GB", displayName: "6 GB", normalizedRank: 25 },
  { value: "8GB", displayName: "8 GB", normalizedRank: 30 },
  { value: "12GB", displayName: "12 GB", normalizedRank: 40 },
  { value: "16GB", displayName: "16 GB", normalizedRank: 50 },
  { value: "32GB", displayName: "32 GB", normalizedRank: 60 }
];
```

---

### **5. DISPLAY Sizes**
```javascript
{
  value: "6.5IN",
  displayName: "6.5 inches",
  category: "DISPLAY",
  gender: "UNISEX",
  primaryRegion: "GLOBAL",
  normalizedRank: 65,
  numericValue: 6.5,
  measurements: {
    unit: "IN",
    typical: 6.5,
    equivalentCm: 16.51
  },
  lifecycleState: "ACTIVE"
}
```

**Common Display Sizes:**
```javascript
// Mobile
const mobileDisplays = [
  { value: "5.5IN", displayName: "5.5\"", normalizedRank: 55 },
  { value: "6.1IN", displayName: "6.1\"", normalizedRank: 61 },
  { value: "6.5IN", displayName: "6.5\"", normalizedRank: 65 },
  { value: "6.7IN", displayName: "6.7\"", normalizedRank: 67 }
];

// Laptop
const laptopDisplays = [
  { value: "13IN", displayName: "13\"", normalizedRank: 130 },
  { value: "14IN", displayName: "14\"", normalizedRank: 140 },
  { value: "15.6IN", displayName: "15.6\"", normalizedRank: 156 },
  { value: "17IN", displayName: "17\"", normalizedRank: 170 }
];
```

---

## 🔌 API ENDPOINTS

### **1. Create Size**
```http
POST /api/sizes
Content-Type: application/json

{
  "value": "M",
  "displayName": "Medium",
  "category": "CLOTHING",
  "gender": "UNISEX",
  "primaryRegion": "GLOBAL",
  "normalizedRank": 50,
  "lifecycleState": "ACTIVE"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Size created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "canonicalId": "SIZE-CLOTHING-UNISEX-GLOBAL-M",
    "value": "M",
    "displayName": "Medium",
    "category": "CLOTHING",
    "gender": "UNISEX",
    "primaryRegion": "GLOBAL",
    "normalizedRank": 50,
    "lifecycleState": "ACTIVE",
    "isActive": true,
    "isLocked": false,
    "usageCount": 0,
    "version": 1,
    "createdAt": "2026-02-16T16:26:00.000Z",
    "updatedAt": "2026-02-16T16:26:00.000Z"
  }
}
```

**Error (409 Conflict - Duplicate):**
```json
{
  "success": false,
  "error": "DUPLICATE_ENTRY",
  "message": "Size \"M\" already exists for UNISEX CLOTHING in GLOBAL region",
  "existingId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

---

### **2. Get Sizes (Cursor Pagination)**
```http
GET /api/sizes?category=CLOTHING&gender=UNISEX&status=ACTIVE&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "value": "S",
      "displayName": "Small",
      "normalizedRank": 30,
      "usageCount": 15
    },
    {
      "_id": "...",
      "value": "M",
      "displayName": "Medium",
      "normalizedRank": 50,
      "usageCount": 42
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJfaWQiOiI2NWYxYTJiM2M0ZDVlNmY3ZzhoOWkwajEifQ==",
    "count": 20
  }
}
```

---

### **3. Get Size by ID**
```http
GET /api/sizes/65f1a2b3c4d5e6f7g8h9i0j1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "canonicalId": "SIZE-CLOTHING-UNISEX-GLOBAL-M",
    "value": "M",
    "displayName": "Medium",
    "category": "CLOTHING",
    "gender": "UNISEX",
    "normalizedRank": 50,
    "measurements": {
      "unit": "CM",
      "min": 96,
      "max": 102
    },
    "conversions": [
      { "region": "US", "value": "M" },
      { "region": "EU", "value": "48-50" }
    ],
    "lifecycleState": "ACTIVE",
    "isLocked": false,
    "usageCount": 42
  }
}
```

---

### **4. Update Size**
```http
PUT /api/sizes/65f1a2b3c4d5e6f7g8h9i0j1
Content-Type: application/json

{
  "displayName": "Medium (Updated)",
  "normalizedRank": 55
}
```

**Response:**
```json
{
  "success": true,
  "message": "Size updated successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "displayName": "Medium (Updated)",
    "normalizedRank": 55,
    "version": 2
  }
}
```

**Error (Locked):**
```json
{
  "success": false,
  "message": "Cannot modify locked size. Modified fields: displayName, normalizedRank"
}
```

---

### **5. Delete Size**
```http
DELETE /api/sizes/65f1a2b3c4d5e6f7g8h9i0j1
```

**Success:**
```json
{
  "success": true,
  "message": "Size deleted successfully"
}
```

**Error (In Use):**
```json
{
  "success": false,
  "message": "Cannot delete size with 42 active references. Deprecate instead."
}
```

---

### **6. Lock/Unlock Size**
```http
PATCH /api/sizes/65f1a2b3c4d5e6f7g8h9i0j1/lock
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "isLocked": true
  }
}
```

---

## 🔄 CONTROLLER EXAMPLES

### **Create Size (Production-Safe)**
```javascript
import SizeMaster from '../models/masters/SizeMaster.enterprise.js';

export const createSize = async (req, res) => {
    try {
        const {
            value,
            displayName,
            category,
            gender,
            primaryRegion,
            normalizedRank,
            lifecycleState,
            measurements,
            conversions
        } = req.body;

        console.log('[DEBUG] Create Size Payload:', req.body);

        // Validate required fields
        if (!value || !displayName || !category || !gender || !primaryRegion) {
            console.log('[DEBUG] Missing fields:', { value, displayName, category, gender, primaryRegion });
            return res.status(400).json({
                success: false,
                error: 'MISSING_FIELDS',
                message: 'Missing required fields: value, displayName, category, gender, primaryRegion'
            });
        }

        // Check for duplicates
        const existing = await SizeMaster.findOne({
            category: category.toUpperCase(),
            gender: gender.toUpperCase(),
            primaryRegion: primaryRegion.toUpperCase(),
            value: value.toUpperCase()
        });

        if (existing) {
            console.log('[DEBUG] Duplicate found:', existing._id);
            return res.status(409).json({
                success: false,
                error: 'DUPLICATE_ENTRY',
                message: `Size "${value}" already exists for ${gender} ${category} in ${primaryRegion} region`,
                existingId: existing._id
            });
        }

        // Create size
        const size = await SizeMaster.create({
            value: value.toUpperCase(),
            displayName,
            category: category.toUpperCase(),
            gender: gender.toUpperCase(),
            primaryRegion: primaryRegion.toUpperCase(),
            normalizedRank: normalizedRank || 0,
            lifecycleState: lifecycleState?.toUpperCase() || 'DRAFT',
            measurements,
            conversions,
            createdBy: req.user?._id
        });

        res.status(201).json({
            success: true,
            message: 'Size created successfully',
            data: size
        });
    } catch (error) {
        console.error('Create size error:', error);

        if (error.code === 11000) {
            console.log('[DEBUG] Mongoose Duplicate Key:', error.keyValue);
            return res.status(409).json({
                success: false,
                error: 'DUPLICATE_ENTRY',
                message: 'Size with this combination already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create size'
        });
    }
};
```

---

### **Get Sizes (Cursor Pagination)**
```javascript
export const getSizes = async (req, res) => {
    try {
        const {
            category,
            gender,
            region,
            status,
            search,
            cursor,
            limit = 20
        } = req.query;

        const query = {};

        // Apply filters
        if (category) query.category = category.toUpperCase();
        if (gender) query.gender = gender.toUpperCase();
        if (region) query.primaryRegion = region.toUpperCase();
        if (status) query.lifecycleState = status.toUpperCase();
        
        // Search
        if (search) {
            query.$or = [
                { value: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } }
            ];
        }

        // Cursor pagination
        if (cursor) {
            const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
            const cursorData = JSON.parse(decodedCursor);
            query._id = { $gt: cursorData._id };
        }

        console.log('[DEBUG] Query:', query);

        const docs = await SizeMaster.find(query)
            .sort({ normalizedRank: 1, _id: 1 })
            .limit(parseInt(limit) + 1)
            .lean();

        console.log('[DEBUG] Found:', docs.length, 'documents');

        const hasMore = docs.length > parseInt(limit);
        const data = hasMore ? docs.slice(0, -1) : docs;

        let nextCursor = null;
        if (hasMore) {
            const lastDoc = data[data.length - 1];
            nextCursor = Buffer.from(JSON.stringify({ _id: lastDoc._id })).toString('base64');
        }

        res.json({
            success: true,
            data,
            pagination: {
                hasMore,
                nextCursor,
                count: data.length
            }
        });
    } catch (error) {
        console.error('Get sizes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sizes'
        });
    }
};
```

---

### **Update Size**
```javascript
export const updateSize = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating immutable fields
        delete updates.canonicalId;
        delete updates.usageCount;
        delete updates.createdAt;

        const size = await SizeMaster.findByIdAndUpdate(
            id,
            {
                ...updates,
                updatedBy: req.user?._id
            },
            { new: true, runValidators: true }
        );

        if (!size) {
            return res.status(404).json({
                success: false,
                message: 'Size not found'
            });
        }

        res.json({
            success: true,
            message: 'Size updated successfully',
            data: size
        });
    } catch (error) {
        console.error('Update size error:', error);
        
        if (error.message.includes('locked')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update size'
        });
    }
};
```

---

### **Delete Size (Safe)**
```javascript
export const deleteSize = async (req, res) => {
    try {
        const { id } = req.params;

        const size = await SizeMaster.findById(id);

        if (!size) {
            return res.status(404).json({
                success: false,
                message: 'Size not found'
            });
        }

        // Check usage
        if (size.usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete size with ${size.usageCount} active references. Deprecate instead.`
            });
        }

        await size.deleteOne();

        res.json({
            success: true,
            message: 'Size deleted successfully'
        });
    } catch (error) {
        console.error('Delete size error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete size'
        });
    }
};
```

---

### **Lock/Unlock Size**
```javascript
export const toggleLock = async (req, res) => {
    try {
        const { id } = req.params;

        const size = await SizeMaster.findById(id);

        if (!size) {
            return res.status(404).json({
                success: false,
                message: 'Size not found'
            });
        }

        size.isLocked = !size.isLocked;
        await size.save();

        res.json({
            success: true,
            data: {
                _id: size._id,
                isLocked: size.isLocked
            }
        });
    } catch (error) {
        console.error('Toggle lock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle lock'
        });
    }
};
```

---

## ✅ VALIDATION RULES

### **Schema-Level Validation**
1. **Compound Uniqueness**: `{ category, gender, primaryRegion, value }` must be unique
2. **Required Fields**: `value`, `displayName`, `category`, `gender`, `primaryRegion`, `normalizedRank`, `lifecycleState`, `canonicalId`
3. **Enum Validation**:
   - `category`: CLOTHING, FOOTWEAR, ACCESSORIES, STORAGE, RAM, DISPLAY, DIMENSION
   - `gender`: MEN, WOMEN, UNISEX, BOYS, GIRLS, INFANT, KIDS
   - `primaryRegion`: US, UK, EU, JP, AU, CN, GLOBAL
   - `lifecycleState`: DRAFT, ACTIVE, DEPRECATED, ARCHIVED
4. **Lifecycle Transitions**:
   - DRAFT → ACTIVE, ARCHIVED
   - ACTIVE → DEPRECATED, ARCHIVED
   - DEPRECATED → ARCHIVED
   - ARCHIVED → (terminal state)
5. **Lock Enforcement**: Cannot modify locked sizes (except `isLocked`, `updatedBy`, `auditLog`)
6. **Deletion Prevention**: Cannot delete if `usageCount > 0`

---

## 🧪 TESTING CHECKLIST

### **Unit Tests**
```javascript
describe('SizeMaster Model', () => {
    test('should create size with valid data', async () => {
        const size = await SizeMaster.create({
            value: 'M',
            displayName: 'Medium',
            category: 'CLOTHING',
            gender: 'UNISEX',
            primaryRegion: 'GLOBAL',
            normalizedRank: 50
        });
        expect(size.canonicalId).toBe('SIZE-CLOTHING-UNISEX-GLOBAL-M');
    });

    test('should reject duplicate size', async () => {
        await SizeMaster.create({
            value: 'M',
            displayName: 'Medium',
            category: 'CLOTHING',
            gender: 'UNISEX',
            primaryRegion: 'GLOBAL'
        });
        
        await expect(SizeMaster.create({
            value: 'M',
            displayName: 'Medium Duplicate',
            category: 'CLOTHING',
            gender: 'UNISEX',
            primaryRegion: 'GLOBAL'
        })).rejects.toThrow();
    });

    test('should prevent invalid lifecycle transition', async () => {
        const size = await SizeMaster.create({
            value: 'L',
            displayName: 'Large',
            category: 'CLOTHING',
            gender: 'UNISEX',
            primaryRegion: 'GLOBAL',
            lifecycleState: 'ARCHIVED'
        });
        
        size.lifecycleState = 'ACTIVE';
        await expect(size.save()).rejects.toThrow('Invalid lifecycle transition');
    });

    test('should prevent modification of locked size', async () => {
        const size = await SizeMaster.create({
            value: 'XL',
            displayName: 'Extra Large',
            category: 'CLOTHING',
            gender: 'UNISEX',
            primaryRegion: 'GLOBAL',
            isLocked: true
        });
        
        size.displayName = 'XL Updated';
        await expect(size.save()).rejects.toThrow('Cannot modify locked size');
    });
});
```

---

## 🚀 DEPLOYMENT CHECKLIST

### **Pre-Deployment**
- [x] Fix `pre('save')` hook (remove `next()` from async function)
- [x] Update all enum values to UPPERCASE
- [x] Sync legacy models (`SizeMaster.js`, `Size.model.js`)
- [x] Add compound unique index
- [x] Add lifecycle transition validation
- [x] Add lock enforcement
- [x] Add usage tracking
- [x] Test all CRUD operations
- [x] Test duplicate prevention
- [x] Test lifecycle transitions
- [x] Test lock enforcement

### **Deployment Steps**
1. **Stop Backend Server**
   ```bash
   # Ctrl+C in terminal
   ```

2. **Clear Mongoose Cache**
   ```bash
   cd Backend
   rm -rf node_modules/.cache
   ```

3. **Restart Backend**
   ```bash
   npm run dev
   ```

4. **Verify Enum Loading**
   ```javascript
   // Add to controller temporarily
   console.log('[ENUM CHECK] Category:', SizeMaster.schema.path('category').enumValues);
   console.log('[ENUM CHECK] Gender:', SizeMaster.schema.path('gender').enumValues);
   ```

5. **Test Size Creation**
   ```bash
   curl -X POST http://localhost:5000/api/sizes \
     -H "Content-Type: application/json" \
     -d '{
       "value": "M",
       "displayName": "Medium",
       "category": "STORAGE",
       "gender": "UNISEX",
       "primaryRegion": "GLOBAL",
       "normalizedRank": 50
     }'
   ```

### **Post-Deployment Verification**
- [ ] Create size succeeds (201)
- [ ] Duplicate returns 409
- [ ] Invalid enum returns 400
- [ ] Cursor pagination works
- [ ] Lock prevents modification
- [ ] Delete prevention works
- [ ] Lifecycle transitions validated

---

## 📊 SAMPLE SEED DATA

```javascript
const seedSizes = [
  // Clothing - Unisex
  { value: "XS", displayName: "Extra Small", category: "CLOTHING", gender: "UNISEX", normalizedRank: 20 },
  { value: "S", displayName: "Small", category: "CLOTHING", gender: "UNISEX", normalizedRank: 30 },
  { value: "M", displayName: "Medium", category: "CLOTHING", gender: "UNISEX", normalizedRank: 50 },
  { value: "L", displayName: "Large", category: "CLOTHING", gender: "UNISEX", normalizedRank: 70 },
  { value: "XL", displayName: "Extra Large", category: "CLOTHING", gender: "UNISEX", normalizedRank: 80 },
  
  // Storage
  { value: "64GB", displayName: "64 GB", category: "STORAGE", gender: "UNISEX", normalizedRank: 30, numericValue: 64 },
  { value: "128GB", displayName: "128 GB", category: "STORAGE", gender: "UNISEX", normalizedRank: 40, numericValue: 128 },
  { value: "256GB", displayName: "256 GB", category: "STORAGE", gender: "UNISEX", normalizedRank: 50, numericValue: 256 },
  
  // RAM
  { value: "4GB", displayName: "4 GB", category: "RAM", gender: "UNISEX", normalizedRank: 20, numericValue: 4 },
  { value: "8GB", displayName: "8 GB", category: "RAM", gender: "UNISEX", normalizedRank: 30, numericValue: 8 },
  { value: "16GB", displayName: "16 GB", category: "RAM", gender: "UNISEX", normalizedRank: 50, numericValue: 16 }
];

// Bulk insert
await SizeMaster.insertMany(seedSizes.map(s => ({
  ...s,
  primaryRegion: 'GLOBAL',
  lifecycleState: 'ACTIVE'
})));
```

---

**Status:** ✅ Production Ready  
**Version:** 2.0 Enterprise  
**Last Updated:** February 16, 2026  
**Critical Fix Applied:** Async hook `next()` removed
