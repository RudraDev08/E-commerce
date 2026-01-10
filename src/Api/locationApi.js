import axios from "axios";

const BASE = "http://localhost:5000/api/location";

export const getCountries = () =>
  axios.get(`${BASE}/countries`);

export const getStates = (countryId) =>
  axios.get(`${BASE}/states?countryId=${countryId}`);

export const getCities = (stateId) =>
  axios.get(`${BASE}/cities?stateId=${stateId}`);
