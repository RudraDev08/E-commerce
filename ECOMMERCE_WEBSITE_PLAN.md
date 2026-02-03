# 🛍️ E-commerce Customer Website - Implementation Plan

## 📋 Project Overview

**Objective**: Build a production-ready, customer-facing E-commerce website that fully integrates with the existing Admin Panel APIs.

**Tech Stack**:
- React 18 (Vite)
- React Router v6
- Axios for API calls
- Context API (Cart & Auth)
- Custom CSS (Modern, Premium Design)

---

## 🎯 Core Principles

### ✅ MUST FOLLOW
1. **Use ONLY existing Admin Panel APIs** - No new backend controllers
2. **Admin Panel is the single source of truth**
3. **Show ONLY active categories, brands, and products**
4. **Respect admin-controlled price, stock, visibility**
5. **Variant-based pricing & inventory**
6. **Handle out-of-stock products correctly**
7. **Use SEO data from backend automatically**
8. **Slug-based URLs**

### ❌ STRICT RULES
- ❌ Do NOT create new backend controllers
- ❌ Do NOT modify existing APIs
- ❌ Do NOT duplicate business logic

---

## 🗂️ Folder Structure

```
customer-website/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── axios.config.js
│   │   ├── categoryApi.js
│   │   ├── brandApi.js
│   │   ├── productApi.js
│   │   ├── variantApi.js
│   │   └── cartApi.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── Breadcrumb.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── product/
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── ProductFilter.jsx
│   │   │   ├── ProductSort.jsx
│   │   │   ├── VariantSelector.jsx
│   │   │   └── StockBadge.jsx
│   │   ├── cart/
│   │   │   ├── CartItem.jsx
│   │   │   ├── CartSummary.jsx
│   │   │   └── CartDrawer.jsx
│   │   └── home/
│   │       ├── HeroSection.jsx
│   │       ├── FeaturedCategories.jsx
│   │       ├── FeaturedProducts.jsx
│   │       └── BrandShowcase.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── CategoryPage.jsx
│   │   ├── ProductListingPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── BrandPage.jsx
│   │   ├── SearchPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderSummaryPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── OrderHistoryPage.jsx
│   │   ├── AboutPage.jsx
│   │   ├── ContactPage.jsx
│   │   ├── PrivacyPage.jsx
│   │   ├── TermsPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── context/
│   │   ├── CartContext.jsx
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   ├── hooks/
│   │   ├── useCart.js
│   │   ├── useAuth.js
│   │   ├── useProducts.js
│   │   └── useDebounce.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── variables.css
│   │   ├── components.css
│   │   └── pages.css
│   ├── App.jsx
│   └── main.jsx
├── .env
├── package.json
└── vite.config.js
```

---

## 🔌 API Integration Strategy

### Available Backend APIs

#### 1. **Categories API** (`/api/categories`)
- `GET /api/categories` - Get all categories (filter by status=active)
- `GET /api/categories/tree` - Get hierarchical category tree
- `GET /api/categories/:id` - Get single category

#### 2. **Brands API** (`/api/brands`)
- `GET /api/brands` - Get all brands (filter by status=active)
- `GET /api/brands/:id` - Get single brand

#### 3. **Products API** (`/api/products`)
- `GET /api/products` - Get all products (filter by status=active)
- `GET /api/products/:id` - Get single product
- Query params: `category`, `brand`, `search`, `sort`, `page`, `limit`

#### 4. **Variants API** (`/api/variants`)
- `GET /api/variants` - Get all variants
- `GET /api/variants/product/:productId` - Get variants by product

#### 5. **Sizes & Colors**
- `GET /api/sizes` - Get all sizes
- `GET /api/colors` - Get all colors

---

## 🎨 UI/UX Design Principles

### Design System
- **Color Palette**: Modern, vibrant colors (not generic red/blue/green)
- **Typography**: Google Fonts (Inter, Roboto, or Outfit)
- **Spacing**: Consistent 8px grid system
- **Animations**: Smooth transitions, micro-interactions
- **Responsive**: Mobile-first approach

### Key Features
1. **Premium Look**: Glassmorphism, gradients, shadows
2. **Fast Loading**: Lazy loading, image optimization
3. **Interactive**: Hover effects, smooth animations
4. **Accessible**: ARIA labels, keyboard navigation
5. **SEO-Ready**: Meta tags, semantic HTML

---

## 📄 Page Specifications

### 1. **Home Page**
- Hero section with CTA
- Featured categories (from admin: `isFeatured=true`)
- Featured products (from admin: `status=active`)
- Brand showcase
- Newsletter signup

### 2. **Category Listing Page** (`/category/:slug`)
- Display category hierarchy
- Show subcategories
- Filter by subcategory
- Product count

### 3. **Product Listing Page** (`/products`)
- Advanced filters (category, brand, price range)
- Sorting (price, name, newest)
- Pagination
- Grid/List view toggle

### 4. **Product Detail Page** (`/product/:slug`)
- Product images gallery
- Variant selector (size, color)
- Real-time price & stock from variant
- Add to cart
- Product specifications
- Related products

### 5. **Brand Page** (`/brand/:slug`)
- Brand info
- All products by brand
- Filters & sorting

### 6. **Search Page** (`/search?q=...`)
- Search results
- Filters
- Sorting

### 7. **Cart Page** (`/cart`)
- Cart items list
- Quantity update
- Remove items
- Cart summary (subtotal, tax, total)
- Proceed to checkout

### 8. **Checkout Page** (`/checkout`)
- Shipping address form
- Payment method selection
- Order review
- Place order

---

## 🛒 Cart Logic

### Cart Structure
```javascript
{
  items: [
    {
      productId: "...",
      variantId: "...",
      name: "Product Name",
      variant: { size: "M", color: "Black" },
      price: 1999,
      quantity: 2,
      image: "...",
      sku: "..."
    }
  ],
  subtotal: 3998,
  tax: 399.8,
  total: 4397.8
}
```

### Cart Operations
1. **Add to Cart**: Check stock, add variant
2. **Update Quantity**: Validate against stock
3. **Remove Item**: Remove from cart
4. **Clear Cart**: Empty cart
5. **Persist**: LocalStorage

---

## 🔐 Authentication Flow

### User States
- Guest (can browse, add to cart)
- Logged In (can checkout, view orders)

### Auth Pages
1. **Login**: Email/Password
2. **Register**: Full registration form
3. **Profile**: View/Edit profile
4. **Order History**: Past orders

---

## 🚀 Implementation Phases

### Phase 1: Setup & Core Infrastructure ✅
- Initialize Vite React app
- Setup folder structure
- Configure Axios
- Create Context providers
- Setup routing

### Phase 2: API Integration ✅
- Create API service files
- Test all endpoints
- Handle errors

### Phase 3: Common Components ✅
- Header, Footer, Navbar
- Loader, Error boundaries
- Breadcrumb

### Phase 4: Home Page ✅
- Hero section
- Featured categories
- Featured products

### Phase 5: Product Pages ✅
- Product listing
- Product detail
- Variant handling

### Phase 6: Cart & Checkout ✅
- Cart functionality
- Checkout flow

### Phase 7: User Pages ✅
- Auth pages
- Profile
- Order history

### Phase 8: Utility Pages ✅
- About, Contact
- Privacy, Terms
- 404 page

### Phase 9: Polish & Optimization ✅
- Performance optimization
- SEO implementation
- Testing

---

## 📊 Business Logic Implementation

### 1. **Product Visibility**
```javascript
// Only show products where:
- status === 'active'
- isDeleted === false
- category.status === 'active'
- brand.status === 'active'
```

### 2. **Variant Pricing**
```javascript
// If product has variants:
- Display variant-specific price
- Display variant-specific stock
- Disable "Add to Cart" if variant out of stock
```

### 3. **Stock Management**
```javascript
// Check stock before adding to cart:
if (variant.stock < requestedQuantity) {
  showError("Insufficient stock");
  return;
}
```

### 4. **SEO Implementation**
```javascript
// Use backend SEO data:
<Helmet>
  <title>{product.metaTitle || product.name}</title>
  <meta name="description" content={product.metaDescription} />
  <meta name="keywords" content={product.metaKeywords} />
</Helmet>
```

---

## 🎯 Success Criteria

✅ All pages functional and responsive
✅ Full API integration (no mock data)
✅ Cart persists across sessions
✅ Variant selection works correctly
✅ Stock validation implemented
✅ SEO-friendly URLs and meta tags
✅ Premium, modern UI
✅ Fast loading times
✅ Error handling
✅ Production-ready code

---

## 📝 Next Steps

1. Create separate customer website directory
2. Initialize Vite React project
3. Implement folder structure
4. Build API integration layer
5. Create Context providers
6. Build components page by page
7. Test thoroughly
8. Deploy

---

**Status**: Ready for Implementation 🚀
