import api from './axios.config';

/**
 * Inventory API Service
 */

// Get inventory by product ID (Returns array of inventory records for all variants)
export const getInventoryByProductId = async (productId) => {
    try {
        const response = await api.get(`/inventory/product/${productId}`);
        return response;
    } catch (error) {
        console.error('Error fetching product inventory:', error);
        // Return empty structure on error to prevent UI crash
        return { data: { success: false, data: [] } };
    }
};

// Get inventory by variant ID - Note: This route might need verification on backend
export const getInventoryByVariantId = async (variantId) => {
    try {
        const response = await api.get(`/inventory/${variantId}`);
        return response;
    } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
    }
};

export default {
    getInventoryByVariantId,
    getInventoryByProductId
};
