import mongoose from 'mongoose';
import logger from '../config/logger.js';
import metrics from '../services/MetricsService.js';

/**
 * PRODUCTION-GRADE TRANSACTION WRAPPER
 * Phase 6: Distributed Failover Safety
 * 
 * Features:
 * 1. Automatic Retries for Transient Errors (Primary Step-down, VersionError)
 * 2. Exponential Backoff (50ms -> 100ms -> 200ms)
 * 3. Metrics integration for Observability
 */
export const runInTransaction = async (logic, options = {}) => {
    const {
        retries = 3,
        session: existingSession,
        readPreference = 'primary'
    } = options;

    const session = existingSession || await mongoose.startSession();
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    let attempt = 0;
    const maxRetries = 3;

    try {
        while (attempt <= maxRetries) {
            attempt++;
            metrics.inc('total_tx_attempts');

            try {
                session.startTransaction({ readPreference, writeConcern: { w: 'majority' } });

                const result = await logic(session);
                await session.commitTransaction();
                return result;

            } catch (error) {
                if (session.inTransaction()) {
                    await session.abortTransaction();
                }

                const isTransient = error.hasErrorLabel &&
                    (error.hasErrorLabel('TransientTransactionError') ||
                        error.hasErrorLabel('UnknownTransactionCommitResult'));
                const isOCC = error.name === 'VersionError';

                if ((isTransient || isOCC) && attempt <= maxRetries) {
                    const backoff = attempt === 1 ? 50 : attempt === 2 ? 100 : 200;

                    logger.warn(`[TX_RETRY] ${isOCC ? 'OCC Conflict' : 'Transient error'}, retrying... Attempt ${attempt} after ${backoff}ms`, { error: error.message });
                    metrics.inc('transaction_retry_total', { attempt: String(attempt), type: isOCC ? 'OCC' : 'TRANSIENT' });

                    await sleep(backoff);
                    continue;
                }

                logger.error(`[TX_FATAL] Transaction failed after ${attempt} attempts`, { error: error.message });
                throw error;
            }
        }
    } finally {
        if (!existingSession) {
            session.endSession();
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
