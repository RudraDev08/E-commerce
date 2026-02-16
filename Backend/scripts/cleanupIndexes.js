
// ============================================================================
// Index Cleanup Script
// CRITICAL: Drops redundant wildcard text index to reduce RAM pressure
// ============================================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import logger from '../config/logger.js';

dotenv.config();

const cleanupIndexes = async () => {
    try {
        await connectDB();
        logger.info('Connected to MongoDB');

        const db = mongoose.connection.db;
        const variantCollection = db.collection('variants');

        // List current indexes
        const indexes = await variantCollection.indexes();
        logger.info('Current Indexes:', indexes.map(i => i.name));

        // Drop the problematic compound text index on filterIndex.$**
        // This index causes RAM explosion at scale
        try {
            await variantCollection.dropIndex('sku_text_filterIndex.$**_text');
            logger.info('✅ Dropped wildcard text index on filterIndex.$**');
        } catch (err) {
            if (err.code === 27) {
                logger.warn('Index does not exist - already dropped');
            } else {
                throw err;
            }
        }

        // Verify remaining indexes
        const remainingIndexes = await variantCollection.indexes();
        logger.info('Remaining Indexes:', remainingIndexes.map(i => i.name));

        // Expected indexes after cleanup:
        // 1. _id (default)
        // 2. product_1_size_1_color_1 (sparse unique)
        // 3. filterIndex.$** (wildcard for filtering)
        // 4. sku_1 (unique)
        // 5. indexedPrice_1 (for sorting)
        // 6. availableChannels_1_availableRegions_1_status_1 (segmentation)

        logger.info('✅ Index cleanup complete');
        process.exit(0);
    } catch (err) {
        logger.error('Index cleanup failed:', err);
        process.exit(1);
    }
};

cleanupIndexes();
