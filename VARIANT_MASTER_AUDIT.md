# Variant Master - Audit & Architectural Design

**Date:** February 5, 2026
**Architect:** System Architect (Antigravity)
**Status:** ⚠️ **NEEDS UPGRADE** (Basic Implementation Found)

---

## 1. Executive Summary

The current Variant Master implementation is **functional but risky**. It relies on a generic `attributes: Object` field rather than structured relationships. This makes it impossible to enforce data integrity (e.g., ensuring `attributes.size` actually points to a valid `Size` document). It also lacks visibility flags and advanced pricing fields required for enterprise e-commerce.

**Current Score:** 70/100
**Verdict:** 🛑 **NOT Production Ready** for Enterprise scaling.

---

## 2. Gap Analysis

| Feature | Current Implementation | Requirement | Gap Severity |
|---------|------------------------|-------------|--------------|
| **Attributes** | ⚠️ Generic `attributes: {}` | Structured `sizeId`, `colorId` refs | 🔴 Critical |
| **Pricing** | ⚠️ `price` only | `mrp`, `costPrice`, `discount` | 🟡 Moderate |
| **Visibility** | ❌ None | `isDefault`, `isFeatured`, `sortOrder` | 🟡 Moderate |
| **Media** | ❌ None | `images` array (Variant specific) | 🔴 Critical |
| **Inventory** | ✅ Decoupled (removed `stock`) | Strict Isolation | 🟢 Good |
| **Uniqueness** | ⚠️ Unclear constraint | Hash of (Product + Size + Color) | 🔴 Critical |

---

## 3. Schema Design (Recommended)

To achieve enterprise readiness, the `Variant` schema must be upgraded to:

```javascript
const variantSchema = new mongoose.Schema({
    // Identity
    product: { type: ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true },
    
    // Structured Attributes (Crucial for Filtering)
    size: { type: ObjectId, ref: 'Size' }, 
    color: { type: ObjectId, ref: 'Color' },
    material: { type: String }, // Optional unstructured
    style: { type: String },    // Optional unstructured

    // Pricing Overrides
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    
    // Media (Variant Specific)
    images: [{
        url: { type: String, required: true },
        alt: { type: String },
        sortOrder: { type: Number, default: 0 }
    }],

    // Configuration
    isDefault: { type: Boolean, default: false },
    status: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    
    // Audit
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { timestamps: true });

// Compound Index: Prevent duplicate variants for same product
variantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true });
```

---

## 4. API Design Check

**Current Endpoints:**
- `POST /variants`: ⚠️ Uses generic `attributes`. Needs update.
- `GET /variants`: ⚠️ Populates `sizeId`/`colorId` which don't exist in current schema (Mismatch found in Controller logic vs Schema).

**Risk Detected in Controller:**
The controller tries to populate:
```javascript
await variant.populate('sizeId', 'code name');
await variant.populate('colorId', 'name hexCode');
```
BUT the current schema uses:
```javascript
attributes: { type: Object }
```
**Result:** Populate will FAIL silently or cause runtime errors. **This confirms the code is broken/out of sync.**

---

## 5. Implementation Plan (Required Actions)

1.  **Schema Upgrade**: Replace generic `attributes` object with explicit `size` and `color` references.
2.  **Controller Fix**: Update `createVariant` and `updateVariant` to map fields correctly.
3.  **Migration**: Run script to migrate existing `attributes.size` -> `size` field (if any data exists).
4.  **Validation**: Add `isDefault` logic (ensure only one default per product).

---

**Signed Off By:**
Antigravity (System Architect)
