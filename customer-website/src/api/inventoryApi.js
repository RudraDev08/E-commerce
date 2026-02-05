import api from './axios.config';

/**
 * Inventory API Service
 */

// Get inventory by variant ID
export const getInventoryByVariantId = async (variantId) => {
    try {
        const response = await api.get(`/inventory/${variantId}`);
        return response; // response is already the backend's { success: true, data: ... }
    } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
    }
};

export default {
    getInventoryByVariantId
};
