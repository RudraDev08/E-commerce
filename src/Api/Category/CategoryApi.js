import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const categoryApi = {
  // Get all categories with filters
  getAll: (params = {}) => {
    return api.get('/categories', { params });
  },

  // Get category tree
  getTree: () => {
    return api.get('/categories/tree');
  },

  // Get active parent categories
  getParents: () => {
    return api.get('/categories/parents');
  },

  // Get single category by ID
  getById: (id) => {
    return api.get(`/categories/${id}`);
  },

  // Create new category
  create: (formData) => {
    return api.post('/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Update category
  update: (id, formData) => {
    return api.put(`/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Delete category
  delete: (id) => {
    return api.delete(`/categories/${id}`);
  }
};

export default categoryApi;