import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BASE = `${API_URL}/api/categories`;

const categoryApi = {
  getAll: (params) => axios.get(BASE, { params }),
  getTree: () => axios.get(`${BASE}/tree`),
  getById: (id) => axios.get(`${BASE}/${id}`),
  create: (data) => axios.post(BASE, data),
  update: (id, data) => axios.put(`${BASE}/${id}`, data),
  remove: (id) => axios.delete(`${BASE}/${id}`)
};

export default categoryApi;
