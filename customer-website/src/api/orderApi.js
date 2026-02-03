import api from './axios.config';

/**
 * Order API Service
 * Connects to Backend Order APIs
 */

// Create new order
export const createOrder = async (orderData) => {
    return await api.post('/orders', orderData);
};

// Get my orders
export const getMyOrders = async () => {
    return await api.get('/orders/my-orders');
};

// Get order by ID
export const getOrderById = async (orderId) => {
    return await api.get(`/orders/${orderId}`);
};

export default {
    createOrder,
    getMyOrders,
    getOrderById
};
