# 🏗 Variant Master Architecture & Design Specification

This document defines the production-grade architecture for the **Variant Master** module. The design strictly adheres to the principle of **Separation of Concerns**, decoupling Identity (Variant) from Availability (Inventory).

---

## 1. 🧩 Database Schema Design

### 1.1 Variant Model (`Variant.js`)
The `Variant` model serves as the **Identity Authority**. It defines *what* a product version is, but not *how many* exist.

```javascript
import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    // 🔒 1. Core Identity (Immutable References)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
      immutable: true // Cannot be moved to another product
    },
    size: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Size",
      required: true,
      index: true 
      // Contains RAM/Storage configuration (e.g. "12GB/256GB")
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: true,
      index: true
    },

    // 🔑 2. Unique Identifier
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      immutable: true // SKU never changes once generated
    },

    // 💰 3. Economics
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"] 
      // Overrides Product Base Price
    },
    mrp: {
      type: Number,
      min: 0,
      default: 0
    },
    costPrice: {
      type: Number,
      min: 0,
      default: 0
      // For internal margin analysis
    },

    // 🖼 4. Visuals (Variant Specific)
    images: [{
      url: { type: String, required: true },
      alt: { type: String },
      isPrimary: { type: Boolean, default: false },
      sortOrder: { type: Number, default: 0 }
    }],

    // ⚙️ 5. Control Flags
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
      index: true
    },
    isDefault: {
      type: Boolean,
      default: false
      // If true, this variant is pre-selected on PDP
    },

    // 🗑 6. Safety (Soft Delete)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// 🛡 Data Integrity Constraints
// 1. A Product cannot have duplicate configuration (Same Size + Same Color)
variantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true });

// 2. Fast Lookup
variantSchema.index({ sku: 1 });

export default mongoose.model("Variant", variantSchema);
```

---

## 2. ⚙️ Logic Specifications

### 2.1 SKU Generation Logic (Backend Only)
The SKU is the single source of truth for the variant's existence. It is **auto-generated** and **immutable**.

**Format:** `PROD-{productCode}-{RAM}-{STORAGE}-{COLORCODE}`

**Function:**
```javascript
async function generateSKU(product, size, color) {
  // 1. Extract Components
  const pCode = product.productCode; // e.g., "PROD-2026-000105"
  
  // 2. Extract Size Dimensions (From Size Master)
  // Ensure Size has structured 'ram' and 'storage' fields
  const ram = size.ram ? `${size.ram}GB` : '0'; 
  const storage = size.storage ? `${size.storage}${size.storageUnit || 'GB'}` : '0';
  
  // 3. Extract Color
  const colorCode = color.code || color.slug.toUpperCase().substring(0, 3);
  
  // 4. Construct
  const sku = `${pCode}-${ram}-${storage}-${colorCode}`;
  
  // 5. Final Sanity Check (Remove invalid chars)
  return sku.replace(/[^A-Z0-9-]/g, '').toUpperCase();
}
```

### 2.2 Variant Generation Logic (Admin Builder)
When an Admin selects `[S1, S2]` (Sizes) and `[C1, C2]` (Colors):

1.  **Cartesian Product**: The system calculates all possible matrices:
    *   `S1 + C1`
    *   `S1 + C2`
    *   `S2 + C1`
    *   `S2 + C2`
2.  **Filter Existing**: Check DB for existing combinations for this `product_id`.
3.  **Render**:
    *   **Existing Variants**: Show as "Active" (Editable Price/Status).
    *   **New Combinations**: Show as "Draft/New" rows (ready to save).
4.  **Save Action**:
    *   Iterate over *new* rows.
    *   Call `generateSKU`.
    *   Insert into DB.
    *   *Note: Do NOT touch Inventory.*

---

## 3. 🖥 Admin Panel (Variant Builder) Flow

### UI Structure
*   **Header**: "Manage Variants for {Product Name}"
*   **Selectors**:
    *   **Size Multi-Select**: Fetches `Size.findActive()`. Display: "8GB / 256GB".
    *   **Color Multi-Select**: Fetches `Color.findActive()`. Display: Swatch + Name.
*   **The Grid (Table)**:
    *   **Columns**: Image (Upload), SKU (Read-Only), Size, Color, Price (Input), Status (Toggle).
    *   **Grouping**: Group rows by **Color** for better visual organization.

### Restrictions
*   ❌ **No Add Row Button**: Rows are *only* generated via Size/Color selectors.
*   ❌ **No Delete Button**: Use "Deactivate" (Status = Inactive) or "Soft Delete".
*   ❌ **No Stock Input**: Explicitly removed.

---

## 4. 🌐 Customer Website (PPD) Data Contract

### API Response (`GET /api/products/:slug`)
The PDP receives the fully hydrated Product + Variants.

```json
{
  "product": {
    "id": "prod_123",
    "name": "ZenPhone X",
    "featuredImage": "...",
    "variants": [
      {
        "id": "var_001",
        "sku": "PROD-2026-105-12GB-256GB-BLK",
        "price": 999,
        "isDefault": true,
        // Hydrated Relationships
        "color": {
          "id": "col_blk",
          "name": "Midnight Black",
          "hex": "#000000"
        },
        "size": {
          "id": "sz_12_256",
          "name": "12GB / 256GB",
          "ram": 12,
          "storage": 256
        },
        // Variant Specific Media
        "images": ["url1.jpg", "url2.jpg"]
      },
      {
        "id": "var_002",
        "sku": "PROD-2026-105-12GB-512GB-BLK",
        // ...
      }
    ]
  }
}
```

### Frontend Logic (Optimistic UI)
1.  **Unique Colors**: Extract unique colors from `variants` array. Render Color swatches.
2.  **Unique Sizes**: Extract unique sizes from `variants` array. Render Size pills.
3.  **Matrix Matcher**:
    ```javascript
    function findVariant(selectedColor, selectedSize) {
      return variants.find(v => v.color.id === selectedColor && v.size.id === selectedSize);
    }
    ```
4.  **Stock Handling**:
    *   **IGNORED**. The PDP *never* checks specific stock counts for UI rendering.
    *   `Add to Cart` is **always enabled** if a valid variant exists.
    *   Validation happens strictly at `POST /checkout`.

---

## 5. 🛡 Safety & Edge Cases

| Scenario | Handling |
| :--- | :--- |
| **New Size Added** | Admin goes to Builder ➝ Selects new Size ➝ System generates new rows. Old rows remain untouched. |
| **Price Change** | Admin updates Variant price ➝ Immediate reflection on PDP. Base Product price is ignored for variants. |
| **Deleting a Size** | Blocked at DB level if `Variant` exists referring to it. Must soft-delete variants first. |
| **Duplicate SKU** | DB Unique Index constraint throws error. Transaction rolls back. |
| **Invalid Config** | API validation ensures `ram` and `storage` are strictly numbers in Size Master, prevents garbage data. |

---

## 6. 🖼 Multi-Image Logic
*   **Inheritance**: If a variant has `images: []` (empty), it falls back to `Product.gallery`.
*   **Override**: If a variant has images, PDP replaces the main gallery strictly with variant images only.

