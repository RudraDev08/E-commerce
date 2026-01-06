import axios from "axios";

const API = "http://localhost:5000/cities";

export const getCityByPincode = (pincode) => {
  return axios.get(`${""}?pincode=${pincode}`);
};
