import mongoose from "mongoose";

const stateSchema = new mongoose.Schema(
    {

        name: {
            type: String,
            required: true,
            trim: true,
        },
        countryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Country",
            required: true,
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {timestamps: true}
);

export default mongoose.model("State", stateSchema);
