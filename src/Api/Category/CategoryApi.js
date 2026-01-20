import axios from "axios";

const API_URL = "http://localhost:5000/api/categories";

const categoryApi = {
  // 🌳 Tree
  getTree: () => axios.get(`${API_URL}/tree`),

  // 📄 List with pagination/search
  getAll: (params) => axios.get(API_URL, { params }),

  // ➕ Create
  createCategory: (data) => axios.post(API_URL, data),

  // ✏️ Update
  updateCategory: (id, data) =>
    axios.put(`${API_URL}/${id}`, data),

  // 🗑️ Soft delete
  deleteCategory: (id) =>
    axios.delete(`${API_URL}/${id}`)
};

export default categoryApi;
