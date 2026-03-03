import mongoose from 'mongoose';
import logger from '../config/logger.js';

/**
 * PRODUCTION-GRADE TRANSACTION WRAPPER
 * Phase 6: Distributed Failover Safety
 * 
 * Features:
 * 1. Automatic Retries for Transient Errors (Primary Step-down, Network Glitches)
 * 2. Idempotency Check integration
 * 3. Primary-preferred read-preference enforcement
 * 4. Graceful Cleanup
 */
export const runInTransaction = async (logic, options = {}) => {
    const {
        retries = 3,
        session: existingSession,
        readPreference = 'primary'
    } = options;

    const session = existingSession || await mongoose.startSession();

    let attempt = 0;
    while (attempt < retries) {
        attempt++;
        try {
            let result;
            await session.withTransaction(async (s) => {
                result = await logic(s);
            }, {
                readPreference,
                writeConcern: { w: 'majority' }
            });
            return result;

        } catch (error) {
            const isTransient = error.hasErrorLabel &&
                (error.hasErrorLabel('TransientTransactionError') ||
                    error.hasErrorLabel('UnknownTransactionCommitResult'));

            if (isTransient && attempt < retries) {
                logger.warn(`[TX_RETRY] Transient error, retrying... Attempt ${attempt}`, { error: error.message });
                continue;
            }

            // Non-transient or max retries hit
            logger.error(`[TX_FATAL] Transaction failed after ${attempt} attempts`, { error: error.message });
            throw error;
        } finally {
            if (!existingSession && attempt === retries) session.endSession();
        }
    }
};

/**
 * IDEMPOTENT TRANSACTION WRAPPER
 * Ensures a block of code only runs successfully once for a given key.
 */
export const runIdempotentTransaction = async (key, logic, options = {}) => {
    if (!key) throw new Error('IDEMPOTENCY_KEY_REQUIRED');

    return runInTransaction(async (session) => {
        // 1. Check if already processed
        // We look for the key in a global idempotency table or specific collection
        const IdempotencyKey = mongoose.model('IdempotencyKey');
        const existing = await IdempotencyKey.findOne({ key }).session(session);

        if (existing && existing.status === 'COMPLETED') {
            return { alreadyProcessed: true, response: existing.responseData };
        }

        if (existing && existing.status === 'PROCESSING') {
            throw new Error('REQUEST_IN_PROGRESS'); // OCC/Locking behavior
        }

        // 2. Mark as processing
        const auditRecord = existing || new IdempotencyKey({ key, status: 'PROCESSING' });
        auditRecord.status = 'PROCESSING';
        await auditRecord.save({ session });

        // 3. Run Logic
        const responseData = await logic(session);

        // 4. Mark as completed
        auditRecord.status = 'COMPLETED';
        auditRecord.responseData = responseData;
        await auditRecord.save({ session });

        return { alreadyProcessed: false, response: responseData };
    }, options);
};
