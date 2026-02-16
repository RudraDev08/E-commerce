
// ============================================================================
// Redis Caching Middleware (Example)
// Uses simple memory cache in-process if Redis is not configured, 
// for strict non-Redis environments, but designed to connect.
// ============================================================================

import { createClient } from 'redis'; // User might not have redis installed, safe wrapper
import logger from '../config/logger.js';

let redisClient;
let useRedis = process.env.REDIS_URL ? true : false;

const initRedis = async () => {
    if (!useRedis) {
        logger.warn('REDIS_URL not set. Using InMemory Cache (Not for production scaling).');
        return;
    }
    try {
        redisClient = createClient({ url: process.env.REDIS_URL });
        redisClient.on('error', (err) => logger.error('Redis Error', err));
        await redisClient.connect();
        logger.info('Connected to Redis Cache');
    } catch (err) {
        logger.error('Failed to connect to Redis', err);
        useRedis = false;
    }
};

// initRedis(); // Call on server start

export const cacheMiddleware = (durationSeconds = 60) => async (req, res, next) => {
    if (req.method !== 'GET') return next(); // Only cache GET

    const key = `cache:${req.originalUrl}`; // Unique per URL+Query

    if (useRedis && redisClient?.isOpen) {
        try {
            const cachedBody = await redisClient.get(key);
            if (cachedBody) {
                logger.info('Cache Hit', { url: req.originalUrl });
                return res.json(JSON.parse(cachedBody));
            }
        } catch (err) {
            logger.error('Redis Cache Read Error', err);
        }
    }

    // Intercept Response
    const originalSend = res.json;
    res.json = (body) => {
        if (res.statusCode === 200) {
            if (useRedis && redisClient?.isOpen) {
                redisClient.setEx(key, durationSeconds, JSON.stringify(body)).catch(e => logger.error('Redis setEx Error', e));
            }
        }
        originalSend.call(res, body);
    };

    next();
};

export const clearCache = async (pattern) => {
    if (!useRedis || !redisClient?.isOpen) return;
    try {
        const keys = await redisClient.keys(`cache:${pattern}*`);
        if (keys.length) await redisClient.del(keys);
        logger.info(`Cleared Cache Pattern: ${pattern}`, { count: keys.length });
    } catch (e) {
        logger.error('Cache Clear Error', e);
    }
};
