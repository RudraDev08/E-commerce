// ============================================================================
// Customer Query Filter Middleware
// ============================================================================
// CRITICAL: Prevents draft/archived variants from leaking to customers.
// Enforces channel/region segmentation automatically.
// ============================================================================

import logger from '../config/logger.js';

/**
 * Inject Customer-Safe Filters into Query
 * Blocks draft variants, enforces segmentation
 */
export const customerQueryFilter = (req, res, next) => {
    // Detect admin routes
    const isAdminRoute =
        req.path.startsWith('/api/admin') ||
        req.path.startsWith('/admin') ||
        req.baseUrl?.includes('/admin');

    if (isAdminRoute) {
        logger.debug('Admin Route - No Filter Applied', { path: req.path });
        return next();
    }

    // Extract channel and region from request context
    // In production, these would come from:
    // - req.headers['x-channel'] (B2C, B2B, POS, APP)
    // - req.headers['x-region'] (US, EU, APAC, IN, GLOBAL)
    // - Or from authenticated user session
    const channel = req.headers['x-channel'] || req.query.channel || 'B2C';
    const region = req.headers['x-region'] || req.query.region || 'GLOBAL';

    // Build customer filter
    const customerFilter = {
        // Only show active and out_of_stock variants
        status: { $in: ['active', 'out_of_stock'] },

        // Exclude soft-deleted
        isDeleted: false,

        // Channel segmentation
        availableChannels: { $in: [channel, 'ALL'] },

        // Region segmentation
        availableRegions: { $in: [region, 'GLOBAL'] }
    };

    // Attach to request for explicit service usage
    req.customerFilter = customerFilter;
    req.customerContext = { channel, region };

    logger.debug('Customer Filter Applied', {
        path: req.path,
        channel,
        region
    });

    next();
};

/**
 * Merge Custom Query with Customer Filter
 * Use this in controllers/services
 */
export const mergeCustomerFilter = (customQuery, req) => {
    if (!req.customerFilter) {
        logger.warn('Customer Filter Missing - Using Default', {
            path: req.path
        });
        return {
            ...customQuery,
            status: { $in: ['active', 'out_of_stock'] },
            isDeleted: false
        };
    }

    return { ...customQuery, ...req.customerFilter };
};

/**
 * Variant Query Builder (Helper)
 * Automatically applies customer filter
 */
export const buildVariantQuery = (req, additionalFilters = {}) => {
    const baseFilter = req.customerFilter || {
        status: { $in: ['active', 'out_of_stock'] },
        isDeleted: false
    };

    return { ...baseFilter, ...additionalFilters };
};
