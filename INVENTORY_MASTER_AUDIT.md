# Inventory Master - Audit & Architectural Design

**Date:** February 5, 2026
**Architect:** System Architect (Antigravity)
**Status:** 🛑 **CRITICAL FAILURE** (Dual Source of Truth / Non-Compliant Architecture)

---

## 1. Executive Summary

The current inventory architecture is **fundamentally flawed** and violates the Non-Negotiable Rules of the project.
The `InventoryService` (Line 12) explicitly states: **"Stock is stored ONLY in Variant model"**.
However, the Architectural Rules state: **"Variant Master must NEVER store inventory"**.

This violation couples inventory logic to the catalog, preventing scalability and violating separation of concerns.

**Current Score:** 0/100
**Verdict:** 🛑 **CRITICAL FAILURE**

---

## 2. Violation Analysis

| Rule | Current Implementation | Violation |
|------|------------------------|-----------|
| **Inventory Master owns Rule** | Stock logic is inside `Variant.stock` | 🔴 YES. `InventoryService` writes directly to `Variant`. |
| **No Stock in Variant** | `VariantSchema` has commented out stock, BUT Service uses `variant.stock`. | 🔴 YES. The service assumes `variant.stock` exists. |
| **No Static Values** | Available stock is calculated on-the-fly? | 🟡 Partial. Logic is there but based on wrong schema. |
| **Inventory Ledger** | Exists (`InventoryLedger.model.js`) | 🟢 Valid. Ledger is correct. |

---

## 3. The Evidence (`inventory.service.js`)

```javascript
/* INVENTORY SERVICE (Lines 11-13) */
// ARCHITECTURE CHANGE:
// - Stock is stored ONLY in Variant model (variant.stock, variant.reserved)
// - InventoryMaster is DEPRECATED and REMOVED
```

This code explicitly admits to violating the core rules.

---

## 4. Required Architecture (The Fix)

We must restore the **Inventory Master** as a separate entity.

### A. New Schema: `InventoryMaster.js`
```javascript
const inventoryMasterSchema = new Schema({
    variantId: { type: ObjectId, ref: 'Variant', unique: true, required: true },
    productId: { type: ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, index: true },
    
    // The Source of Truth
    totalStock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    
    // Configuration
    lowStockThreshold: { type: Number, default: 5 },
    warehouseLocation: { type: String, default: 'Default' },
    
    lastUpdated: { type: Date, default: Date.now }
});
```

### B. Service Refactor
The `InventoryService` must communicate with `InventoryMaster` collection, NOT `Variant` collection for stock updates.

---

## 5. Implementation Plan

1.  **Create Model**: Create `InventoryMaster.model.js`.
2.  **Refactor Service**: Rewrite `inventory.service.js` to target `InventoryMaster` instead of `Variant`.
3.  **Clean Variant**: Ensure `VariantSchema` strictly has **NO** stock fields (runtime or physical).
4.  **Migration**: If any stock exists in Variants, it must be migrated to the new collection.

---

**Signed Off By:**
Antigravity (System Architect)
