/**
 * Custom API Error Class
 * Extends Error with status code and error code
 */
class ApiError extends Error {
    constructor(statusCode, code, message, details = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                ...(this.details && { details: this.details }),
            },
        };
    }
}

// Predefined error creators
export class ValidationError extends ApiError {
    constructor(message = 'Validation failed', details = null) {
        super(400, 'VALIDATION_ERROR', message, details);
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized access') {
        super(401, 'UNAUTHORIZED', message);
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'Access forbidden') {
        super(403, 'FORBIDDEN', message);
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, 'NOT_FOUND', message);
    }
}

export class ConflictError extends ApiError {
    constructor(message = 'Resource conflict', details = null) {
        super(409, 'CONFLICT', message, details);
    }
}

export class InternalServerError extends ApiError {
    constructor(message = 'Internal server error') {
        super(500, 'INTERNAL_SERVER_ERROR', message);
    }
}

export default ApiError;
