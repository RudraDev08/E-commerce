import { Queue } from 'bullmq';
import Redis from 'ioredis';
import logger from '../../config/logger.js';

import { createRedisConnection } from '../../config/redis.js';

const connection = createRedisConnection();

export const variantGenerationQueue = new Queue('variant-generation', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true, // Keep clean
        removeOnFail: false     // Keep failed for inspection
    }
});

// Event listeners for reporting
variantGenerationQueue.on('error', (err) => {
    // Only log if not already completely suppressed above
});

// FIX PROMPT 7 — Add Queue Health Monitor
setInterval(async () => {
    try {
        const counts = await variantGenerationQueue.getJobCounts();
        logger.info('[QueueHealth]', counts);

        if (counts.failed > 50) {
            logger.error('Queue failure spike detected: more than 50 failed jobs in variant-generation queue');
        }
    } catch (err) {
        logger.warn('[QueueHealth] Monitor failed to fetch counts', { error: err.message });
    }
}, 60000);
