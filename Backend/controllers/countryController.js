import Country from "../models/Country";

// GET /api/countries
export const getCountries = async (req, res) => {
  try {
    const countries = await Country.find();
    res.status(200).json(countries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
