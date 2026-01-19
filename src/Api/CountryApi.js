import axios from "./axiosInstance";

export const getCountries = () => axios.get("/api/countries");

export const addCountry = (data) => axios.post("/countries", data);

export const updateCountry = (id, data) =>
  axios.put(`/countries/${id}`, data);

export const deleteCountry = (id) =>
  axios.delete(`/countries/${id}`);

