import api from './axios.config';

/**
 * Brand API Service
 * Connects to Admin Panel Brand APIs
 */

// Get all active brands
export const getBrands = async (params = {}) => {
    const queryParams = {
        status: 'active',
        isDeleted: false,
        ...params
    };
    return await api.get('/brands', { params: queryParams });
};

// Get featured brands
export const getFeaturedBrands = async () => {
    return await api.get('/brands', {
        params: { status: 'active', isFeatured: true, isDeleted: false }
    });
};

// Get brand by ID
export const getBrandById = async (id) => {
    return await api.get(`/brands/${id}`);
};

// Get brand by slug
export const getBrandBySlug = async (slug) => {
    const response = await api.get('/brands', {
        params: { slug, status: 'active', isDeleted: false }
    });
    return response.data?.[0] || null;
};

export default {
    getBrands,
    getFeaturedBrands,
    getBrandById,
    getBrandBySlug
};
