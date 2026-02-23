/**
 * Utility: Decimal128 Serialization Helper
 *
 * Ensures Mongoose Decimal128 objects are safely converted to 
 * precision-lossless strings before being sent to the React frontend.
 */

export const safeDecimalSerialize = (value) => {
    if (value === null || value === undefined) {
        return null; // Preserve null state
    }

    // Handle Mongo Decimal128 object structure
    if (value && typeof value === 'object' && value.$numberDecimal) {
        // Prevent NaN injection / malformed strings
        const parsed = parseFloat(value.$numberDecimal);
        if (isNaN(parsed)) return null;

        // Ensure string return to prevent precision bleed in JavaScript Numbers
        return value.$numberDecimal;
    }

    // Handle string inputs (e.g. from raw DB queries)
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return null;
        return value;
    }

    // Handle raw numbers (fallback)
    if (typeof value === 'number') {
        if (isNaN(value)) return null;
        // Fix to 2 decimal places to avoid floating point anomalies like 1.9999999999999999
        return parseFloat(value.toFixed(2)).toString();
    }

    return null;
};

/**
 * Express Middleware to sanitize JSON responses containing Decimal128 recursively.
 * Usage: app.use(decimal128ResponseSanitizer)
 */
export const decimal128ResponseSanitizer = (req, res, next) => {
    const originalSend = res.json;

    res.json = function (obj) {
        const sanitizeObject = (target) => {
            if (target === null || target === undefined) return target;
            if (typeof target !== 'object') return target;

            // Arrays
            if (Array.isArray(target)) {
                return target.map(sanitizeObject);
            }

            // Decimal128 Catch
            if (target.$numberDecimal !== undefined) {
                return safeDecimalSerialize(target);
            }

            // Regular objects
            const sanitized = {};
            for (const [key, val] of Object.entries(target)) {
                sanitized[key] = sanitizeObject(val);
            }
            return sanitized;
        };

        const safeObj = sanitizeObject(obj);
        return originalSend.call(this, safeObj);
    };

    next();
};
