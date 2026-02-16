// ============================================================================
// SearchDocument Sync Retry Worker - Background Job
// ============================================================================
// CRITICAL: Processes failed SearchDocument syncs from Redis queue
// Runs every 5 seconds with exponential backoff and dead-letter queue
// ============================================================================

import Redis from 'ioredis';
import VariantService from '../services/VariantService.js';
import logger from '../config/logger.js';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const SEARCH_SYNC_QUEUE = 'search_sync_queue';
const SEARCH_SYNC_DLQ = 'search_sync_dlq';  // Dead Letter Queue
const MAX_RETRIES = 5;
const BATCH_SIZE = 10;

class SearchSyncWorker {
    constructor() {
        this.isRunning = false;
        this.processedCount = 0;
        this.errorCount = 0;
    }

    /**
     * Start Worker (Run Every 5 Seconds)
     */
    start() {
        if (this.isRunning) {
            logger.warn('SearchSyncWorker already running');
            return;
        }

        this.isRunning = true;
        logger.info('SearchSyncWorker Started');

        this.intervalId = setInterval(async () => {
            await this.processBatch();
        }, 5000);

        // Graceful shutdown
        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());
    }

    /**
     * Stop Worker
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            logger.info('SearchSyncWorker Stopped', {
                processed: this.processedCount,
                errors: this.errorCount
            });
        }
    }

    /**
     * Process Batch from Queue
     */
    async processBatch() {
        try {
            // Pop up to BATCH_SIZE items from queue
            const items = await redis.rpop(SEARCH_SYNC_QUEUE, BATCH_SIZE);

            if (!items || items.length === 0) {
                return;
            }

            logger.debug('Processing SearchSync Batch', { count: items.length });

            for (const item of items) {
                await this.processItem(item);
            }

        } catch (err) {
            logger.error('SearchSync Batch Processing Failed', {
                error: err.message
            });
        }
    }

    /**
     * Process Single Item
     */
    async processItem(itemJson) {
        let item;

        try {
            item = JSON.parse(itemJson);
        } catch (err) {
            logger.error('Invalid JSON in Queue', { itemJson });
            return;
        }

        const { variantId, retries = 0, timestamp } = item;

        try {
            // Process sync
            await VariantService.processSearchDocumentSync(variantId);

            this.processedCount++;

            logger.debug('SearchDocument Synced', {
                variantId,
                retries,
                queueTime: Date.now() - timestamp
            });

        } catch (err) {
            this.errorCount++;

            // Exponential backoff
            const nextRetry = retries + 1;

            if (nextRetry >= MAX_RETRIES) {
                // Move to Dead Letter Queue
                await redis.lpush(SEARCH_SYNC_DLQ, JSON.stringify({
                    variantId,
                    retries: nextRetry,
                    timestamp,
                    error: err.message,
                    failedAt: Date.now()
                }));

                logger.error('SearchDocument Sync Failed - Moved to DLQ', {
                    variantId,
                    retries: nextRetry,
                    error: err.message
                });

            } else {
                // Re-queue with incremented retry count
                const delay = Math.min(1000 * Math.pow(2, nextRetry), 30000);  // Max 30s

                setTimeout(async () => {
                    await redis.lpush(SEARCH_SYNC_QUEUE, JSON.stringify({
                        variantId,
                        retries: nextRetry,
                        timestamp
                    }));
                }, delay);

                logger.warn('SearchDocument Sync Failed - Retrying', {
                    variantId,
                    retries: nextRetry,
                    nextRetryIn: `${delay}ms`,
                    error: err.message
                });
            }
        }
    }

    /**
     * Get Worker Stats
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            processedCount: this.processedCount,
            errorCount: this.errorCount
        };
    }

    /**
     * Retry Items from Dead Letter Queue (Manual Recovery)
     */
    async retryDLQ(limit = 100) {
        const items = await redis.rpop(SEARCH_SYNC_DLQ, limit);

        if (!items || items.length === 0) {
            logger.info('DLQ is empty');
            return 0;
        }

        for (const item of items) {
            const parsed = JSON.parse(item);

            // Reset retry count and re-queue
            await redis.lpush(SEARCH_SYNC_QUEUE, JSON.stringify({
                variantId: parsed.variantId,
                retries: 0,
                timestamp: Date.now()
            }));
        }

        logger.info('DLQ Items Re-queued', { count: items.length });
        return items.length;
    }

    /**
     * Clear Dead Letter Queue
     */
    async clearDLQ() {
        const count = await redis.llen(SEARCH_SYNC_DLQ);
        await redis.del(SEARCH_SYNC_DLQ);
        logger.info('DLQ Cleared', { count });
        return count;
    }

    /**
     * Get Queue Lengths
     */
    async getQueueLengths() {
        const [mainQueue, dlq] = await Promise.all([
            redis.llen(SEARCH_SYNC_QUEUE),
            redis.llen(SEARCH_SYNC_DLQ)
        ]);

        return {
            mainQueue,
            dlq,
            total: mainQueue + dlq
        };
    }
}

// Singleton instance
const worker = new SearchSyncWorker();

export default worker;

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    worker.start();

    logger.info('SearchSyncWorker Running in Standalone Mode');

    // Log stats every 60 seconds
    setInterval(async () => {
        const stats = worker.getStats();
        const queueLengths = await worker.getQueueLengths();

        logger.info('SearchSyncWorker Stats', {
            ...stats,
            ...queueLengths
        });
    }, 60000);
}
