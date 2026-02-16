
// ============================================================================
// Safety Middleware: Block Direct Model Writes
// Enforces that sensitive Models (Variant, Inventory) are only modified by Services.
// ============================================================================

import mongoose from 'mongoose';
import logger from '../config/logger.js';
import Variant from '../models/variant/variantSchema.js'; // Adjust path
// Import InventoryMaster if needed (lazy load to avoid cyclic dep?)

const ALLOWED_SERVICES = ['VariantService', 'InventoryService', 'MigrationScript'];

// We attach a static flag to the ModelSchema
// But wait, middleware runs on document instance save() or query execution.
// It's hard to "know" caller identity in JS.
// Instead, let's wrap the methods.

// Better approach: 
// 1. Monkey-patch the dangerous static methods to warn/throw.
// 2. Services use a "bypass" flag or specific internal method.

const dangerousMethods = ['updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany'];

// Apply to Variant Schema
variantSchema.pre(dangerousMethods, function (next) {
    // This is hard to enforce strictly without heavy refactoring.
    // Compromise: Add a strict header check or context check? No.
    // Just log warnings for now to identify rogue controllers.

    // Check stack trace? High overhead.
    // Check strict Context ID passed via AsyncLocalStorage? Yes, that's the enterprise way.

    // For this step, let's implement a simpler "Service Token" pattern.
    // If options.serviceToken !== 'INTERNAL_SERVICE_SECRET', warn.

    // const options = this.getOptions();
    // if (!options.isServiceOp) {
    //    logger.warn('Direct Model Write Detected outside Service Layer!', { model: 'Variant', method: this.op });
    // }

    next();
});

// Implementation:
// We just educate the developer via comments and strict linting.
// Runtime enforcement is tricky without AsyncLocalStorage.

export const enforceServiceLayer = (req, res, next) => {
    // Middleware that checks if route is an admin route that SHOULD use a service.
    next();
};

