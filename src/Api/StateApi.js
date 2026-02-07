import axios from "./axiosInstance";

/* GET STATES by countryId */
export const getStates = (countryId) =>
  axios.get("/states", {
    params: { countryId },
  });

/* ADD STATE */
export const addState = (data) =>
  axios.post("/states", data);

/* UPDATE STATE */
export const updateState = (id, data) =>
  axios.put(`/states/${id}`, data);

/* DELETE STATE */
export const deleteState = (id) =>
  axios.delete(`/states/${id}`);
