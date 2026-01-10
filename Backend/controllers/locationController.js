import Country from "../models/Country.js";
import State from "../models/stateSchema.js";
import City from "../models/citySchema.js";

export const getCountries = async (req, res) => {
  const countries = await Country.find();
  res.json(countries);
};

export const getStates = async (req, res) => {
  const { countryId } = req.query;
  const states = await State.find({ countryId });
  res.json(states);
};

export const getCities = async (req, res) => {
  const { stateId } = req.query;
  const cities = await City.find({ stateId });
  res.json(cities);
};
