import axios from 'axios'

const API_URL = "http://localhost:5000/cities";

export const getCities = () => axios.get("http://localhost:5000/cities");
export const addCity = (data) => axios.post("http://localhost:5000/cities", data)
export const updateCity = (id, data) => axios.put(`http://localhost:5000/cities/${id}`, data)  
export const deleteCity = (id) => axios.delete(`http://localhost:5000/cities/${id}`)         