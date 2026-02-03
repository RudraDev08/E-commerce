# 🛍️ ShopHub - Customer E-commerce Website

A production-ready, customer-facing e-commerce website built with React that fully integrates with the existing Admin Panel backend.

## 🎯 Project Overview

This is a **customer-facing e-commerce website** that consumes APIs from the existing Admin Panel. It provides a complete shopping experience including product browsing, cart management, checkout, and user authentication.

### ✅ Key Features

- **Full API Integration**: Uses existing Admin Panel APIs (no new backend needed)
- **Product Catalog**: Browse products by category, brand, or search
- **Variant Support**: Handle size, color, and other product variants
- **Shopping Cart**: Add, update, remove items with persistence
- **User Authentication**: Login, register, profile management
- **Checkout Flow**: Complete order placement with shipping details
- **Responsive Design**: Mobile-first, works on all devices
- **Premium UI**: Modern, vibrant design with smooth animations
- **SEO-Friendly**: Slug-based URLs, meta tags

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router v6** - Routing
- **Axios** - API calls
- **Context API** - State management (Cart & Auth)
- **Custom CSS** - Premium styling

## 📁 Project Structure

```
customer-website/
├── src/
│   ├── api/              # API service layer
│   │   ├── axios.config.js
│   │   ├── categoryApi.js
│   │   ├── brandApi.js
│   │   ├── productApi.js
│   │   └── variantApi.js
│   ├── components/       # Reusable components
│   │   ├── common/       # Header, Footer, Navbar
│   │   └── product/      # ProductCard, etc.
│   ├── context/          # Context providers
│   │   ├── CartContext.jsx
│   │   └── AuthContext.jsx
│   ├── pages/            # Page components
│   │   ├── Home.jsx
│   │   ├── ProductListingPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   ├── formatters.js
│   │   └── constants.js
│   ├── styles/           # CSS files
│   │   └── index.css
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── .env                  # Environment variables
├── package.json
└── vite.config.js
```

## 🔧 Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd customer-website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   The `.env` file is already created with default values:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_UPLOADS_URL=http://localhost:5000/uploads
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

## 🌐 API Integration

This website connects to the following Admin Panel APIs:

### Categories
- `GET /api/categories` - Get all active categories
- `GET /api/categories/tree` - Get category hierarchy
- `GET /api/categories/:id` - Get single category

### Brands
- `GET /api/brands` - Get all active brands
- `GET /api/brands/:id` - Get single brand

### Products
- `GET /api/products` - Get all active products
- `GET /api/products/:id` - Get single product
- Query params: `category`, `brand`, `search`, `sort`, `page`, `limit`

### Variants
- `GET /api/variants/product/:productId` - Get variants by product
- `GET /api/sizes` - Get all sizes
- `GET /api/colors` - Get all colors

## 🎨 Design Features

- **Modern UI**: Vibrant purple/blue gradient theme
- **Smooth Animations**: Hover effects, transitions
- **Responsive**: Works on mobile, tablet, desktop
- **Premium Components**: Cards, buttons, forms
- **Loading States**: Skeletons, spinners
- **Error Handling**: User-friendly error messages

## 🛒 Cart Management

The cart system includes:

- **Add to Cart**: With stock validation
- **Update Quantity**: Increase/decrease items
- **Remove Items**: Delete from cart
- **Persistence**: Saved in localStorage
- **Real-time Totals**: Subtotal, tax, total
- **Variant Support**: Handle size/color variants

## 🔐 Authentication

Currently uses mock authentication (ready for backend integration):

- **Login**: Email/password
- **Register**: Full registration form
- **Profile**: View/edit user details
- **Logout**: Clear session

## 📄 Available Pages

### Public Pages
- **Home** (`/`) - Hero, featured categories, products
- **Products** (`/products`) - All products with filters
- **Product Detail** (`/product/:slug`) - Single product with variants
- **Category** (`/category/:slug`) - Products by category
- **Brand** (`/brand/:slug`) - Products by brand
- **Search** (`/search?q=...`) - Search results

### Commerce Pages
- **Cart** (`/cart`) - Shopping cart
- **Checkout** (`/checkout`) - Order placement

### User Pages
- **Login** (`/login`) - User login
- **Register** (`/register`) - User registration
- **Profile** (`/profile`) - User profile
- **Orders** (`/orders`) - Order history

### Utility Pages
- **About** (`/about`) - About us
- **Contact** (`/contact`) - Contact information
- **Privacy** (`/privacy`) - Privacy policy
- **Terms** (`/terms`) - Terms & conditions
- **404** - Page not found

## 🚀 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## 📊 Business Logic

### Product Visibility
- Only shows products with `status: 'active'`
- Respects `isDeleted: false`
- Checks category and brand status

### Stock Management
- Validates stock before adding to cart
- Shows "Out of Stock" badge
- Displays low stock warnings

### Variant Handling
- Supports size, color, and custom variants
- Variant-specific pricing
- Variant-specific stock levels

### SEO
- Slug-based URLs
- Meta tags from backend
- Semantic HTML

## 🔄 Future Enhancements

- [ ] Wishlist functionality
- [ ] Product reviews & ratings
- [ ] Advanced filtering
- [ ] Order tracking
- [ ] Payment gateway integration
- [ ] Social login
- [ ] Product recommendations

## 📝 Notes

- **No Backend Changes**: Uses existing Admin Panel APIs only
- **Mock Auth**: Authentication is currently mocked (ready for backend)
- **Cart Persistence**: Cart data saved in localStorage
- **Responsive**: Mobile-first design approach

## 🤝 Contributing

This is a production-ready e-commerce frontend. To contribute:

1. Follow the existing code structure
2. Use the established design system
3. Ensure all API calls use existing endpoints
4. Test on multiple devices

## 📞 Support

For issues or questions, contact the development team.

---

**Built with ❤️ using React + Vite**
