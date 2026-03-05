import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import * as Sentry from '@sentry/node';

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

// Auth Module Routes
import authRoutes from "./modules/auth/auth.routes.js";


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
import cartRoutes from "../routes/cart/cartRoutes.js";
import analyticsRoutes from "../routes/analytics/analytics.routes.js";
import systemRoutes from "../routes/system/system.routes.js";
import metrics from "../services/MetricsService.js";

// ── INVENTORY INVARIANT GUARD ───────────────────────────────────────────────
// Runs once at startup after DB connection. Detects orphan InventoryMaster
// records caused by bulkWrite ops that bypass the VariantMaster post-save hook.
// Non-blocking: logs and continues, never crashes the server.
export async function runInventoryInvariantCheck() {
    try {
        const mongoose = (await import('mongoose')).default;
        const VM = mongoose.models.VariantMaster;
        const IM = mongoose.models.InventoryMaster;
        if (!VM || !IM) return;

        const [variantCount, inventoryCount] = await Promise.all([
            VM.countDocuments({ status: { $ne: 'ARCHIVED' } }),
            IM.countDocuments({ isDeleted: false }),
        ]);

        if (variantCount !== inventoryCount) {
            logger.error(
                '[STARTUP] \u274C INVENTORY INVARIANT VIOLATED: ' +
                `${variantCount} active variants vs ${inventoryCount} inventory records. ` +
                `Drift = ${variantCount - inventoryCount}. ` +
                'Run: node Backend/scripts/repairInventoryMaster.js'
            );
        } else {
            logger.info(`[STARTUP] \u2705 Inventory invariant OK: ${variantCount} variants = ${inventoryCount} records.`);
        }
    } catch (err) {
        logger.error('[STARTUP] Inventory invariant check failed:', err.message);
    }
}

const app = express();

Sentry.setupExpressErrorHandler(app);

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

// Auth — mounted BEFORE rate limiter (login has its own rate limiting via security.middleware)
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use('/api/auth', authRoutes);

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
app.use(`${API_PREFIX}/cart`, cartRoutes);
// Fix 10: Analytics API
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

// System endpoints (Feature Flags, Roles)
app.use(`${API_PREFIX}/system`, systemRoutes);

// Step 7.3: Cache Policy for Price-Sensitive Routes
app.use([`${API_PREFIX}/cart`, `${API_PREFIX}/orders`, `${API_PREFIX}/variants`], (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
});


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
app.use("/api/cart", cartRoutes);
// Fix 10: Analytics API (legacy prefix)
app.use("/api/analytics", analyticsRoutes);

/* ================= INTERNAL / OBSERVABILITY ROUTES ================= */
// STEP 11: Auto Freeze Protection Config
import SystemState from '../models/SystemState.model.js';
global.systemState = global.systemState ?? { checkoutFrozen: false };

export async function loadSystemState() {
    try {
        const state = await SystemState.findOne();
        if (state) {
            global.systemState.checkoutFrozen = state.checkoutFrozen;
            logger.info(`[STARTUP] System State Loaded: Checkout Frozen = ${state.checkoutFrozen}`);
        } else {
            await SystemState.create({ checkoutFrozen: false });
        }
    } catch (err) {
        logger.error('[STARTUP] Failed to load System State:', err.message);
    }
}

app.post('/api/internal/system/freeze-checkout', async (req, res) => {
    global.systemState.checkoutFrozen = true;
    await SystemState.findOneAndUpdate({}, { checkoutFrozen: true, reason: 'Manual API', triggeredAt: new Date() }, { upsert: true });
    return res.json({ success: true, message: 'Checkout is now FROZEN manually' });
});

app.post('/api/internal/system/unfreeze-checkout', async (req, res) => {
    global.systemState.checkoutFrozen = false;
    await SystemState.findOneAndUpdate({}, { checkoutFrozen: false, reason: 'Manual Unfreeze', triggeredAt: new Date() }, { upsert: true });
    return res.json({ success: true, message: 'Checkout is now UNFROZEN' });
});

// FIX 11 + STEP 1 — /internal/metrics for SystemDashboard
app.get('/api/internal/metrics', async (req, res) => {
    try {
        res.set('Content-Type', 'text/plain');
        return res.send(metrics.scrape());
    } catch (err) {
        res.set('Content-Type', 'text/plain');
        return res.status(500).send(`error ${err.message}`);
    }
});


/* ================= ERROR HANDLING ================= */

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
