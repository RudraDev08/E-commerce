import axios from "axios";

const API = "http://localhost:5000/cities";

export const getCitiesByState = (stateId) =>
  axios.get(`${API}?stateId=${stateId}`);

export const addCity = (data) =>
  axios.post(API, data);

export const updateCity = (id, data) =>
  axios.patch(`${API}/${id}`, data);

export const deleteCity = (id) =>
  axios.delete(`${API}/${id}`);
