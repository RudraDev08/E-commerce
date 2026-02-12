import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};

winston.addColors(colors);

// Custom format for development
const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, requestId, ...metadata }) => {
        let msg = `${timestamp} [${level}]`;
        if (requestId) msg += ` [${requestId}]`;
        msg += `: ${message}`;

        // Add metadata if exists (but filter out sensitive data)
        const filteredMetadata = { ...metadata };
        delete filteredMetadata.password;
        delete filteredMetadata.token;
        delete filteredMetadata.authorization;

        if (Object.keys(filteredMetadata).length > 0) {
            msg += ` ${JSON.stringify(filteredMetadata)}`;
        }

        return msg;
    })
);

// Custom format for production
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Determine format based on environment
const logFormat = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;

// Create transports
const transports = [
    new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
    }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    levels,
    format: logFormat,
    transports,
    exitOnError: false,
});

// Create a stream object for Morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

export default logger;
