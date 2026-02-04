# 🧪 Complete PDP Testing Guide

## ✅ Your PDP is Ready to Test!

**Product Found:** S23 (Samsung)  
**Slug:** `s23`  
**Price:** ₹74,999  
**Has Variants:** Yes

---

## 🚀 Manual Testing Steps

### Step 1: Open the Product Detail Page

**URL to Test:**
```
http://localhost:5173/product/s23
```

**What You Should See:**
- ✅ Clean white background
- ✅ Product title: "S23"
- ✅ Brand: "Samsung"
- ✅ Price: ₹74,999
- ✅ Product images on the left
- ✅ Product info on the right
- ❌ NO demo banner
- ❌ NO "DEMO MODE" text

---

### Step 2: Check Variant Selectors

**Look for these sections:**

#### Storage Selector
```
Storage: [Select]
[128GB] [256GB] [512GB] [1TB]
```
- Each option should be a button
- Selected option has blue border
- Unavailable options are grayed out

#### Color Selector
```
Color: [Select]
⚫ 🟣 🟢 🔵
```
- Circular color swatches
- Shows actual hex colors
- Selected swatch has border
- Hover shows color name

#### RAM Selector (if available)
```
RAM: [Select]
[8GB] [12GB] [16GB]
```

---

### Step 3: Test Variant Selection

#### Test 1: Select Storage
1. Click on "256GB" button
2. **Expected:** 
   - Button gets blue border
   - Price updates (if different)
   - Images update (if different)

#### Test 2: Select Color
1. Click on a color swatch
2. **Expected:**
   - Swatch gets border
   - Images change to show that color
   - Price updates (if different)
   - Color name updates in label

#### Test 3: Select RAM
1. Click on a RAM option
2. **Expected:**
   - Button gets blue border
   - Price updates (if different)

---

### Step 4: Check Price Display

**Price Section Should Show:**
```
₹79,999
₹95,999 (-17%)
Inclusive of all taxes
```

**Verify:**
- ✅ Price uses ₹ symbol (or $, €, £ based on currency)
- ✅ Strikethrough price if discount exists
- ✅ Discount percentage in red
- ✅ "Inclusive of all taxes" text below

---

### Step 5: Check Stock Status

**Stock Display Should Show:**

**If In Stock:**
```
✅ In Stock
FREE delivery. Order within 12 hrs 30 mins.
```

**If Low Stock:**
```
⚠️ Only 5 left in stock
FREE delivery. Order within 12 hrs 30 mins.
```

**If Out of Stock:**
```
❌ Out of Stock
```

---

### Step 6: Test Add to Cart

#### Test 1: Add to Cart
1. Select a variant (storage + color + RAM)
2. Select quantity (dropdown)
3. Click "Add to Cart" button
4. **Expected:**
   - Cart icon (top right) updates count
   - Success message or animation
   - Cart contains correct variant

#### Test 2: Buy Now
1. Select a variant
2. Click "Buy Now" button
3. **Expected:**
   - Redirects to cart page
   - Cart contains the product
   - Correct variant details shown

---

### Step 7: Check Image Gallery

**Image Gallery Should Have:**
- Main image (large, center)
- Thumbnail strip (vertical, left side)
- 3-5 thumbnails per variant

**Test Image Changes:**
1. Click on a thumbnail
2. **Expected:** Main image changes
3. Click on different color swatch
4. **Expected:** All images change to that color

---

### Step 8: Check Tabs

**Tabs Should Show:**
```
[Description] [Specifications]
```

#### Description Tab
- Product description text
- Features list
- Benefits

#### Specifications Tab
- Brand: Samsung
- SKU: PROD-2026-XXXX
- Storage: 256GB
- Color: Phantom Black
- RAM: 12GB

---

### Step 9: Check Responsive Design

#### Desktop View (> 768px)
- Two-column layout
- Image gallery on left (45%)
- Product info on right (55%)
- Vertical thumbnail strip

#### Mobile View (< 768px)
- Single column layout
- Image carousel at top
- Product info below
- Sticky "Add to Cart" button at bottom

**Test:** Resize browser window to check responsiveness

---

### Step 10: Check Error Handling

#### Test 1: Invalid Product
```
http://localhost:5173/product/invalid-slug-12345
```
**Expected:**
- "Product not found" message
- "Continue Shopping" link
- NO demo data shown

#### Test 2: Product with No Variants
**Expected:**
- Product details visible
- "No variants available" message
- Add to Cart disabled

---

## ✅ Success Criteria Checklist

### UI/UX
- [ ] Clean white background
- [ ] NO demo banner visible
- [ ] Professional typography
- [ ] Proper spacing and alignment
- [ ] Responsive on mobile
- [ ] Smooth transitions

### Functionality
- [ ] Product loads from API
- [ ] Variants display correctly
- [ ] Color swatches show hex colors
- [ ] Storage/RAM buttons work
- [ ] Price updates on variant change
- [ ] Images change on color change
- [ ] Add to Cart works
- [ ] Cart receives correct variant
- [ ] Stock status accurate

### Data
- [ ] Product name correct
- [ ] Brand displays
- [ ] Price formatted correctly
- [ ] Currency symbol correct
- [ ] Variant attributes visible
- [ ] Images load properly
- [ ] SKU displays in specs

---

## 🐛 Common Issues & Solutions

### Issue 1: Images Not Loading
**Symptom:** Broken image icons  
**Solution:** Check `VITE_UPLOADS_URL` in `.env`
```env
VITE_UPLOADS_URL=http://localhost:5000/uploads
```

### Issue 2: Price Shows as 0
**Symptom:** ₹0 or $0  
**Solution:** Variant missing `sellingPrice` or `price` field

### Issue 3: No Variants Showing
**Symptom:** No storage/color options  
**Solution:** Check variants exist and have `status: true`

### Issue 4: Color Swatches Gray
**Symptom:** All swatches show #cccccc  
**Solution:** Color Master missing or colors not found

### Issue 5: Add to Cart Fails
**Symptom:** Alert "Please select all options"  
**Solution:** Select all required variant attributes first

---

## 📸 Expected Screenshots

### Screenshot 1: Full PDP (Desktop)
**Should Show:**
- Product images on left
- Product title, brand, price on right
- Variant selectors
- Add to Cart button
- Clean, professional layout

### Screenshot 2: Variant Selectors
**Should Show:**
- Storage buttons (128GB, 256GB, etc.)
- Color swatches with actual colors
- RAM options
- Selected state with blue border

### Screenshot 3: After Variant Selection
**Should Show:**
- Updated price
- Updated images
- Selected variant highlighted
- Stock status

### Screenshot 4: Mobile View
**Should Show:**
- Single column layout
- Image carousel
- Variant selectors stacked
- Sticky Add to Cart button

---

## 🎯 Testing Scenarios

### Scenario 1: Happy Path
1. Open PDP
2. Select storage: 256GB
3. Select color: Phantom Black
4. Select RAM: 12GB
5. Click Add to Cart
6. **Result:** ✅ Product added to cart

### Scenario 2: Out of Stock
1. Open PDP
2. Select out-of-stock variant
3. **Result:** ✅ "Out of Stock" shown, Add to Cart disabled

### Scenario 3: Price Change
1. Open PDP (shows ₹74,999)
2. Select 512GB storage
3. **Result:** ✅ Price updates to ₹89,999

### Scenario 4: Color Change
1. Open PDP (shows black phone)
2. Click violet color swatch
3. **Result:** ✅ Images change to violet phone

---

## 📊 Performance Checklist

- [ ] Page loads in < 2 seconds
- [ ] Variant selection responds in < 200ms
- [ ] Images load in < 1 second
- [ ] Add to Cart responds in < 100ms
- [ ] No console errors
- [ ] No console warnings

---

## 🔍 Browser Console Checks

**Open Developer Tools (F12) and check:**

### Console Tab
- [ ] No red errors
- [ ] No yellow warnings
- [ ] API calls successful (200 status)

### Network Tab
- [ ] Product API: `GET /api/products/slug/s23` → 200
- [ ] Variants API: `GET /api/variants?productId=...` → 200
- [ ] Colors API: `GET /api/colors` → 200
- [ ] Images loading: `GET /uploads/...` → 200

### React DevTools (if installed)
- [ ] ProductDetailPage component renders
- [ ] State updates on variant selection
- [ ] Props passed correctly

---

## ✅ Final Verification

After testing all scenarios, verify:

1. **UI is Clean** ✅
   - No demo banners
   - Professional design
   - Responsive layout

2. **Data is Real** ✅
   - Product from API
   - Variants from API
   - Colors from Color Master

3. **Functionality Works** ✅
   - Variant selection
   - Price updates
   - Image changes
   - Add to Cart

4. **No Errors** ✅
   - Console clean
   - API calls successful
   - Images load

---

## 🎉 Success!

If all checks pass, your PDP is:
- ✅ Production-ready
- ✅ Clean and professional
- ✅ Fully functional
- ✅ Using real data

**Ready for deployment!** 🚀

---

## 📞 Quick Links

**Test URLs:**
- Homepage: http://localhost:5173
- Product: http://localhost:5173/product/s23
- Products: http://localhost:5173/products
- Cart: http://localhost:5173/cart

**API Endpoints:**
- Products: http://localhost:5000/api/products
- Variants: http://localhost:5000/api/variants
- Colors: http://localhost:5000/api/colors

---

**Happy Testing!** 🎉

**Status:** ✅ Ready to Test  
**Date:** 2026-02-04  
**Version:** 4.0 (Clean UI + Real Data)
