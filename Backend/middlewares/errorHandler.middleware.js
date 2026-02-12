import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';
import fs from 'fs';

/**
 * Global Error Handler Middleware
 * Handles all errors and sends consistent error responses
 */
export const errorHandler = (err, req, res, next) => {
    let error = err;

    // Log error
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: req.id,
        userId: 'unauthenticated',
    });

    // Handle Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));

        error = new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', details);
    }

    // Handle Mongoose Cast Error (Invalid ObjectId)
    if (err.name === 'CastError') {
        error = new ApiError(
            400,
            'INVALID_ID',
            `Invalid ${err.path}: ${err.value}`
        );
    }

    // Handle Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const value = err.keyValue[field];

        error = new ApiError(
            409,
            'DUPLICATE_KEY',
            `${field} '${value}' already exists`,
            { field, value }
        );
    }

    // Handle JWT Errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, 'INVALID_TOKEN', 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = new ApiError(401, 'TOKEN_EXPIRED', 'Token expired');
    }

    // Handle our custom ApiError
    if (error.isOperational) {
        return res.status(error.statusCode).json(error.toJSON());
    }

    // Handle unknown errors (non-operational)
    const statusCode = error.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message;

    return res.status(statusCode).json({
        success: false,
        message: message, // Added for frontend compatibility
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message,
            details: error.details || null,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
    });
};

/**
 * 404 Not Found Handler
 * Handles requests to undefined routes
 */
export const notFoundHandler = (req, res, next) => {
    logger.warn('Route not found:', {
        path: req.originalUrl,
        method: req.method,
        requestId: req.id,
    });

    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.originalUrl} not found`,
        },
    });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
