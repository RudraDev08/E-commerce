import axios from "axios";

const API = "http://localhost:5000/api/sizes";

export const getSizes = (params) =>
  axios.get(API, { params });

export const addSize = (data) =>
  axios.post(API, data);

export const updateSize = (id, data) =>
  axios.put(`${API}/${id}`, data);

export const deleteSize = (id) =>
  axios.delete(`${API}/${id}`);

export const toggleSize = (id) =>
  axios.patch(`${API}/toggle/${id}`);
