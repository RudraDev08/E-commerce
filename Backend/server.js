import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import countryRoutes from "./routes/countryRoutes.js";
import stateRoutes from "./routes/stateRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors())

app.use(express.json());

app.use("/api/countries", countryRoutes);
app.use("/api/states", stateRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
