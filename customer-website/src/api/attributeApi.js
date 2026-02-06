import api from './axios.config';

/**
 * Attribute API Service
 * Connects to Admin Panel Attribute APIs
 */

// Get all attribute types
export const getAttributeTypes = async (params = {}) => {
    return await api.get('/attribute-types', { params });
};

// Get attribute type by ID
export const getAttributeTypeById = async (id) => {
    return await api.get(`/attribute-types/${id}`);
};

// Get attribute types by Category
export const getAttributeTypesByCategory = async (categoryId) => {
    return await api.get(`/attribute-types/category/${categoryId}`);
};

export default {
    getAttributeTypes,
    getAttributeTypeById,
    getAttributeTypesByCategory
};
