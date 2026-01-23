import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // 🔥 BACKEND URL
});


export const getProducts = () => api.get("/products");
export const getProductType = (id) => api.get(`/product-types/${id}`);
export const createVariants = (data) => api.post("/variants", data);