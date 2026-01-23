import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});


export const getProducts = () => api.get("/products");

export const getAllProductTypes = () => api.get("/product-types"); 

export const getProductType = (id) => api.get(`/product-types/${id}`);
export const createVariants = (data) => api.post("/variants", data);
export const deleteVariant = (id) => api.delete(`/variants/${id}`);
export const toggleVariant = (id) => api.patch(`/variants/${id}/toggle`);