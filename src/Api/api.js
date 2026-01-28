import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Size APIs
export const sizeAPI = {
    getAll: (params) => api.get('/sizes', { params }),
    getById: (id) => api.get(`/sizes/${id}`),
    create: (data) => api.post('/sizes', data),
    update: (id, data) => api.put(`/sizes/${id}`, data),
    delete: (id) => api.delete(`/sizes/${id}`),
    toggleStatus: (id) => api.patch(`/sizes/${id}/toggle-status`),
    bulkCreate: (data) => api.post('/sizes/bulk', data),
};

// Color APIs
export const colorAPI = {
    getAll: (params) => api.get('/colors', { params }),
    getById: (id) => api.get(`/colors/${id}`),
    create: (data) => api.post('/colors', data),
    update: (id, data) => api.put(`/colors/${id}`, data),
    delete: (id) => api.delete(`/colors/${id}`),
    toggleStatus: (id) => api.patch(`/colors/${id}/toggle-status`),
    bulkCreate: (data) => api.post('/colors/bulk', data),
};

// Category APIs
export const categoryAPI = {
    getAll: (params) => api.get('/categories', { params }),
    getTree: () => api.get('/categories/tree'),
    getStats: () => api.get('/categories/stats'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
    toggleStatus: (id) => api.patch(`/categories/${id}/toggle-status`),
    toggleFeatured: (id) => api.patch(`/categories/${id}/toggle-featured`),
};

// Product APIs
export const productAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

// Variant APIs
export const variantAPI = {
    getAll: (params) => api.get('/variants', { params }),
    getById: (id) => api.get(`/variants/${id}`),
    getByProduct: (productId) => api.get(`/variants/product/${productId}`),
    create: (data) => api.post('/variants', data),
    generateVariants: (data) => api.post('/variants/generate', data),
    update: (id, data) => api.put(`/variants/${id}`, data),
    updateStock: (id, data) => api.patch(`/variants/${id}/stock`, data),
    delete: (id) => api.delete(`/variants/${id}`),
    getLowStock: () => api.get('/variants/low-stock'),
};

// Inventory APIs
export const inventoryAPI = {
    getAll: (params) => api.get('/inventory/inventory-master', { params }),
    getById: (id) => api.get(`/inventory/inventory-master/${id}`),
    create: (data) => api.post('/inventory/inventory-master', data),
    update: (id, data) => api.put(`/inventory/inventory-master/${id}`, data),
    adjustStock: (data) => api.patch('/inventory/inventory-master/adjust', data),
    getStats: () => api.get('/inventory/inventory-master/stats'),
    getLowStock: () => api.get('/inventory/inventory-master/low-stock'),
    // Bulk update
    bulkUpdate: (data) => api.patch('/inventory/inventory-master/bulk-update', data),
    getLedger: (productId, params) => api.get(`/inventory/inventory-ledger/${productId}`, { params }),
};

export default api;
