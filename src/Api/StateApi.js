import axios from "axios";

const API = "http://localhost:5000/states";

// READ (by country)
export const getStates = (countryId) => {
  return axios.get(`${API}?countryId=${countryId}`);
};

// CREATE
export const addState = (data) => {
  return axios.post(API, data);
};

// UPDATE (name / active)
export const updateState = (id, data) => {
  return axios.patch(`${API}/${id}`, data);
};

// DELETE
export const deleteState = (id) => {
  return axios.delete(`${API}/${id}`);
};
