import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import countryRoutes from "./routes/countryRoutes.js";
import stateRoutes from "./routes/stateRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import pincodeRoutes from "./routes/pincodeRoutes.js";
import categoryRoutes from "./routes/Category/CategoryRoutes.js";
import brandRoutes from "./routes/Brands/BrandsRoutes.js";
import productRoutes from "./routes/Product/ProductRoutes.js";
import inventoryRoutes from "./routes/inventory/inventoryRoutes.js";
import productTypeRoutes from "./routes/productType/productTypeRoutes.js";
import attributeRoutes from "./routes/attribute/attributeRoutes.js";
import variantRoutes from "./routes/variant/variantRoutes.js";
import sizeRoutes from "./routes/Size/sizeRoutes.js";

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROUTES ================= */

app.use("/api/countries", countryRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/pincodes", pincodeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/product-types", productTypeRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/sizes", sizeRoutes);
/* ================= HEALTH ================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    message: "Server is healthy 🚀",
  });
});

/* ================= 404 ================= */

app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

export default app;
