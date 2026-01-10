import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  stateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "State", 
    required: true 
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const City = mongoose.model("City", citySchema);
export default City; 