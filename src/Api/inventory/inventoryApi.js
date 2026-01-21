import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/inventory';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const inventoryApi = {
  // Inventory Master APIs
  createInventory: (data) => api.post('/inventory-master', data),
  
  getAllInventories: (params = {}) => api.get('/inventory-master', { params }),
  
  getInventoryByProductId: (productId) => api.get(`/inventory-master/${productId}`),
  
  updateInventory: (id, data) => api.put(`/inventory-master/${id}`, data),
  
  adjustStock: (data) => api.patch('/inventory-master/adjust', data),
  
  getLowStockItems: () => api.get('/inventory-master/low-stock'),
  
  getReorderSuggestions: () => api.get('/inventory-master/reorder-suggestions'),
  
  getInventoryStats: () => api.get('/inventory-master/stats'),
  
  reserveStock: (data) => api.post('/inventory-master/reserve', data),
  
  releaseReservedStock: (data) => api.post('/inventory-master/release-reserve', data),
  
  // Inventory Ledger APIs
  getInventoryLedger: (productId, params = {}) => 
    api.get(`/inventory-ledger/${productId}`, { params }),
};

export default inventoryApi;