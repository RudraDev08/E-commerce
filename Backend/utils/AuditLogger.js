import GlobalAuditLog from '../models/Audit/GlobalAuditLog.model.js';
import logger from '../config/logger.js';

/**
 * AUDIT LOGGER UTILITY
 * Phase 8: Hardware for Flash-Sale Scale
 */
export class AuditLogger {
    /**
     * Log a sensitive action to the global audit log.
     * 
     * @param {Object} params
     * @param {string} params.userId
     * @param {string} params.action - e.g., 'PRICE_CHANGE'
     * @param {string} params.entityType - e.g., 'VariantMaster'
     * @param {string} params.entityId
     * @param {Object} [params.oldValue]
     * @param {Object} [params.newValue]
     * @param {Object} [params.req] - Express request object for context
     * @param {Object} [params.metadata]
     */
    static async log(params) {
        const {
            userId,
            action,
            entityType,
            entityId,
            oldValue,
            newValue,
            req,
            metadata = {}
        } = params;

        try {
            const auditEntry = new GlobalAuditLog({
                userId: userId || req?.user?._id || 'SYSTEM',
                action,
                entityType,
                entityId,
                oldValue,
                newValue,
                requestId: req?.id,
                ipAddress: req?.ip,
                userAgent: req?.headers?.['user-agent'],
                metadata
            });

            await auditEntry.save();
        } catch (err) {
            // CRITICAL: Audit logging failure should not crash the main process,
            // but must be logged loudly.
            logger.error('[AUDIT_LOGGER] Failed to save audit entry:', {
                error: err.message,
                action,
                entityId
            });
        }
    }
}

export default AuditLogger;
