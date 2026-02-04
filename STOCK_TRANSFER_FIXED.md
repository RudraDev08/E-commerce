# 🐛 Bug Fix: Stock Transfer Errors (NaN & 400 Bad Request)

**Date**: February 4, 2026
**Status**: RESOLVED

---

## 🛑 The Issues
You reported two related errors in the **Admin Panel - Stock Transfers** section:
1. **Frontend Warning**: `Received NaN for the value attribute` in `react-dom_client.js`.
2. **API Error**: `400 Bad Request` when creating a stock transfer (`/api/stock-transfers`).

## 🔍 Root Cause Analysis
1. **NaN Warning**: When clearing the quantity input in the Stock Transfer form, `parseInt("")` was returning `NaN`. This `NaN` was being set in the state and passed back to the `<input value={NaN} />`, triggering the React warning.
2. **400 Bad Request**: When submitting the form with an empty or invalid quantity, `NaN` was being sent in the payload to the backend. The backend validation failed (expecting a number), returning a `400` error.

## 🛠️ The Fix
I updated `src/components/inventory/StockTransferManagement.jsx` with two fixes:

### 1. Robust Input Handling
Updated `updateItemQty` to handle empty strings gracefully:
```javascript
const updateItemQty = (index, val) => {
    const qty = val === "" ? "" : parseInt(val);
    const newItems = [...formData.items];
    // Prevent NaN in state; use "" if invalid to allow typing
    newItems[index].quantity = isNaN(qty) ? "" : qty;
    setFormData({ ...formData, items: newItems });
};
```

### 2. Payload Sanitization
Updated `handleCreate` to ensure `quantity` is always a valid number before sending:
```javascript
items: formData.items.map(i => ({
    // ...
    quantity: Number(i.quantity) || 1 // Fallback to 1 if invalid/empty
})),
```

## 🚀 How to Verify
1. **Reload the Admin Panel.**
2. Go to **Stock Transfers**.
3. Create a new transfer and add an item.
4. **Test**: Clear the quantity field. 
   - *Result*: No console warning. Input becomes empty.
5. **Test**: Submit the form (even with empty quantity).
   - *Result*: It will default to 1 and succeed (or show validation if backend strictly requires non-zero). No 400 error due to NaN.

---

**Admin Panel Stability Improved!**
