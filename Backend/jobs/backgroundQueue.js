import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redisClient.js';
import logger from '../config/logger.js';
import eventBus, { Events } from '../events/eventBus.js';

const connection = redisClient;

// ── Define Queues ─────────────────────────────────────────────────────────────
export const backgroundQueue = connection ? new Queue('background-jobs', { connection }) : null;

// ── Job Producers ─────────────────────────────────────────────────────────────
export const JobTypes = {
    PRODUCT_IMPORT: 'PRODUCT_IMPORT',
    INVENTORY_RECONCILIATION: 'INVENTORY_RECONCILIATION',
    ANALYTICS_AGGREGATION: 'ANALYTICS_AGGREGATION',
    EMAIL_NOTIFICATION: 'EMAIL_NOTIFICATION',
    IMAGE_PROCESSING: 'IMAGE_PROCESSING'
};

export async function addJob(jobType, data, options = {}) {
    if (!backgroundQueue) {
        logger.debug(`[BullMQ] Redis disabled, skipping job ${jobType}.`);
        return;
    }
    try {
        await backgroundQueue.add(jobType, data, {
            removeOnComplete: true,
            removeOnFail: false,
            ...options
        });
        logger.info(`[BullMQ] Added job ${jobType} to queue.`);
    } catch (err) {
        logger.error(`[BullMQ] Failed to add job ${jobType}`, err);
    }
}

// ── Worker ────────────────────────────────────────────────────────────────────
export function startBackgroundWorker() {
    if (!connection) {
        logger.warn('[BullMQ] Redis disabled, background worker not starting.');
        return;
    }

    const worker = new Worker('background-jobs', async (job) => {
        logger.info(`[Worker] Started processing job ${job.name} (ID: ${job.id})`);

        switch (job.name) {
            case JobTypes.PRODUCT_IMPORT:
                // Handle product import logic here
                logger.debug(`Processing product import`, job.data);
                break;
            case JobTypes.INVENTORY_RECONCILIATION:
                // Heavy inventory logic here
                logger.debug(`Processing inventory reconciliation`, job.data);
                break;
            case JobTypes.ANALYTICS_AGGREGATION:
                // Aggregation
                logger.debug(`Processing analytics aggregation`, job.data);
                break;
            case JobTypes.EMAIL_NOTIFICATION:
                // Email sending
                logger.debug(`Processing email notification`, job.data);
                break;
            case JobTypes.IMAGE_PROCESSING:
                // Image processing
                logger.debug(`Processing image`, job.data);
                break;
            default:
                logger.warn(`[Worker] Unknown job type: ${job.name}`);
        }
    }, { connection, concurrency: 5 });

    worker.on('completed', (job) => {
        logger.info(`[Worker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[Worker] Job ${job.id} failed with error ${err.message}`);
    });

    logger.info('[Worker] Background worker started and listening for jobs.');
}

// ── Event Bus to Job Queue Bridge ─────────────────────────────────────────────
// Map events to jobs or handle them asynchronously.
eventBus.on(Events.OrderPlaced, (payload) => {
    addJob(JobTypes.EMAIL_NOTIFICATION, { type: 'ORDER_CONFIRMATION', data: payload });
});

eventBus.on(Events.RefundIssued, (payload) => {
    addJob(JobTypes.EMAIL_NOTIFICATION, { type: 'REFUND_PROCESSED', data: payload });
});

eventBus.on(Events.ProductUpdated, (payload) => {
    addJob(JobTypes.ANALYTICS_AGGREGATION, { type: 'PRODUCT_UPDATED', data: payload });
});

eventBus.on(Events.InventoryAdjusted, (payload) => {
    addJob(JobTypes.INVENTORY_RECONCILIATION, { type: 'INVENTORY_ADJUSTED', data: payload });
});
