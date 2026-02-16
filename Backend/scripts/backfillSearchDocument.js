// ============================================================================
// SearchDocument Backfill Script - Production-Hardened
// ============================================================================
// CRITICAL FIXES:
// 1. Atomic checkpoint writes (crash-safe)
// 2. Memory-safe cursor pagination
// 3. Restart-safe via CheckpointManager
// ============================================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Variant from '../models/variant/variantSchema.js';
import VariantService from '../services/VariantService.js';
import connectDB from '../config/db.js';
import logger from '../config/logger.js';
import CheckpointManager from '../utils/CheckpointManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHECKPOINT_PATH = path.join(__dirname, '.backfill_checkpoint.json');
const BATCH_SIZE = 1000;

const checkpoint = new CheckpointManager(CHECKPOINT_PATH);

/**
 * Main Backfill Logic
 */
async function backfillSearchDocument() {
    try {
        await connectDB();
        logger.info('✅ Connected to MongoDB');

        const checkpointData = checkpoint.load();
        let { lastProcessedId, processedCount } = checkpointData;

        logger.info('Starting Backfill', {
            resuming: !!lastProcessedId,
            alreadyProcessed: processedCount
        });

        // Get total count for progress tracking
        const totalCount = await Variant.countDocuments({});
        logger.info(`Total Variants: ${totalCount}`);

        let hasMore = true;
        let batchNumber = 0;
        const startTime = Date.now();

        while (hasMore) {
            batchNumber++;

            // Build cursor query
            const query = lastProcessedId
                ? { _id: { $gt: lastProcessedId } }
                : {};

            // Fetch batch with cursor
            const variants = await Variant.find(query)
                .populate('product')
                .populate('variantAttributes.attributeValue')
                .sort({ _id: 1 })
                .limit(BATCH_SIZE)
                .lean(); // Memory efficiency

            if (variants.length === 0) {
                hasMore = false;
                break;
            }

            // Process batch
            let successCount = 0;
            let errorCount = 0;

            for (const variantData of variants) {
                try {
                    // Reconstruct Mongoose document
                    const variant = new Variant(variantData);
                    variant.product = variantData.product;
                    variant.variantAttributes = variantData.variantAttributes;

                    await VariantService.processSearchDocumentSync(variant._id);
                    successCount++;
                    processedCount++;

                } catch (err) {
                    errorCount++;
                    logger.error('Sync Failed for Variant', {
                        variantId: variantData._id,
                        sku: variantData.sku,
                        error: err.message
                    });
                }
            }

            // Update checkpoint (ATOMIC)
            lastProcessedId = variants[variants.length - 1]._id;
            checkpoint.save({ lastProcessedId, processedCount });

            // Progress logging
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            const rate = (processedCount / elapsed).toFixed(2);
            const progress = ((processedCount / totalCount) * 100).toFixed(2);

            logger.info(`Batch ${batchNumber} Complete`, {
                processed: processedCount,
                total: totalCount,
                progress: `${progress}%`,
                rate: `${rate} docs/sec`,
                success: successCount,
                errors: errorCount,
                elapsed: `${elapsed}s`
            });

            // Memory cleanup
            if (batchNumber % 10 === 0) {
                if (global.gc) {
                    global.gc();
                    logger.debug('Manual GC triggered');
                }
            }
        }

        // Completion
        const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info('✅ Backfill Complete', {
            totalProcessed: processedCount,
            totalTime: `${totalElapsed}s`,
            avgRate: `${(processedCount / totalElapsed).toFixed(2)} docs/sec`
        });

        checkpoint.clear();
        process.exit(0);

    } catch (err) {
        logger.error('Backfill Failed', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    }
}

// Run backfill
backfillSearchDocument();
