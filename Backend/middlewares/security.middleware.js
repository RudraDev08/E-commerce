import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import logger from '../config/logger.js';

/**
 * Helmet Security Headers
 * Adds various HTTP headers for security
 */
export const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * MongoDB Sanitization
 * Prevents NoSQL injection attacks by recursively removing keys starting with $ or containing .
 * This version is compatible with Express 5 where req.query is a getter.
 */
export const mongoSanitizeMiddleware = (req, res, next) => {
    const sanitize = (obj, name) => {
        if (obj && typeof obj === 'object') {
            try {
                const keys = Object.keys(obj);
                for (const key of keys) {
                    if (key.startsWith('$') || key.includes('.')) {
                        const desc = Object.getOwnPropertyDescriptor(obj, key);
                        if (!desc || desc.configurable) {
                            delete obj[key];
                        }
                    } else if (obj[key] && typeof obj[key] === 'object') {
                        sanitize(obj[key], `${name}.${key}`);
                    }
                }
            } catch (err) {
                logger.error(`Sanitization error on req.${name}:`, err);
            }
        }
    };

    if (req.params) sanitize(req.params, 'params');
    if (req.query) sanitize(req.query, 'query');
    if (req.body) sanitize(req.body, 'body');

    next();
};

/**
 * General Rate Limiter
 * Limits requests from same IP
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded:', {
            ip: req.ip,
            path: req.path,
            requestId: req.id,
        });

        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later',
            },
        });
    },
});

/**
 * Strict Rate Limiter for Auth Routes
 * More restrictive for login/register endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
        },
    },
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded:', {
            ip: req.ip,
            path: req.path,
            requestId: req.id,
        });

        res.status(429).json({
            success: false,
            error: {
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                message: 'Too many authentication attempts, please try again later',
            },
        });
    },
});

/**
 * API Rate Limiter
 * For general API endpoints
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: {
        success: false,
        error: {
            code: 'API_RATE_LIMIT_EXCEEDED',
            message: 'API rate limit exceeded, please try again later',
        },
    },
});

/**
 * Request ID Middleware
 * Adds unique ID to each request for tracking
 */
export const requestIdMiddleware = (req, res, next) => {
    req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-Id', req.id);
    next();
};

/**
 * CORS Configuration
 * Configured via environment variables
 */
export const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
            'http://localhost:5173',
            'http://localhost:3000',
        ];

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked:', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400, // 24 hours
};
