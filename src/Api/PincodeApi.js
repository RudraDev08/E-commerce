import axios from "axios";

const BASE = "http://localhost:5000/api/pincodes";

/* ADD PINCODE */
export const addPincode = (data) =>
  axios.post(BASE, data);

/* GET PINCODES (VIEW + SEARCH + PAGINATION) */
export const getPincodes = (page = 1, search = "", cityId = "") => {
  let url = `${BASE}?page=${page}&search=${search}`;

  if (cityId) {
    url += `&cityId=${cityId}`;
  }

  return axios.get(url);
};

/* UPDATE PINCODE */
export const updatePincode = (id, data) =>
  axios.put(`${BASE}/${id}`, data);

/* DELETE PINCODE */
export const deletePincode = (id) =>
  axios.delete(`${BASE}/${id}`);
