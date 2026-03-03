import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const METRICS_URL = `${API_URL}/internal/metrics`;
const POLL_INTERVAL = 15_000; // 15 s

// ── Threshold config ──────────────────────────────────────────────────────────
const THRESHOLDS = {
    stockDriftCount: { warn: 5, crit: 20 },
    OCCConflictRate: { warn: 0.05, crit: 0.2 },
    reservationSpikeRate: { warn: 0.1, crit: 0.3 },
    allocationFailureRate: { warn: 0.03, crit: 0.1 },
    transactionRetryRate: { warn: 0.05, crit: 0.15 },
    priceMismatchRate: { warn: 0.02, crit: 0.08 },
    orderIdCollisions: { warn: 1, crit: 5 },
    promotionConflicts: { warn: 3, crit: 10 },
};

const getLevel = (key, value) => {
    const t = THRESHOLDS[key];
    if (!t || value === undefined || value === null) return 'unknown';
    if (value >= t.crit) return 'critical';
    if (value >= t.warn) return 'warning';
    return 'healthy';
};

const LEVEL_COLORS = {
    healthy: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', dot: 'bg-red-500 animate-pulse', badge: 'bg-red-100 text-red-700' },
    unknown: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500' },
};

const fmt = (v) => {
    if (v === undefined || v === null) return '—';
    if (typeof v === 'number' && v < 1 && v > 0) return `${(v * 100).toFixed(2)}%`;
    return String(v);
};

const METRIC_META = [
    { key: 'stockDriftCount', label: 'Stock Drift Count', desc: 'Variants with inventory mismatches' },
    { key: 'OCCConflictRate', label: 'OCC Conflict Rate', desc: 'Optimistic concurrency conflicts / total writes' },
    { key: 'reservationSpikeRate', label: 'Reservation Spike Rate', desc: 'Flash sale reservation over-demand ratio' },
    { key: 'allocationFailureRate', label: 'Allocation Failure Rate', desc: 'Warehouse allocation failures / total allocations' },
    { key: 'transactionRetryRate', label: 'Transaction Retry Rate', desc: 'Mongo transaction retries / total attempts' },
    { key: 'priceMismatchRate', label: 'Price Mismatch Rate', desc: 'Orders with stale price vs backend price' },
    { key: 'orderIdCollisions', label: 'Order ID Collisions', desc: 'Duplicate order ID attempts (should be 0)' },
    { key: 'promotionConflicts', label: 'Promotion Conflicts', desc: 'Concurrent promotion rule conflicts' },
];

// ── Single metric card ────────────────────────────────────────────────────────
const MetricCard = ({ meta, value }) => {
    const level = getLevel(meta.key, value);
    const colors = LEVEL_COLORS[level];

    return (
        <div className={`rounded-2xl border p-5 ${colors.bg} ${colors.border} transition-all`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{meta.label}</p>
                    <p className={`text-3xl font-black font-mono ${colors.text}`}>{fmt(value)}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-snug">{meta.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${colors.badge}`}>
                        {level}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const SystemDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);
    const [uptime, setUptime] = useState(null);

    const fetchMetrics = useCallback(async () => {
        try {
            const res = await axios.get(METRICS_URL);
            const data = res.data?.data || res.data;
            setMetrics(data);
            setLastFetch(new Date());
            setError(null);
            if (data?.uptime) setUptime(data.uptime);
        } catch (err) {
            setError('Cannot reach /internal/metrics — is the backend running with this endpoint exposed?');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
        const id = setInterval(fetchMetrics, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchMetrics]);

    // ── Derived overall health ─────────────────────────────────────────────────
    const overallLevel = (() => {
        if (!metrics) return 'unknown';
        const levels = METRIC_META.map(m => getLevel(m.key, metrics[m.key]));
        if (levels.includes('critical')) return 'critical';
        if (levels.includes('warning')) return 'warning';
        return 'healthy';
    })();

    const OVERALL_COLORS = LEVEL_COLORS[overallLevel];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Observability</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Live metrics from <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">GET /internal/metrics</code>
                            {lastFetch && ` · Last updated ${lastFetch.toLocaleTimeString()}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Overall health badge */}
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase ${OVERALL_COLORS.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${OVERALL_COLORS.dot}`} />
                            {overallLevel === 'healthy' ? '✓ All Systems Healthy' : overallLevel === 'warning' ? '⚠ Warnings Detected' : '🔴 Critical Alerts'}
                        </span>
                        <button
                            onClick={fetchMetrics}
                            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ── ERROR STATE ─────────────────────────────────────── */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        ⚠️ {error}
                    </div>
                )}

                {/* ── LOADING ─────────────────────────────────────────── */}
                {loading && !error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-36 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* ── METRIC GRID ─────────────────────────────────────── */}
                {!loading && metrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {METRIC_META.map(meta => (
                            <MetricCard key={meta.key} meta={meta} value={metrics[meta.key]} />
                        ))}
                    </div>
                )}

                {/* ── UPTIME & RAW JSON ───────────────────────────────── */}
                {!loading && metrics && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Raw Metrics Payload</h3>
                            {uptime && (
                                <span className="text-xs text-gray-400 font-mono">
                                    Uptime: {Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600) / 60)}m
                                </span>
                            )}
                        </div>
                        <pre className="text-xs font-mono text-gray-500 bg-gray-50 rounded-xl p-4 overflow-x-auto max-h-60 leading-relaxed">
                            {JSON.stringify(metrics, null, 2)}
                        </pre>
                    </div>
                )}

                {/* ── THRESHOLD LEGEND ────────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Alert Thresholds</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                    <th className="pb-2 pr-6">Metric</th>
                                    <th className="pb-2 pr-6">🟡 Warning</th>
                                    <th className="pb-2">🔴 Critical</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {METRIC_META.map(meta => {
                                    const t = THRESHOLDS[meta.key];
                                    return (
                                        <tr key={meta.key} className="text-gray-600">
                                            <td className="py-2 pr-6 font-semibold text-gray-800">{meta.label}</td>
                                            <td className="py-2 pr-6 font-mono text-amber-700">{t ? fmt(t.warn) : '—'}</td>
                                            <td className="py-2 font-mono text-red-700">{t ? fmt(t.crit) : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemDashboard;
