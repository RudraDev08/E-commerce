import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Fix #10 — Added toggleLock
export const sizeAPI = {
    getAll: (params) => api.get(`/sizes`, { params }),
    getById: (id) => api.get(`/sizes/${id}`),
    create: (data) => api.post('/sizes', data),
    update: (id, data) => api.put(`/sizes/${id}`, data),
    delete: (id) => api.delete(`/sizes/${id}`),
    // body must include { targetState } — backend validates via state machine
    toggleStatus: (id, body) => api.patch(`/sizes/${id}/toggle-status`, body),
    toggleLock: (id) => api.patch(`/sizes/${id}/lock`),
    bulkCreate: (data) => api.post('/sizes/bulk', data),
};

// Color APIs
export const colorAPI = {
    getAll: ({ signal, ...params } = {}) => api.get('/colors', { params, signal }),
    getById: (id) => api.get(`/colors/${id}`),
    create: (data) => api.post('/colors', data),
    update: (id, data) => api.put(`/colors/${id}`, data),
    delete: (id, force) => api.delete(`/colors/${id}${force ? '?force=true' : ''}`),
    restore: (id) => api.patch(`/colors/${id}/restore`),
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
    getByProduct: (productId) => api.get(`/variants/product/${productId}?raw=true`),
    create: (data) => api.post('/variants', data),
    generateVariants: (data) => api.post('/variants/generate', data),
    update: (id, data) => api.put(`/variants/${id}`, data),
    updateStock: (id, data) => api.patch(`/variants/${id}/stock`, data),
    delete: (id) => api.delete(`/variants/${id}`),
    getLowStock: () => api.get('/variants/low-stock'),
};

// V2 N-Dimensional Cartesian Engine APIs
export const variantDimensionAPI = {
    /** Dry-run preview — no writes, returns full combination list */
    preview: (data) => api.post('/variants/v2/preview-dimensions', data),
    /** Write path — generates + persists all combinations */
    generate: (data) => api.post('/variants/v2/generate-dimensions', data),
    /** Pure in-process diff between two dimension workspaces */
    diff: (data) => api.post('/variants/v2/diff-dimensions', data),
};

// Inventory APIs
export const inventoryAPI = {
    getAll: (params) => api.get('/inventory', { params }),
    // Note: getById in controller is getInventoryByVariantId
    getById: (variantId) => api.get(`/inventory/${variantId}`),
    // Create is not exposed via REST, handled internally
    // updateStock endpoint: /:variantId/update-stock
    updateStock: (variantId, data) => api.put(`/inventory/${variantId}/update-stock`, data),
    getStats: () => api.get('/inventory/stats'),
    getLowStock: () => api.get('/inventory/low-stock'),
    getOutOfStock: () => api.get('/inventory/out-of-stock'), // Added missing
    bulkUpdate: (data) => api.post('/inventory/bulk-update', data), // Changed PATCH to POST as per route
    getLedger: (variantId, params) => api.get(`/inventory/${variantId}/ledger`, { params }),
};

// Attribute Type APIs
export const attributeTypeAPI = {
    getAll: (params) => api.get('/attribute-types', { params }),
    getById: (id) => api.get(`/attribute-types/${id}`),
    getByCategory: (categoryId) => api.get(`/attribute-types/category/${categoryId}`),
    create: (data) => api.post('/attribute-types', data),
    update: (id, data) => api.put(`/attribute-types/${id}`, data),
    delete: (id) => api.delete(`/attribute-types/${id}`),
};

// Attribute Value APIs
export const attributeValueAPI = {
    getAll: (params) => api.get('/attribute-values', { params }),
    getByType: (typeId) => api.get(`/attribute-values/type/${typeId}`),
    getById: (id) => api.get(`/attribute-values/${id}`),
    create: (data) => api.post('/attribute-values', data),
    update: (id, data) => api.put(`/attribute-values/${id}`, data),
    delete: (id) => api.delete(`/attribute-values/${id}`),
    bulkCreate: (data) => api.post('/attribute-values/bulk', data),
    reorder: (data) => api.put('/attribute-values/reorder', data),
};

// Fix #9 — Global response interceptor: surface 409/403/network errors uniformly
api.interceptors.response.use(
    response => response,
    error => {
        if (!error.response) {
            // Network error or server unreachable
            error.message = 'Network error — please check your connection.';
            return Promise.reject(error);
        }
        const { status, data } = error.response;
        if (status === 409) {
            // Optimistic concurrency conflict or duplicate entry — surface cleanly
            error.message = data?.message || 'Conflict: record was modified. Please refresh.';
        } else if (status === 403) {
            // Locked resource or forbidden operation
            error.message = data?.message || 'Forbidden: you do not have permission to perform this action.';
        } else if (status === 422) {
            error.message = data?.message || 'Validation failed.';
        }
        return Promise.reject(error);
    }
);

export default api;
