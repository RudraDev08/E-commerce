import express from "express";
import countryRoutes from "./routes/countryRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/countries", countryRoutes);

export default app;
