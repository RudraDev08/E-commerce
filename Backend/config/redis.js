import Redis from 'ioredis';

export function createRedisConnection() {
    if (process.env.DISABLE_REDIS === 'true') {
        console.warn('[Redis] Redis is disabled via environment variable.');
        return null;
    }

    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: true,
        connectTimeout: 5000,
        retryStrategy(times) {
            // In development, stop trying after 3 attempts to avoid log spam
            if (process.env.NODE_ENV === 'development' && times > 3) {
                return null; // Stop retrying
            }
            return Math.min(times * 1000, 10000);
        }
    });

    let logged = false;

    redis.on('error', (err) => {
        if (!logged) {
            console.error('[Redis] Connection error:', err.message);
            logged = true;
        }
    });

    redis.on('ready', () => {
        logged = false;
        console.log('[Redis] Connected');
    });

    return redis;
}

