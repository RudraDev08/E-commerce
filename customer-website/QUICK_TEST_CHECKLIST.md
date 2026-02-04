# 🚀 Quick Testing Checklist - E-Commerce Website

**Website URL**: http://localhost:3000  
**Backend API**: http://localhost:5000

---

## ✅ Quick Test (10 Minutes)

### 1. Homepage Test (2 min)
```
URL: http://localhost:3000
```
- [ ] Page loads successfully
- [ ] Products are visible
- [ ] Navigation menu works
- [ ] Cart icon visible

### 2. Product Listing Test (2 min)
```
URL: http://localhost:3000/products
```
- [ ] Products display in grid
- [ ] Sort by "Price: Low to High" works
- [ ] Filter by category works
- [ ] Product count shows

### 3. Product Detail Test (2 min)
```
Click any product card
```
- [ ] Product page loads
- [ ] Image, title, price visible
- [ ] Add to Cart button works
- [ ] Quantity selector works
- [ ] Breadcrumb shows: Home > Products > Category > Product

### 4. Cart Test (2 min)
```
URL: http://localhost:3000/cart
```
- [ ] Added product appears in cart
- [ ] Cart icon shows count (e.g., "1")
- [ ] Quantity +/- buttons work
- [ ] Subtotal and Total display
- [ ] "Proceed to Checkout" button visible

### 5. Checkout Test (2 min)
```
URL: http://localhost:3000/checkout
```
- [ ] Shipping form has all fields (Name, Email, Phone, Address, City, State, Pincode)
- [ ] Payment method selection (COD/Online)
- [ ] Order summary shows items
- [ ] "Place Order" button visible

---

## 🔍 Detailed Test (30 Minutes)

### A. Product Listing Features
- [ ] Sort by: Newest First
- [ ] Sort by: Price Low to High
- [ ] Sort by: Price High to Low
- [ ] Sort by: Most Popular
- [ ] Sort by: Highest Rated
- [ ] Filter by Category (select any)
- [ ] Filter by Brand (select any)
- [ ] Filter by Price Range (enter min/max)
- [ ] Quick Filter: Under ₹500
- [ ] Quick Filter: ₹500 - ₹1000
- [ ] Quick Filter: Above ₹1000
- [ ] Clear All Filters button
- [ ] Pagination: Next button
- [ ] Pagination: Previous button
- [ ] Pagination: Page numbers

### B. Product Detail Features
- [ ] Product title displays
- [ ] Product image loads
- [ ] Price displays
- [ ] Stock status shows (In Stock / Out of Stock)
- [ ] SKU displays
- [ ] Category link works
- [ ] Brand link works (if available)
- [ ] Quantity selector: Decrease (-)
- [ ] Quantity selector: Increase (+)
- [ ] Add to Cart button
- [ ] Add to Wishlist button
- [ ] Description tab
- [ ] Specifications tab
- [ ] Reviews tab
- [ ] Related products section
- [ ] Image thumbnails (if multiple images)
- [ ] Variant selector (if product has variants)

### C. Cart Features
- [ ] Empty cart message (when cart is empty)
- [ ] Product image in cart
- [ ] Product name in cart
- [ ] Product price in cart
- [ ] Variant info in cart (if applicable)
- [ ] Quantity display
- [ ] Increase quantity button
- [ ] Decrease quantity button
- [ ] Remove item button
- [ ] Subtotal calculation
- [ ] Shipping estimate (Free)
- [ ] Tax calculation (18% GST)
- [ ] Total calculation
- [ ] Clear Shopping Cart button
- [ ] Proceed to Checkout button
- [ ] Continue Shopping link

### D. Checkout Features
- [ ] Full Name field (required)
- [ ] Email field (required, validated)
- [ ] Phone field (required)
- [ ] Address field (required)
- [ ] City field (required)
- [ ] State field (required)
- [ ] Pincode field (required)
- [ ] Payment: Cash on Delivery option
- [ ] Payment: Online Payment option
- [ ] Order items preview
- [ ] Subtotal in summary
- [ ] Tax in summary
- [ ] Total in summary
- [ ] Place Order button
- [ ] Back to Cart link

### E. Search Features
- [ ] Search bar in header
- [ ] Search for "test" or any keyword
- [ ] Search results display
- [ ] Product count shows
- [ ] No results message (try "xyz123")

### F. User Account Features
- [ ] Login page (/login)
- [ ] Registration page (/register)
- [ ] Profile page (/profile)
- [ ] Order History page (/orders)
- [ ] Logout functionality

### G. Navigation Features
- [ ] Home link
- [ ] Products link
- [ ] Categories dropdown (if available)
- [ ] Brands link (if available)
- [ ] About page (/about)
- [ ] Contact page (/contact)
- [ ] Privacy Policy (/privacy)
- [ ] Terms & Conditions (/terms)
- [ ] Cart icon with count
- [ ] User account icon

---

## 📱 Mobile Responsiveness Test

**Resize browser to 375px width** (or use Chrome DevTools mobile view)

- [ ] Homepage is responsive
- [ ] Product listing shows mobile filter toggle button
- [ ] Filters sidebar slides in/out on mobile
- [ ] Product cards stack vertically
- [ ] Product detail page is readable
- [ ] Cart page is mobile-friendly
- [ ] Checkout form is mobile-friendly
- [ ] Navigation adapts to mobile (hamburger menu)

---

## 🐛 Error Testing

### Test Error Handling:
1. **Invalid Product URL**
   ```
   URL: http://localhost:3000/product/invalid-slug-123
   ```
   - [ ] Shows "Product not found" message
   - [ ] "Back to Products" button works

2. **Empty Cart Checkout**
   ```
   URL: http://localhost:3000/checkout (with empty cart)
   ```
   - [ ] Redirects to cart page

3. **Invalid Email in Checkout**
   - [ ] Enter "notanemail" in email field
   - [ ] Form validation prevents submission

4. **Out of Stock Product**
   - [ ] Find product with 0 stock
   - [ ] "Add to Cart" button is disabled
   - [ ] Shows "Out of Stock" message

5. **Image Load Error**
   - [ ] Products with missing images show placeholder

---

## 🎯 Critical Path Test (Must Work)

This is the minimum viable path a customer takes:

1. **Visit Homepage** → ✅
2. **Click "Products" or any product** → ✅
3. **View Product Details** → ✅
4. **Add to Cart** → ✅
5. **View Cart** → ✅
6. **Proceed to Checkout** → ✅
7. **Fill Shipping Info** → ✅
8. **Select Payment Method** → ✅
9. **Place Order** → ✅
10. **See Order Confirmation** → ✅

**If all 10 steps work, your website is functional!** ✅

---

## 🔧 Console Error Check

**Open Browser Console** (F12 or Right-click > Inspect > Console)

### Check for:
- [ ] No red errors on homepage
- [ ] No red errors on product listing
- [ ] No red errors on product detail
- [ ] No red errors on cart
- [ ] No red errors on checkout
- [ ] API calls return 200 status (check Network tab)

### Common Issues to Look For:
- ❌ CORS errors (backend not running)
- ❌ 404 errors (missing images or API endpoints)
- ❌ React warnings (key props, etc.)
- ❌ Network errors (API not responding)

---

## 📊 Test Results Template

Copy this template to record your results:

```
## Test Results - [Date]

### Quick Test Results:
- Homepage: ✅ / ❌
- Product Listing: ✅ / ❌
- Product Detail: ✅ / ❌
- Cart: ✅ / ❌
- Checkout: ✅ / ❌

### Critical Path: ✅ / ❌

### Issues Found:
1. [Issue description]
2. [Issue description]

### Console Errors:
- [Error message if any]

### Browser Tested:
- Chrome: ✅ / ❌
- Firefox: ✅ / ❌
- Safari: ✅ / ❌
- Edge: ✅ / ❌

### Mobile Test: ✅ / ❌

### Overall Status: PASS / FAIL
```

---

## 🚀 Quick Commands

### Start Backend:
```bash
cd Backend
npm run dev
```

### Start Customer Website:
```bash
cd customer-website
npm run dev
```

### Check if servers are running:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## ✅ Success Criteria

Your website is **READY FOR PRODUCTION** if:

1. ✅ All Quick Test items pass
2. ✅ Critical Path works end-to-end
3. ✅ No console errors
4. ✅ Mobile responsive
5. ✅ Cart persists after page refresh
6. ✅ Order can be placed successfully

---

**Happy Testing! 🎉**
