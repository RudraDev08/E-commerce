import axios from "axios";

export const getProducts = () => axios.get("/products");
export const getProductType = (id) =>
  axios.get(`/product-types/${id}`);
export const createVariants = (data) =>
  axios.post("/variants", data);
