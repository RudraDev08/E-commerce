import axios from "axios";

const BASE = "http://localhost:5000/countries";

export const getCountries = () => axios.get(BASE);

export const addCountry = (data) => axios.post(BASE, data);

export const updateCountry = (id, data) =>
  axios.patch(`${BASE}/${id}`, data);

export const deleteCountry = (id) =>
  axios.delete(`${BASE}/${id}`);
