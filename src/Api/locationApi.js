import axios from "axios";

const BASE = "http://localhost:5000";

export const getCityByPincode = (pincode) =>
  axios.get(`${BASE}/cities?pincode=${pincode}`);

export const getStateById = (id) =>
  axios.get(`${BASE}/states/${id}`);

export const getCountryById = (id) =>
  axios.get(`${BASE}/countries/${id}`);
