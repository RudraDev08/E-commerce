import State from "../models/stateSchema.js";
import mongoose from "mongoose";

/* GET STATES (optional country filter) */
export const getStates = async (req, res) => {
  try {
    const { countryId } = req.query;

    const filter = countryId ? { countryId } : {};
    const states = await State.find(filter).populate("countryId", "name");

    res.json(states);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* CREATE STATE */
export const addState = async (req, res) => {
  try {
    const { name, countryId, active = true } = req.body;

    // validations
    if (!name?.trim()) {
      return res.status(400).json({ message: "State name required" });
    }

    if (!countryId) {
      return res.status(400).json({ message: "CountryId required" });
    }

    if (!mongoose.Types.ObjectId.isValid(countryId)) {
      return res.status(400).json({ message: "Invalid countryId" });
    }

    const state = await State.create({
      name: name.trim(),
      countryId,
      active,
    });

    res.status(201).json(state);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* UPDATE STATE */
export const updateState = async (req, res) => {
  try {
    const updated = await State.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* DELETE STATE */
export const deleteState = async (req, res) => {
  try {
    await State.findByIdAndDelete(req.params.id);
    res.json({ message: "State deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
