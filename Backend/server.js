import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Country Routes
import countryRoutes from "./routes/countryRoutes.js";
import stateRoutes from "./routes/stateRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import pincodeRoutes from "./routes/pincodeRoutes.js";

// Category Routes
import CategoryRoutes from "./routes/Category/CategoryRoutes.js"

// Load Environment Variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// CORS: Configured to allow your React app
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));




/* ================= ROUTES ================= */

app.use("/api/countries", countryRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/pincodes", pincodeRoutes)

app.use("/api/categories", CategoryRoutes)


// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", message: "Server is healthy" });
});

/* ================= ERROR HANDLING ================= */

// 404 Handler for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handler (Captures all controller errors)
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});



/* ================= SERVER START ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🚀 Server is flying!
  📡 URL: http://localhost:${PORT}
  🛠️  Mode: ${process.env.NODE_ENV || 'development'}
  `);
});