import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const getCitiesByState = async (stateId) => {
  if (!stateId) return [];

  const res = await axios.get(
    `${API_BASE_URL}/cities/state/${stateId}`
  );

  return res.data?.data || [];
};

export const addCity = async (data) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/cities`,
      data
    );
    return res.data;
  } catch (error) {
    console.error("ADD CITY API ERROR:", error.response?.data || error.message);
    throw error; // let toast handle it
  }
};


export const updateCity = async (id, data) => {
  const res = await axios.put(
    `${API_BASE_URL}/cities/${id}`,
    data
  );
  return res.data;
};

export const deleteCity = async (id) => {
  const res = await axios.delete(
    `${API_BASE_URL}/cities/${id}`
  );
  return res.data;
};
