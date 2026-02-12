import Joi from 'joi';
import logger from '../config/logger.js';

/**
 * Validation Middleware Factory
 * Creates middleware to validate request data using Joi schemas
 */
export const validate = (schema) => {
    return (req, res, next) => {
        const validationOptions = {
            abortEarly: false, // Return all errors
            allowUnknown: true, // Allow unknown keys (for extra fields)
            stripUnknown: true, // Remove unknown keys
        };

        const { error, value } = schema.validate(
            {
                body: req.body,
                query: req.query,
                params: req.params,
            },
            validationOptions
        );

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/['"]/g, ''),
            }));

            logger.warn('Validation failed:', {
                path: req.path,
                errors,
                requestId: req.id,
            });

            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: errors,
                },
            });
        }

        // Replace request data with validated data
        req.body = value.body || req.body;
        req.query = value.query || req.query;
        req.params = value.params || req.params;

        next();
    };
};

/**
 * Common Validation Schemas
 */

// MongoDB ObjectId validation
export const objectIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

// Pagination validation
export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc'),
});

// User registration validation - REMOVED

// User login validation - REMOVED

// Product creation validation
export const createProductSchema = Joi.object({
    body: Joi.object({
        name: Joi.string().min(2).max(200).required(),
        description: Joi.string().allow(''),
        category: objectIdSchema.required(),
        brand: objectIdSchema,
        status: Joi.string().valid('active', 'inactive', 'draft').default('draft'),
        slug: Joi.string(),
    }),
});

// Variant creation validation
export const createVariantSchema = Joi.object({
    body: Joi.object({
        product: objectIdSchema.required(),
        sku: Joi.string().required(),
        attributes: Joi.object().required(),
        price: Joi.number().min(0),
        stock: Joi.number().integer().min(0),
        images: Joi.array().items(Joi.string()),
    }),
});

// ID parameter validation
export const idParamSchema = Joi.object({
    params: Joi.object({
        id: objectIdSchema.required(),
    }),
});

export default validate;
