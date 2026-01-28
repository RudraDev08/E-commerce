# SCALABLE VARIANT STRATEGY: Single vs. Multi-Color Architecture

This document outlines the architectural strategy to support both **Single Color** (e.g., T-Shirts, Phones) and **Multi-Part Colorways** (e.g., Sneakers with primary/secondary/accent colors) within a single, unified system.

---

## 1. Product Level Configuration

To distinguish behaviors, we introduce a control field at the `Product` level. This tells the UI which "Concept" of variance to apply.

### Product Schema Update
```javascript
// In ProductSchema
variantType: {
  type: String,
  enum: ['SINGLE_COLOR', 'COLORWAY'], 
  default: 'SINGLE_COLOR',
  required: true
}
```

- **SINGLE_COLOR**: Standard e-commerce logic. One variant = One Size + One Color.
- **COLORWAY**: Sneaker/Complex logic. One variant = One Size + One "Colorway" (which consists of multiple distinct colors).

**Why?**
The UI needs to know *before* rendering the form whether to ask for "Blue" (Single) or "Midnight Navy / University Red / White" (Colorway).

---

## 2. Variant Data Model (Unified Schema)

We use a **Hybrid Polymorphic** approach in `ProductVariantSchema`. We do NOT split collections.

### Updated Variant Schema
```javascript
const productVariantSchema = new mongoose.Schema({
  productId: { type: ObjectId, ref: 'Product', required: true },
  
  // --- 1. Sizing (Universal) ---
  sizeId: { type: ObjectId, ref: 'Size', required: true },

  // --- 2. Color Logic (Polymorphic) ---
  
  // A. For SINGLE_COLOR (e.g., "iPhone 15 - Blue")
  colorId: { type: ObjectId, ref: 'Color' }, 

  // B. For COLORWAY (e.g., "Jordan 4 - Bred")
  colorwayName: { type: String }, // Friendly Name: "Bred" or "Midnight Navy"
  colorParts: [{ type: ObjectId, ref: 'Color' }], // [Black_ID, Red_ID, White_ID]

  // --- 3. Inventory & Pricing (Universal) ---
  sku: { type: String, unique: true }, // generated
  price: Number,
  stock: Number,
  
  // Meta
  status: { type: Boolean, default: true }
});
```

- **Single Color Products** use only `sizeId` + `colorId`.
- **Colorway Products** use `sizeId` + `colorwayName` + `colorParts`.

---

## 3. Admin Variant Creation Flow

The Variant Builder page uses `product.variantType` to switch modes.

### A. Flow: SINGLE_COLOR (e.g. T-Shirt)
1.  **Input**: Select Sizes: `[S, M, L]` + Select Colors: `[Red, Blue]`.
2.  **Generator**: Cartesian Product (3 Sizes × 2 Colors = 6 Variants).
3.  **Result**: 
    - `S - Red`
    - `S - Blue` ...

### B. Flow: COLORWAY (e.g. Sneaker)
1.  **Step 1**: Define the **Colorway Concept**.
    - Name: "Chicago"
    - Palette Selection: `[Red, Black, White]` (Multi-select from Color Master).
2.  **Step 2**: Select Sizes: `[US 7, US 8, US 9]`.
3.  **Generator**: Apply this Colorway Concept to ALL selected sizes.
4.  **Result**:
    - `US 7 - Chicago (Red/Black/White)`
    - `US 8 - Chicago (Red/Black/White)` ...

*The UI must allow creating Multiple Colorways sequentially. (Create "Chicago" -> Save -> Clear -> Create "UNC").*

---

## 4. Admin Preview Table (Merged Display)

The table renders the "Visual Identity" column differently based on data.

### UI Logic (React Component)
```jsx
<td>
  {variant.colorParts && variant.colorParts.length > 0 ? (
    // COLORWAY UI
    <div className="flex flex-col">
      <span className="font-bold text-sm">{variant.colorwayName}</span>
      <div className="flex -space-x-1 mt-1">
        {variant.colorParts.map(c => (
           <div 
             key={c._id} 
             className="w-4 h-4 rounded-full border border-white" 
             style={{ backgroundColor: c.hexCode }} 
           />
        ))}
      </div>
    </div>
  ) : (
    // SINGLE COLOR UI
    <div className="flex items-center gap-2">
       <div className="w-6 h-6 rounded-full" style={{ bg: variant.color.hex }} />
       <span>{variant.color.name}</span>
    </div>
  )}
</td>
```

---

## 5. SKU Generation Strategy

We need a readable format that identifies the specific nature of the variant.

### Logic
1.  **Base**: `PROD-MODEL` (e.g. `AIR-J4`)
2.  **Size**: `US9` or `XL`
3.  **Color Identifier**:
    - **Single**: First 3 chars of Color Name (`RED`)
    - **Colorway**: First letter of each color part (`RBW` for Red/Black/White) OR First 3 chars of Colorway Name (`CHI` for Chicago).

**Example SKUs:**
- Single: `TEES-L-RED`
- Colorway: `J4-US9-CHI` (Preferred) or `J4-US9-RBW`

---

## 6. Inventory & Price Handling

**Why Variant Level?**
- **Inventory**: You run out of `US 9` specifically, not the whole "Chicago" shoe.
- **Price**: Rare sizes (e.g. `US 15`) or specific Colorways (e.g. "Travis Scott Edition") often command higher prices than standard ones.

**Mechanism**:
The fields `stock` and `price` exist on EVERY variant document.
- **Single**: All `Red T-Shirt` sizes usually same price. Admin "Bulk Edit" sets all to $20.
- **Colorway**: "University Blue" might be $200, while "Standard Black" is $150. Allows per-variant override.

---

## 7. Data Migration Strategy

If you have existing data (which you do), we need to standardize it.

### Migration Script Logic
1.  **Detect Type**: 
    - If `attributes.size` AND `attributes.color` exist -> Mark Product as `SINGLE_COLOR`.
    - If `attributes.color` is an Array or missing -> Mark `COLORWAY` (Manual review).
2.  **Migrate Variants**:
    - Create `colorId` field from `attributes.color` lookups.
    - If `variantType` is newly set to Colorway, move simple colors to `colorParts=[colorId]`.

### Safety
- **Backup**: `mongodump` before running.
- **Default**: Assume `SINGLE_COLOR` for all legacy items unless manually flagged.

---

## Summary of Action Plan
1.  **Backend**: Edit `ProductSchema` (add variantType) and `ProductVariantSchema` (add colorParts).
2.  **Frontend**: 
    - Update `AddProduct` to toggle variantType.
    - Rewrite `VariantBuilder` to support the "Colorway" creation flow.
3.  **Script**: Run a database migration to align existing items.
