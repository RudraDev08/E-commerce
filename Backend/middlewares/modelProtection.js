// ============================================================================
// Variant Model Protection Pattern
// ============================================================================
// CRITICAL: Prevents direct model usage outside VariantService.
// Enforces service-layer writes for price calculation and search sync.
// ============================================================================

import mongoose from 'mongoose';
import logger from '../config/logger.js';

/**
 * STRATEGY 1: Static Method Interception (Recommended)
 * Override dangerous static methods to throw errors
 */
export function protectVariantModel(VariantModel) {
    const dangerousMethods = ['insertMany', 'updateMany', 'deleteMany', 'bulkWrite'];

    dangerousMethods.forEach(method => {
        const original = VariantModel[method];

        VariantModel[method] = function (...args) {
            const stack = new Error().stack;
            const callerFile = stack.split('\n')[2];

            // Allow if called from VariantService
            if (callerFile.includes('VariantService.js') || callerFile.includes('migration')) {
                return original.apply(this, args);
            }

            logger.error('Direct Model Access Blocked', {
                method,
                caller: callerFile,
                message: 'Use VariantService.upsertVariant() instead'
            });

            throw new Error(
                `FORBIDDEN: Variant.${method}() is disabled. Use VariantService.upsertVariant() to ensure price calculation and search sync.`
            );
        };
    });

    logger.info('Variant Model Protected', { methods: dangerousMethods });
}

/**
 * STRATEGY 2: AsyncLocalStorage Context Tracking (Advanced)
 * Track execution context to identify service-layer calls
 */
import { AsyncLocalStorage } from 'async_hooks';

const serviceContext = new AsyncLocalStorage();

export function withServiceContext(fn) {
    return serviceContext.run({ isService: true }, fn);
}

export function enforceServiceContext(VariantModel) {
    const dangerousMethods = ['insertMany', 'updateMany', 'deleteMany'];

    dangerousMethods.forEach(method => {
        const original = VariantModel[method];

        VariantModel[method] = function (...args) {
            const context = serviceContext.getStore();

            if (!context?.isService) {
                logger.error('Service Context Missing', {
                    method,
                    message: 'Direct model access detected'
                });

                throw new Error(
                    `FORBIDDEN: Variant.${method}() must be called from VariantService`
                );
            }

            return original.apply(this, args);
        };
    });
}

/**
 * STRATEGY 3: Pre-Hook Validation (Lightweight)
 * Add validation in Mongoose pre-hooks
 */
export function addVariantPreHookProtection(variantSchema) {
    const bulkMethods = ['insertMany', 'updateMany'];

    bulkMethods.forEach(method => {
        variantSchema.pre(method, function (next) {
            const stack = new Error().stack;

            if (!stack.includes('VariantService') && !stack.includes('migration')) {
                logger.warn('Bulk Operation Outside Service', {
                    method,
                    message: 'Potential hook bypass detected'
                });
            }

            next();
        });
    });
}

/**
 * USAGE EXAMPLE
 */
/*
// In your main app.js or server.js:
import Variant from './models/variant/variantSchema.js';
import { protectVariantModel } from './middlewares/modelProtection.js';

// Apply protection
protectVariantModel(Variant);

// Now any direct usage will throw:
// await Variant.insertMany([...]); // ❌ THROWS ERROR
// await VariantService.bulkUpsertVariants([...]); // ✅ WORKS
*/
