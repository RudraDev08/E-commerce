import api from './axios.config';

/**
 * Product API Service
 * Connects to Admin Panel Product APIs
 */

// Get all active products
export const getProducts = async (params = {}) => {
    const queryParams = {
        status: 'active',
        isDeleted: false,
        configured: true,
        ...params
    };
    return await api.get('/products', { params: queryParams });
};

// Get product by ID
export const getProductById = async (id) => {
    return await api.get(`/products/${id}`);
};

// Get product by slug
export const getProductBySlug = async (slug) => {
    const response = await api.get(`/products/slug/${slug}`);
    // Axios interceptor already extracts response.data
    // Backend returns: { success: true, data: productObject }
    // After interceptor: { success: true, data: productObject }
    // So we need response.data (not response.data.data)
    return response.data || response || null;
};

// Get products by category
export const getProductsByCategory = async (categoryId, params = {}) => {
    return await api.get('/products', {
        params: { category: categoryId, status: 'active', isDeleted: false, ...params }
    });
};

// Get products by brand
export const getProductsByBrand = async (brandId, params = {}) => {
    return await api.get('/products', {
        params: { brand: brandId, status: 'active', isDeleted: false, ...params }
    });
};

// Search products
export const searchProducts = async (query, params = {}) => {
    return await api.get('/products', {
        params: { search: query, status: 'active', isDeleted: false, ...params }
    });
};

// Get featured products
export const getFeaturedProducts = async (limit = 8) => {
    return await api.get('/products/featured', {
        params: { limit }
    });
};

export default {
    getProducts,
    getProductById,
    getProductBySlug,
    getProductsByCategory,
    getProductsByBrand,
    searchProducts,
    getFeaturedProducts
};
