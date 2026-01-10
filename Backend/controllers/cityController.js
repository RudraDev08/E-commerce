import City from "../models/citySchema.js"; // Ensure this filename matches exactly

// @desc    Get all cities (MISSING FUNCTION ADDED HERE)
// @route   GET /api/cities
export const getCities = async (req, res, next) => {
  try {
    const cities = await City.find().populate("stateId", "name");
    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cities by State ID
// @route   GET /api/cities/state/:stateId
export const getCitiesByState = async (req, res, next) => {
  try {
    const { stateId } = req.params;
    const cities = await City.find({ stateId });
    
    res.status(200).json({ 
      success: true, 
      count: cities.length, 
      data: cities 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new city
// @route   POST /api/cities
export const addCity = async (req, res, next) => {
  try {
    const { name, stateId } = req.body;

    if (!name || !stateId) {
      res.status(400);
      throw new Error("City name and stateId are required");
    }

    const city = await City.create({
      name,
      stateId,
    });

    res.status(201).json({
      success: true,
      data: city,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update city
// @route   PUT /api/cities/:id
export const updateCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!city) {
      res.status(404);
      throw new Error("City not found");
    }

    res.status(200).json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete city
// @route   DELETE /api/cities/:id
export const deleteCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);

    if (!city) {
      res.status(404);
      throw new Error("City not found");
    }

    res.status(200).json({ success: true, message: "City deleted successfully" });
  } catch (error) {
    next(error);
  }
};