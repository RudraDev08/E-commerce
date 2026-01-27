import axios from "axios";

const API_URL = "http://localhost:5000/api/brands";

const brandApi = {
  getAll: (params) => axios.get(API_URL, { params }),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  getStats: () => axios.get(`${API_URL}/stats`),

  create: (formData) => axios.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),

  update: (id, formData) => axios.put(`${API_URL}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),

  delete: (id) => axios.delete(`${API_URL}/${id}`),
  restore: (id) => axios.patch(`${API_URL}/${id}/restore`),
  toggleStatus: (id) => axios.patch(`${API_URL}/${id}/toggle-status`)
};

export default brandApi;
