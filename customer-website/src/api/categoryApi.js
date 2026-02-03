import api from './axios.config';

/**
 * Category API Service
 * Connects to Admin Panel Category APIs
 */

// Get all active categories
export const getCategories = async (params = {}) => {
    const queryParams = {
        status: 'active',
        isDeleted: false,
        ...params
    };
    return await api.get('/categories', { params: queryParams });
};

// Get category tree (hierarchical)
export const getCategoryTree = async () => {
    return await api.get('/categories/tree', {
        params: { status: 'active', isDeleted: false }
    });
};

// Get featured categories
export const getFeaturedCategories = async () => {
    return await api.get('/categories', {
        params: { status: 'active', isFeatured: true, isDeleted: false }
    });
};

// Get category by ID
export const getCategoryById = async (id) => {
    return await api.get(`/categories/${id}`);
};

// Get category by slug
export const getCategoryBySlug = async (slug) => {
    const response = await api.get('/categories', {
        params: { slug, status: 'active', isDeleted: false }
    });
    return response.data?.[0] || null;
};

export default {
    getCategories,
    getCategoryTree,
    getFeaturedCategories,
    getCategoryById,
    getCategoryBySlug
};
