/**
 * Application Constants
 */

// API Endpoints
export const API_ENDPOINTS = {
    CATEGORIES: '/categories',
    BRANDS: '/brands',
    PRODUCTS: '/products',
    VARIANTS: '/variants',
    SIZES: '/sizes',
    COLORS: '/colors'
};

// Local Storage Keys
export const STORAGE_KEYS = {
    CART: 'shophub_cart',
    AUTH_TOKEN: 'shophub_auth_token',
    USER: 'shophub_user',

};

// Product Status
export const PRODUCT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DRAFT: 'draft',
    ARCHIVED: 'archived'
};

// Stock Status
export const STOCK_STATUS = {
    IN_STOCK: 'in_stock',
    OUT_OF_STOCK: 'out_of_stock',
    PRE_ORDER: 'pre_order'
};

// Sort Options
export const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' }
];

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    PRODUCTS_PER_PAGE: 12
};

// Price Ranges for Filters
export const PRICE_RANGES = [
    { label: 'Under ₹500', min: 0, max: 500 },
    { label: '₹500 - ₹1,000', min: 500, max: 1000 },
    { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
    { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
    { label: 'Above ₹5,000', min: 5000, max: Infinity }
];

// Navigation Links
export const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Categories', path: '/categories' },
    { label: 'Brands', path: '/brands' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
];

// Footer Links
export const FOOTER_LINKS = {
    company: [
        { label: 'About Us', path: '/about' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Careers', path: '/careers' }
    ],
    help: [
        { label: 'FAQs', path: '/faqs' },
        { label: 'Shipping', path: '/shipping' },
        { label: 'Returns', path: '/returns' }
    ],
    legal: [
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms & Conditions', path: '/terms' },
        { label: 'Cookie Policy', path: '/cookies' }
    ]
};

// Social Media Links
export const SOCIAL_LINKS = [
    { name: 'Facebook', url: 'https://facebook.com', icon: 'facebook' },
    { name: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
    { name: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin' }
];

export default {
    API_ENDPOINTS,
    STORAGE_KEYS,
    PRODUCT_STATUS,
    STOCK_STATUS,
    SORT_OPTIONS,
    PAGINATION,
    PRICE_RANGES,
    NAV_LINKS,
    FOOTER_LINKS,
    SOCIAL_LINKS
};
