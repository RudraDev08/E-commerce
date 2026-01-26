import axios from "axios";

const API_URL = "http://localhost:5000/api/categories";

const categoryApi = {
  // Get all categories with filters
  getAll: (params = {}) => axios.get(API_URL, { params }),

  // Get category tree (hierarchical)
  getTree: () => axios.get(`${API_URL}/tree`),

  // Get single category by ID
  getById: (id) => axios.get(`${API_URL}/${id}`),

  // Get category stats
  getStats: () => axios.get(`${API_URL}/stats`),

  // Create new category (with file upload)
  createCategory: (formData) =>
    axios.post(API_URL, formData),

  // Update category (with file upload)
  updateCategory: (id, formData) =>
    axios.put(`${API_URL}/${id}`, formData),

  // Toggle category status
  toggleStatus: (id) => axios.patch(`${API_URL}/${id}/toggle-status`),

  // Toggle featured status
  toggleFeatured: (id) => axios.patch(`${API_URL}/${id}/toggle-featured`),

  // Delete category (soft delete)
  deleteCategory: (id) => axios.delete(`${API_URL}/${id}`)
};

export default categoryApi;
