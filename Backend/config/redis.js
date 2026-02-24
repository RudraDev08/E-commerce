import Redis from 'ioredis';

export function createRedisConnection() {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,  // Required for BullMQ
        enableReadyCheck: true,
        connectTimeout: 10000,
        retryStrategy(times) {
            return Math.min(times * 1000, 10000); // Gradual retry
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
