import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Security Middleware
import {
    helmetMiddleware,
    mongoSanitizeMiddleware,
    requestIdMiddleware,
    corsOptions,
    apiLimiter,
} from "../middlewares/security.middleware.js";

// Error Handling
import {
    errorHandler,
    notFoundHandler,
} from "../middlewares/errorHandler.middleware.js";

// Logger
import logger from "../config/logger.js";

// New Modular Routes
// import authRoutes from "./modules/auth/auth.routes.js";

// Legacy Routes (Loaded from Backend/routes)
import countryRoutes from "../routes/countryRoutes.js";
import stateRoutes from "../routes/stateRoutes.js";
import cityRoutes from "../routes/cityRoutes.js";
import locationRoutes from "../routes/locationRoutes.js";
import pincodeRoutes from "../routes/pincodeRoutes.js";
import categoryRoutes from "../routes/Category/CategoryRoutes.js";
import brandRoutes from "../routes/Brands/BrandsRoutes.js";
import productRoutes from "./modules/product/product.routes.js";
import inventoryRoutes from "../routes/inventory/inventory.routes.js";
import productTypeRoutes from "../routes/productType/productTypeRoutes.js";
import attributeTypeRoutes from "../routes/attributes/attributeTypeRoutes.js";
import attributeValueRoutes from "../routes/attributes/attributeValueRoutes.js";
import attributeRoutes from "../routes/attributes/attributeRoutes.js";
import discoveryRoutes from "../routes/discoveryRoutes.js";
import variantRoutes from "../routes/variant/variantRoutes.js";
import { getVariantsByProductGroup } from "../controllers/variant/variantController.js";
import orderRoutes from "../routes/Order/OrderRoutes.js";
import sizeRoutes from "../routes/size/sizeRoutes.js";
import colorRoutes from "../routes/color/colorRoutes.js";
import warehouseRoutes from "../routes/inventory/warehouse.routes.js";
import stockTransferRoutes from "../routes/inventory/stockTransfer.routes.js";
import binLocationRoutes from "../routes/inventory/binLocation.routes.js";
import cycleCountRoutes from "../routes/inventory/cycleCount.routes.js";
import uploadRoutes from "../routes/uploadRoutes.js";

const app = express();

/* ================= SECURITY MIDDLEWARE ================= */

// Request ID
app.use(requestIdMiddleware);

// Security headers
app.use(helmetMiddleware);

// CORS
app.use(cors(corsOptions));

/* ================= CORE MIDDLEWARE ================= */

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB sanitization
app.use(mongoSanitizeMiddleware);

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.id,
            requestId: req.id,

        });
    });
    next();
});

/* ================= STATIC FILES ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory is one level up from src
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* ================= HEALTH CHECK ================= */

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        data: {
            status: "UP",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
        },
    });
});

/* ================= API ROUTES (v1) ================= */

const API_PREFIX = '/api/v1';

// Authentication (New Module)
// app.use(`${API_PREFIX}/auth`, authRoutes);

// Apply rate limiting to all other API routes
app.use(API_PREFIX, apiLimiter);

// Legacy Routes (Directly mapped)
app.use(`${API_PREFIX}/countries`, countryRoutes);
app.use(`${API_PREFIX}/states`, stateRoutes);
app.use(`${API_PREFIX}/cities`, cityRoutes);
app.use(`${API_PREFIX}/location`, locationRoutes);
app.use(`${API_PREFIX}/pincodes`, pincodeRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/brands`, brandRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/product-types`, productTypeRoutes);
app.use(`${API_PREFIX}/attribute-types`, attributeTypeRoutes);
app.use(`${API_PREFIX}/attribute-values`, attributeValueRoutes);
app.use(`${API_PREFIX}/attributes`, attributeRoutes);
app.use(`${API_PREFIX}/sizes`, sizeRoutes);
app.use(`${API_PREFIX}/colors`, colorRoutes);
app.use(`${API_PREFIX}/variants`, variantRoutes);
// Customer-facing product group variants — one clean URL for PDP
app.get(`${API_PREFIX}/products/:productGroupId/variants`, getVariantsByProductGroup);
app.use(`${API_PREFIX}/discovery`, discoveryRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/warehouses`, warehouseRoutes);
app.use(`${API_PREFIX}/stock-transfers`, stockTransferRoutes);
app.use(`${API_PREFIX}/bin-locations`, binLocationRoutes);
app.use(`${API_PREFIX}/cycle-counts`, cycleCountRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);

/* ================= LEGACY ROUTES (Backward Compatibility) ================= */

// Keep old routes for backward compatibility
app.use("/api/countries", countryRoutes);
// ... Add duplicates if strictly needed, but v1 is preferred. 
// For Refactoring, we point everything to v1 if possible, or support legacy paths.
// Given strict "Do NOT break working functionality", I should keep /api/xyz paths too.

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
app.use("/api/attributes", attributeRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/variants", variantRoutes);
app.get("/api/products/:productGroupId/variants", getVariantsByProductGroup);
app.use("/api/orders", orderRoutes);
app.use("/api/sizes", sizeRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/stock-transfers", stockTransferRoutes);
app.use("/api/bin-locations", binLocationRoutes);
app.use("/api/cycle-counts", cycleCountRoutes);
app.use("/api/upload", uploadRoutes);

/* ================= ERROR HANDLING ================= */

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
