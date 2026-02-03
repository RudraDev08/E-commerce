import api from './axios.config';

/**
 * Variant API Service
 * Connects to Admin Panel Variant APIs
 */

// Get all variants
export const getVariants = async (params = {}) => {
    return await api.get('/variants', { params });
};

// Get variants by product ID
export const getVariantsByProduct = async (productId) => {
    return await api.get(`/variants/product/${productId}`);
};

// Get variant by ID
export const getVariantById = async (id) => {
    return await api.get(`/variants/${id}`);
};

// Get sizes
export const getSizes = async () => {
    return await api.get('/sizes', {
        params: { status: 'active', isDeleted: false }
    });
};

// Get colors
export const getColors = async () => {
    return await api.get('/colors', {
        params: { status: 'active', isDeleted: false }
    });
};

export default {
    getVariants,
    getVariantsByProduct,
    getVariantById,
    getSizes,
    getColors
};
