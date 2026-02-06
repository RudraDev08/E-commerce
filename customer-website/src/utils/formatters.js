/**
 * Utility functions for formatting data
 */

// Format currency
// Supports dynamic currency codes from variant data
export const formatCurrency = (amount, currency = 'INR') => {
    // Map of currency codes to locales
    const locales = {
        'INR': 'en-IN',
        'USD': 'en-US',
        'EUR': 'en-DE',
        'GBP': 'en-GB'
    };

    const locale = locales[currency] || 'en-US';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};

// Format date
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
};

// Format date with time
export const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

// Get image URL
export const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder.jpg';

    // Handle object input (e.g. { url: '...' })
    if (typeof imagePath === 'object' && imagePath.url) {
        imagePath = imagePath.url;
    }

    if (typeof imagePath !== 'string') return '/placeholder.jpg';
    if (imagePath.startsWith('http')) return imagePath;

    // Normalize path separators (win to unix)
    const normalizedPath = imagePath.replace(/\\/g, '/');

    // Remove 'uploads' prefix (optional leading slash, followed by 'uploads/')
    // This prevents http://.../uploads/uploads/filename
    const cleanPath = normalizedPath.replace(/^(\/)?uploads\//, '');

    const uploadsUrl = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:5000/uploads';

    // Ensure clean join
    const baseUrl = uploadsUrl.endsWith('/') ? uploadsUrl.slice(0, -1) : uploadsUrl;

    // cleanPath should not start with slash for joining
    const finalPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;

    return `${baseUrl}/${finalPath}`;
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Generate slug from text
export const generateSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Calculate discount percentage
export const calculateDiscount = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Check if product is in stock
export const isInStock = (stock) => {
    return stock > 0;
};

// Get stock status
export const getStockStatus = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock < 5) return 'Low Stock';
    return 'In Stock';
};

// Get stock badge color
export const getStockBadgeColor = (stock) => {
    if (stock === 0) return 'red';
    if (stock < 5) return 'orange';
    return 'green';
};

export default {
    formatCurrency,
    formatDate,
    formatDateTime,
    getImageUrl,
    truncateText,
    generateSlug,
    calculateDiscount,
    isInStock,
    getStockStatus,
    getStockBadgeColor
};
