import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getBrands = () => API.get("/brands");
export const getBrandById = (id) => API.get(`/brands/${id}`);
export const createBrand = (data) => API.post("/brands", data);
export const updateBrand = (id, data) => API.put(`/brands/${id}`, data);
export const deleteBrand = (id) => API.delete(`/brands/${id}`);
