import mongoose from "mongoose";

const pincodeSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true
  }
});

export default mongoose.model("Pincode", pincodeSchema);
