import api from './axios.config';

/**
 * Discovery API Service
 * Handles search and dynamic filtering
 */

// Get dynamic filters based on context
// context: { category, brand, search, ... }
export const getDiscoveryFilters = async (context = {}) => {
    return await api.post('/discovery/filters', context);
};

// Smart search
export const searchDiscovery = async (query) => {
    return await api.get('/discovery/search', { params: { q: query } });
};

export default {
    getDiscoveryFilters,
    searchDiscovery
};
