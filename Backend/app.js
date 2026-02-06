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
import inventoryRoutes from "./routes/inventory/inventory.routes.js";
import productTypeRoutes from "./routes/productType/productTypeRoutes.js";
import attributeTypeRoutes from "./routes/attributes/attributeTypeRoutes.js";
import attributeValueRoutes from "./routes/attributes/attributeValueRoutes.js";
import unifiedVariantRoutes from "./routes/attributes/unifiedVariantRoutes.js";
import discoveryRoutes from "./routes/discoveryRoutes.js";
import variantRoutes from "./routes/variant/variantRoutes.js";
import orderRoutes from "./routes/Order/OrderRoutes.js";
import wishlistRoutes from "./routes/Wishlist/WishlistRoutes.js";

import sizeRoutes from "./routes/size/sizeRoutes.js";
import colorRoutes from "./routes/color/colorRoutes.js";
import warehouseRoutes from "./routes/inventory/warehouse.routes.js";
import stockTransferRoutes from "./routes/inventory/stockTransfer.routes.js";
import binLocationRoutes from "./routes/inventory/binLocation.routes.js";
import cycleCountRoutes from "./routes/inventory/cycleCount.routes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

/* ================= CORE MIDDLEWARE ================= */

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",  // Admin Panel
      "http://localhost:3000"   // Customer Website
    ],
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
app.use("/api/attribute-types", attributeTypeRoutes);
app.use("/api/attribute-values", attributeValueRoutes);
app.use("/api/unified-variants", unifiedVariantRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/sizes", sizeRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/stock-transfers", stockTransferRoutes);
app.use("/api/bin-locations", binLocationRoutes);
app.use("/api/cycle-counts", cycleCountRoutes);
app.use("/api/upload", uploadRoutes);
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
