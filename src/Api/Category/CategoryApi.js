import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/categories",
  headers: {
    "Content-Type": "application/json"
  }
});


// Get all categories (Admin)
export const getCategories = async () => {
  const res = await api.get("/");
  return res.data; // { success, data }
};

// Create category (MAIN / SUB)
export const createCategory = async (data) => {
  const res = await api.post("/", data);
  return res.data;
};

// Toggle category status
export const toggleCategoryStatus = async (id) => {
  const res = await api.patch(`/${id}/status`);
  return res.data;
};

// Get category tree (for sidebar / parent dropdown)
export const getCategoryTree = async () => {
  const res = await api.get("/tree");
  return res.data; // { success, data }
  
};

export const deleteCategory = async (id) => {
  return api.delete(`/${id}`);
};

export const updateCategory = async (id, data) => {
  return api.put(`/${id}`, data);
};

