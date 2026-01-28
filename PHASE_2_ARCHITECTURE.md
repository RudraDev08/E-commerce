# PHASE 2: Advanced E-commerce Architecture (Production-Grade)

This document outlines the architectural plan for scaling the Zeno-Panel to an industry-standard e-commerce system. It covers inventory, pricing, attributes, cart, orders, and reporting logic.

---

## 1. Inventory Management (Variant Level)

**Concept:** 
Stock management moves from the `Product` level (general) to the `Variant` level (specific). We track physical stock, reserved stock (in carts/unpaid orders), and sellable stock.

### MongoDB Schema Update (`ProductVariantSchema`)
```javascript
const inventorySchema = new mongoose.Schema({
  quantity: { type: Number, required: true, min: 0 },      // Physical Count
  reserved: { type: Number, default: 0, min: 0 },          // Locked in active orders
  minStock: { type: Number, default: 5 },                  // Low stock alert threshold
  location: { type: String, default: 'Warehouse A' },      // Bin/Rack location
  allowBackorder: { type: Boolean, default: false }        // Sell even if 0?
});

// Virtual for "Sellable Stock"
inventorySchema.virtual('sellable').get(function() {
  return Math.max(0, this.quantity - this.reserved);
});
```

### API Strategy
- **GET /api/variants/:id/inventory**: Returns stock status.
- **PATCH /api/variants/:id/adjust-stock**: specialized endpoint for stock corrections (restock, damage, audit).
  - Body: `{ adjustment: 10, reason: "Restock" }` or `{ adjustment: -2, reason: "Damaged" }`

### Admin UI Structure
- **Table Columns**: Variant Name (Size/Color), SKU, Physical Stock, Reserved, Sellable, Status.
- **Inline Edit**: Click on "Physical Stock" to pop up a small numeric input for quick + / - adjustments.
- **Visuals**: 
  - `quantity <= minStock` → Row highlighted in yellow/red.
  - `sellable === 0` → "Out of Stock" (Gray badge).

---

## 2. Variant Pricing Engine

**Concept:**
Pricing is complex. We need base cost (for profit calc), MRP (for strike-through), and Selling Price.

### MongoDB Schema Update (`ProductVariantSchema`)
```javascript
const pricingSchema = new mongoose.Schema({
  basePrice: { type: Number, required: true },  // MRP / Compare At
  salePrice: { type: Number, required: true },  // Actual Selling Price
  costPrice: { type: Number, select: false },   // Internal Cost (Admin only)
  taxRate: { type: Number, default: 0 },        // Percentage
  currency: { type: String, default: 'USD' }
});

// Virtual for Profit Margin
pricingSchema.virtual('margin').get(function() {
  return this.salePrice - (this.costPrice || 0);
});
```

### Admin UI Logic
- **Batch Editing**: A "Bulk Edit" tool to increase all prices by X% or $X.
- **Profit Display**: Show profit margin percentage next to the price input (Calculated on the fly: `((Sale - Cost) / Sale) * 100`).

---

## 3. Variant Image Management

**Concept:**
Users buy visual variants. Selecting "Red" should show the Red T-shirt.

### MongoDB Schema Attributes
```javascript
// In ProductVariantSchema
images: [{ 
  url: String, 
  alt: String, 
  isPrimary: { type: Boolean, default: false } 
}]
```

### API & Storage
- **Upload Flow**: 
  1. Upload raw images -> `uploads/products/{product_id}/variants/{variant_sku}/`.
  2. Store paths in database.
- **Frontend Logic**: 
  - When user selects `Color: Red`, filter variants to find the one matching "Red".
  - Update the main Product Gallery with `variant.images`.

---

## 4. Product Attributes (Dynamic)

**Concept:**
Flexible attributes that don't affect SKU generation but are critical for specs (e.g., "Material", "Care Instructions").

### Schema Strategy
Instead of hardcoding fields, we use a Key-Value array indexable by MongoDB.
```javascript
// In ProductSchema
attributes: [{
  key: { type: String, required: true }, // e.g., "Screen Type"
  value: { type: String, required: true }, // e.g., "OLED"
  group: { type: String, default: "Specifications" }, // For grouping in UI
  searchable: { type: Boolean, default: true } // Include in filters?
}]
```
*Indexing*: `db.products.createIndex({ "attributes.key": 1, "attributes.value": 1 })` allow super fast dynamic filtering.

### Admin UI Form
- **Dynamic Rows**: "Add Attribute" button adds a row of [ Key Input ] [ Value Input ].
- **Category Templates**: When Category is selected (e.g., "Laptops"), auto-populate keys like "Processor", "RAM", "Storage" (defined in Category Master) so the user just fills values.

---

## 5. Cart System (Variant Driven)

**Concept:**
The Cart is a temporary collection of Variants.

### Schema (`CartSchema`)
```javascript
userId: { type: ObjectId, ref: 'User' },
sessionId: { type: String, index: true }, // For guest checkout
items: [{
  variantId: { type: ObjectId, ref: 'ProductVariant' },
  productId: { type: ObjectId, ref: 'Product' },
  quantity: { type: Number, min: 1 },
  priceSnapshot: Number, // Price at moment of adding (for detecting changes)
  addedAt: Date
}]
```

### Validation Logic (Critical)
- **Stock Check**: Before adding, check `variant.inventory.sellable >= requested_qty`.
- **Reservation (Optional)**: High-traffic sites reserve stock for 10 mins. For now, we'll validate stock again at checkout.

---

## 6. Checkout & Order Management

**Concept:**
The transition from flexible Cart to immutable Record.

### Schema (`OrderSchema`)
```javascript
orderId: { type: String, unique: true }, // Friendly ID: ORD-2024-001
customer: { type: ObjectId, ref: 'User' },
items: [{
  variantId: ObjectId,
  productName: String, // Snapshot name in case product is deleted
  sku: String,
  quantity: Number,
  price: Number,
  tax: Number
}],
financials: {
  subtotal: Number,
  taxTotal: Number,
  shippingTotal: Number,
  discountTotal: Number,
  grandTotal: Number,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'] }
},
fulfillment: {
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
  trackingNumber: String,
  courier: String
},
timeline: [{ state: String, timestamp: Date, note: String }]
```

### Stock Deduction Flow
1. **User clicks "Place Order"**.
2. **Transaction Start**.
3. Re-check stock for all items.
4. If OK -> Deduct from `inventory.quantity` (or move to `reserved`).
5. Create Order.
6. **Transaction End**.

---

## 7. Returns & Refunds

**Concept:**
A reversed order flow.

- **RMA System**: User creates a "Return Merchandise Authorization" request.
- **Admin Action**:
  - `Approve`: Generates a return shipping label.
  - `Inspect`: Item received at warehouse.
  - `Restock`: Item added back to `inventory.quantity`.
  - `Refund`: Trigger payment gateway refund.

---

## 8. Coupons & Discounts

**Concept:**
Rule-based price reduction.

### Schema (`CouponSchema`)
```javascript
code: { type: String, unique: true, uppercase: true },
type: { type: String, enum: ['percentage', 'fixed'] },
value: Number, // 10% or $10
minOrderValue: Number,
maxDiscount: Number, // Cap for % based
usageLimit: Number,
usedCount: Number,
applicableTo: {
  categories: [ObjectId],
  products: [ObjectId] // Empty = All
},
expiry: Date
```

---

## 9. Dashboard & Analytics

**Concept:**
Data visualization from Orders and Products.

### Key Metrics
1. **Low Stock Alerts**: Query `variants where quantity <= minStock`.
2. **Sales Velocity**: Sum of `order.items.quantity` grouped by `variantId` over last 30 days.
3. **Ghost Carts**: Count of Carts created > 24h ago but not converted to Orders.

---

## Implementation Roadmap (Next Steps)

1. **Refactor Variant Schema**: Apply Inventory and Pricing schemas.
2. **Update Admin UI**: Product Form needs to support adding Attributes.
3. **Build Cart API**: Create the `/api/cart` endpoints.
