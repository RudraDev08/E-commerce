import logger from '../config/logger.js';

/**
 * HYPERSCALE METRICS ENGINE
 * Phase 6: Observability Upgrade
 *
 * Formats: JSON for ELK/Prometheus scrapers
 * Thresholds: Default triggers for alerts
 *
 * Push to:
 *   - Prometheus: expose /metrics endpoint (pull model)
 *   - ELK: structured JSON via logger
 *   - DataDog: via DD_AGENT or logger transport
 */
class MetricsService {
    constructor() {
        this.counters = new Map();
        this.histograms = new Map();
        this.gauges = new Map();
    }

    /** Increment a counter metric */
    inc(name, labels = {}, value = 1) {
        const key = this._serialize(name, labels);
        this.counters.set(key, (this.counters.get(key) || 0) + value);
        logger.info('METRIC_INCREMENT', { metric: name, labels, value });
    }

    /** Observe a value for a distribution (Latency, p95, etc.) */
    observe(name, value, labels = {}) {
        logger.info('METRIC_OBSERVE', { metric: name, labels, value });
    }

    /** Set a gauge value (current state, not cumulative) */
    gauge(name, value, labels = {}) {
        const key = this._serialize(name, labels);
        this.gauges.set(key, value);
        logger.info('METRIC_GAUGE', { metric: name, labels, value });
    }

    _serialize(name, labels) {
        return `${name}|${JSON.stringify(labels)}`;
    }

    // ─────────────────────────────────────────────────────────────────────
    // 🟢 Standardized System Metrics
    // ─────────────────────────────────────────────────────────────────────

    /** Price mismatch at checkout (client price ≠ server resolvedPrice) */
    trackPriceMismatch(variantId) {
        this.inc('price_mismatch_total', { variantId: String(variantId), severity: 'WARN' });
    }

    /** Optimistic Concurrency Control conflict on a given entity */
    trackOCCConflict(entity) {
        this.inc('occ_conflict_total', { entity });
    }

    /** Attempt to deduct stock below zero — critical corruption attempt */
    trackInventoryNegative(variantId) {
        this.inc('inventory_negative_attempt_total', { variantId: String(variantId) }, 1);
    }

    /** Duplicate event replayed (event ID already in EventStore) */
    trackEventReplay(eventId) {
        this.inc('event_replay_total', { eventId });
    }

    /** Inventory drift detected in ReconciliationEngine scan */
    trackStockDrift(sku, amount) {
        this.inc('stock_drift_total', { sku }, amount);
    }

    /** Redis reservation failure (insufficient stock or Redis unavailable) */
    trackReservationFailure(reason) {
        this.inc('reservation_failure_total', { reason });
    }

    // ─── NEW: Missing Metrics from Phase 6 Audit ──────────────────────────

    /** Order ID collision detected (findOne+sort pattern would have duplicated) */
    trackOrderIdCollisionAttempt() {
        this.inc('order_id_collision_attempt_total', { severity: 'CRITICAL' });
    }

    /** MongoDB transaction retried due to TransientTransactionError */
    trackTransactionRetry(operation, attempt) {
        this.inc('transaction_retry_total', { operation, attempt: String(attempt) });
    }

    /** Reservation request spike above threshold (flash-sale traffic spike) */
    trackReservationSpike(variantId, rps) {
        this.inc('reservation_spike_total', { variantId: String(variantId) });
        this.gauge('reservation_rps_current', rps, { variantId: String(variantId) });
    }

    /** Promotion rule conflict (two non-stackable promos applied, one discarded) */
    trackPromotionConflict(promotionId, winnerId) {
        this.inc('promotion_conflict_total', {
            discarded: String(promotionId),
            winner: String(winnerId),
        });
    }

    /** Warehouse allocation failure (insufficient stock in selected warehouse) */
    trackAllocationFailure(warehouseId, variantId) {
        this.inc('allocation_failure_total', {
            warehouseId: String(warehouseId),
            variantId: String(variantId),
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 📤 Prometheus-compatible scrape output
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Returns all counters in Prometheus text exposition format.
     * Mount this on GET /metrics in a separate internal port.
     */
    scrape() {
        const lines = [];
        for (const [key, value] of this.counters) {
            const [name] = key.split('|');
            lines.push(`# TYPE ${name} counter`);
            lines.push(`${name} ${value}`);
        }
        for (const [key, value] of this.gauges) {
            const [name] = key.split('|');
            lines.push(`# TYPE ${name} gauge`);
            lines.push(`${name} ${value}`);
        }
        return lines.join('\n');
    }

    /** Returns all metrics as a plain JSON object for ELK/DataDog */
    toJSON() {
        const result = {};
        for (const [key, value] of this.counters) {
            result[key] = value;
        }
        for (const [key, value] of this.gauges) {
            result[key] = value;
        }
        return result;
    }
}

const metrics = new MetricsService();
export default metrics;

/**
 * ALERT THRESHOLDS (Logical Definitions for Monitoring Team)
 *
 * Metric                             | Threshold         | Severity
 * -----------------------------------|-------------------|----------
 * price_mismatch_total               | > 50 / 1min       | CRITICAL  → Flash-sale pricing attack or sync failure
 * occ_conflict_total                 | > 500 / 1min      | WARNING   → DB hotspot detected
 * inventory_negative_attempt_total   | > 0               | CRITICAL  → Data corruption attempt
 * event_replay_total                 | > 10% of events   | WARNING   → Idempotency keys saving us, infra looping
 * stock_drift_total                  | > 0               | WARNING   → Reconciliation needed
 * reservation_failure_total          | > 100 / 1s        | CRITICAL  → Flash sale inventory exhausted
 * order_id_collision_attempt_total   | > 0               | CRITICAL  → Counter collision (should never happen)
 * transaction_retry_total            | > 1000 / 1min     | WARNING   → Mongo contention spike
 * reservation_spike_total            | > 5000 / 1min     | WARNING   → Flash sale traffic spike
 * promotion_conflict_total           | > 100 / 1min      | WARNING   → Promotion rule misconfiguration
 * allocation_failure_total           | > 0               | WARNING   → Warehouse stock mismatch
 */
