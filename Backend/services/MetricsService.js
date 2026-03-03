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

        // Sliding Window for Reservation Spikes (Step 4.1)
        this.reservationWindow = [];
        this.WINDOW_MS = 30000; // 30 seconds
        this.baselineRes = 10;  // Minimum baseline to avoid noise
    }

    /** Increment a counter metric */
    inc(name, labels = {}, value = 1) {
        const key = this._serialize(name, labels);
        this.counters.set(key, (this.counters.get(key) || 0) + value);

        // Handle sliding window for reservations (Step 4.1)
        if (name === 'total_reservations') {
            const now = Date.now();
            this.reservationWindow.push(now);
            this._cleanupWindow(now);
            this._checkCircuitBreaker();
        }

        logger.info('METRIC_INCREMENT', { metric: name, labels, value });
    }

    _cleanupWindow(now) {
        this.reservationWindow = this.reservationWindow.filter(t => now - t < 30000);
    }

    _checkCircuitBreaker() {
        // Step 2: Fix Sliding Window Reservation Spike
        const currentCount = this.reservationWindow.length;

        let baseline = 10;
        const uptimeSeconds = process.uptime();
        if (uptimeSeconds > 30) {
            const totalRes = this.counters.get(this._serialize('total_reservations', {})) || 0;
            // rolling average of reservations per 30s
            baseline = Math.max(10, totalRes / (uptimeSeconds / 30));
        }

        const spikeRate = ((currentCount - baseline) / baseline) * 100;

        try {
            const mongoose = require('mongoose');
            const AlertLog = mongoose.models.AlertLog;
            const SystemState = mongoose.models.SystemState;

            if (spikeRate > 30) {
                global.systemState = global.systemState || {};
                if (!global.systemState.checkoutFrozen) {
                    global.systemState.checkoutFrozen = true;
                    global.systemState.reason = 'Reservation spike > 30%';
                    logger.error('CIRCUIT_BREAKER_TRIGGERED: Reservation spike > 30%. Checkout frozen.');
                    this.inc('circuit_breaker_trips_total');

                    if (SystemState) {
                        SystemState.findOneAndUpdate(
                            {},
                            { checkoutFrozen: true, reason: 'Reservation spike > 30%', triggeredAt: new Date() },
                            { upsert: true }
                        ).catch(() => { });
                    }
                }

                // Step 4: Prevent Alert Storms
                if (AlertLog) {
                    AlertLog.findOne({ metric: 'reservation_spike_rate', isActive: true }).then(activeAlert => {
                        if (!activeAlert) {
                            AlertLog.create({
                                metric: 'reservation_spike_rate',
                                value: spikeRate,
                                severity: 'CRITICAL',
                                threshold: 30,
                                triggeredBy: 'METRICS_ENGINE',
                                isActive: true
                            }).catch(() => { });
                        }
                    });
                }
            } else {
                // If normal, resolve active alerts
                if (AlertLog) {
                    AlertLog.updateMany(
                        { metric: 'reservation_spike_rate', isActive: true },
                        { isActive: false, resolvedAt: new Date() }
                    ).catch(() => { });
                }
            }
        } catch (e) {
            // Silent catch to prevent metrics engine from crashing the app
        }
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

    /** Helper to calculate rates safely (prevents division by zero, NaN, Infinity) */
    _calcRate(numerator, denominator) {
        if (!denominator || denominator <= 0) return 0;
        const value = numerator / denominator;
        if (!isFinite(value) || isNaN(value)) return 0;
        return Number((value * 100).toFixed(2));
    }

    /** Returns exactly the 8 metrics required for System Hardening in Prometheus text format. */
    scrape() {
        const getCounter = (name) => {
            let total = 0;
            for (const [key, val] of this.counters) {
                if (key.startsWith(`${name}|`)) total += val;
            }
            return total;
        };

        const now = Date.now();
        this._cleanupWindow(now);
        const currentCount = this.reservationWindow.length;

        let baseline = 10;
        const uptimeSeconds = process.uptime();
        if (uptimeSeconds > 30) {
            const totalRes = getCounter('total_reservations') || 0;
            baseline = Math.max(10, totalRes / (uptimeSeconds / 30));
        }

        const spikeRate = this._calcRate(Math.max(0, currentCount - baseline), baseline);

        const metricsData = {
            stock_drift_count: getCounter('stock_drift_total'),
            occ_conflict_rate: this._calcRate(
                getCounter('occ_conflict_total'),
                getCounter('total_writes')
            ),
            reservation_spike_rate: spikeRate,
            allocation_failure_rate: this._calcRate(
                getCounter('allocation_failure_total'),
                getCounter('total_allocations')
            ),
            transaction_retry_rate: this._calcRate(
                getCounter('transaction_retry_total'),
                getCounter('total_tx_attempts')
            ),
            price_mismatch_rate: this._calcRate(
                getCounter('price_mismatch_total'),
                getCounter('total_checkouts')
            ),
            order_id_collisions: getCounter('order_id_collision_attempt_total'),
            promotion_conflicts: getCounter('promotion_conflict_total'),
            checkout_frozen: global.systemState?.checkoutFrozen ? 1 : 0
        };

        return Object.entries(metricsData)
            .map(([k, v]) => `${k} ${v}`)
            .join('\n');
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
