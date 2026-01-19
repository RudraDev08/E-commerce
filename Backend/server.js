import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

// Routes
import countryRoutes from "./routes/countryRoutes.js";
import stateRoutes from "./routes/stateRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import pincodeRoutes from "./routes/pincodeRoutes.js";
import categoryRoutes from "./routes/Category/CategoryRoutes.js";
import brandRoutes from "./routes/Brands/BrandsRoutes.js"

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();

/* ================= CORE MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ================= STATIC FILES ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static("uploads"));

/* ================= ROUTES ================= */

app.use("/api/countries", countryRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/pincodes", pincodeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes)

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    message: "Server is healthy 🚀",
  });
});

/* ================= 404 HANDLER ================= */

app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});

/* ================= GLOBAL ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack:
      process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 Server is flying!
📡 URL: http://localhost:${PORT}
🛠️  Mode: ${process.env.NODE_ENV || "development"}
  `);
});
