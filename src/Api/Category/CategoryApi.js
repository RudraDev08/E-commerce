import axios from "axios";

const API_URL = "http://localhost:5000/api/categories";

/* ---------------- CATEGORY TREE ---------------- */
export const getCategoryTree = async () => {
  const { data } = await axios.get(`${API_URL}/tree`);
  return data;
};

/* ---------------- FLAT CATEGORY LIST ---------------- */
export const getCategories = async () => {
  const { data } = await axios.get(API_URL);
  return data;
};

/* ---------------- CREATE ---------------- */
export const createCategory = async (payload) => {
  const { data } = await axios.post(API_URL, payload);
  return data;
};

/* ---------------- UPDATE ---------------- */
export const updateCategory = async (id, payload) => {
  const { data } = await axios.put(`${API_URL}/${id}`, payload);
  return data;
};

/* ---------------- DELETE ---------------- */
export const deleteCategory = async (id) => {
  const { data } = await axios.delete(`${API_URL}/${id}`);
  return data;
};
