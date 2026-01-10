import Country from "../models/Country.js";

//ADD Country
export const getCountries = async (req, res) => {
  try {
    const countries = await Country.find();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Country
export const createCountry = async (req, res) => {
  try {
    const country = await Country.create(req.body);
    res.status(201).json(country);
  } catch (error) {
    console.error("COUNTRY CREATE ERROR:", error.message); 
    res.status(400).json({ message: error.message });
  }
};


// Update Country

export const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Country.findByIdAndUpdate(id, req.body, { new: true });

    if(!updated){
      return res.status(404).json({ message: "Country not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// delete Country
export const deleteCountry = async (req, res) =>{
  try {
    const {id} = req.params;
    const deleted = await Country.findByIdAndDelete(id);

    if(!deleted){
      return res.status(404).json({ message: "Country not found" });
    }

    res.json(deleted);
  } catch (error) {
    res.status(500).json({ message: error.message });    
  }

}