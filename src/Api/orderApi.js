import api from './api.js';

// ── Admin Order API ────────────────────────────────────────────────────────
// All calls go through the shared axios instance (with interceptors).
// Backend endpoints: /api/orders/*

export const orderAPI = {
    // List all orders (admin view)
    getAll: (params) => api.get('/orders', { params }),

    // Single order detail
    getById: (orderId) => api.get(`/orders/${orderId}`),

    // Update order status — backend enforces state machine
    updateStatus: (orderId, status, note = '') =>
        api.put(`/orders/${orderId}/status`, { status, note }),

    // Partial fulfillment
    fulfillItems: (orderId, items) =>
        api.post(`/orders/${orderId}/fulfill`, { items }),

    // Cancel order
    cancel: (orderId, reason) =>
        api.post(`/orders/${orderId}/cancel`, { reason }),

    // Refund line item
    refundItem: (orderId, lineItemId, qty) =>
        api.post(`/orders/${orderId}/refund`, { lineItemId, quantity: qty }),
};

export default orderAPI;
