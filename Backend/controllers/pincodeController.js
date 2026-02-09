import Pincode from "../models/pincodeSchema.js";

/* ================= ADD PINCODE ================= */
export const addPincode = async (req, res) => {
  try {
    const { pincode, cityId } = req.body;

    if (!pincode || !cityId) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await Pincode.findOne({ pincode });
    if (exists) {
      return res.status(409).json({ message: "Pincode already exists" });
    }

    const newPincode = await Pincode.create({ pincode, cityId });
    res.status(201).json(newPincode);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET PINCODES (VIEW + SEARCH + PAGINATION) ================= */
export const getPincodes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", cityId = "" } = req.query;

    // Build query object with hierarchical filtering
    const query = {};

    // Filter by cityId if provided (hierarchical filter)
    if (cityId) {
      query.cityId = cityId;
    }

    // Add search filter if provided
    if (search) {
      query.pincode = { $regex: search, $options: "i" };
    }

    const total = await Pincode.countDocuments(query);

    const pincodes = await Pincode.find(query)
      .populate({
        path: "cityId",
        populate: {
          path: "stateId",
          populate: { path: "countryId" }
        }
      })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: pincodes
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE PINCODE ================= */
export const updatePincode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    // Allow updating pincode value
    if (req.body.pincode !== undefined) {
      updates.pincode = req.body.pincode;
    }

    // Allow updating active status
    if (req.body.active !== undefined) {
      updates.active = req.body.active;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updated = await Pincode.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Pincode not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE PINCODE ================= */
export const deletePincode = async (req, res) => {
  try {
    await Pincode.findByIdAndDelete(req.params.id);
    res.json({ message: "Pincode deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
