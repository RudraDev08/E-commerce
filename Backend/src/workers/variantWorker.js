import { Worker } from 'bullmq';
import Redis from 'ioredis';
import logger from '../../config/logger.js';
import { generateVariantDimensions } from '../../services/variantDimension.service.js';

import { createRedisConnection } from '../../config/redis.js';

const connection = createRedisConnection();
export const variantGenerationWorker = new Worker('variant-generation', async job => {
    logger.info(`[VariantWorker] Processing job ${job.id} for productGroup ${job.data.productGroupId} | Attempt ${job.attemptsMade + 1}`);

    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 5 * 60 * 1000);

    try {
        await job.updateProgress(5);

        // Let the service handle generation and insertion
        const result = await generateVariantDimensions({
            ...job.data,
            _job: job,
            signal
        });

        clearTimeout(timeoutId);
        await job.updateProgress(100);
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        logger.error(`[VariantWorker] Job ${job.id} failed`, { error: error.message });
        throw error; // Let BullMQ handle retries
    }
}, {
    connection,
    concurrency: 3,      // FIX PROMPT 2: reduced for CPU safety
    lockDuration: 60000,   // prevent stalled resurrection
    stalledInterval: 30000,
    maxStalledCount: 1     // prevent infinite stalled loops
});

variantGenerationWorker.on('completed', job => {
    logger.info(`[VariantWorker] Job ${job.id} has completed!`);
});

variantGenerationWorker.on('failed', async (job, err) => {
    logger.error(`[VariantWorker] Job ${job.id} failed permanently`, { error: err.message });
});

variantGenerationWorker.on('error', (err) => {
    // Suppress repeated Redis connection errors
});
