import axios from 'axios';

const API_URL = 'http://localhost:5000/api/products';

const productApi = {
  getAll: (params) => axios.get(API_URL, { params }),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  getStats: () => axios.get(`${API_URL}/stats`),

  // New: Helper to get categories/brands for potential use
  // Although we will use specific APIs for those in the UI

  create: (formData) => axios.post(API_URL, formData),

  update: (id, formData) => axios.put(`${API_URL}/${id}`, formData),

  delete: (id) => axios.delete(`${API_URL}/${id}`),
  restore: (id) => axios.patch(`${API_URL}/${id}/restore`),

  bulkDelete: (ids) => axios.post(`${API_URL}/bulk-delete`, { ids }),
};

export default productApi;
