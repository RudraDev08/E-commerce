/**
 * analytics.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/analytics/summary
 *
 * Returns a business summary using MongoDB aggregation pipelines:
 *   - totalRevenue      (sum of grandTotal on non-cancelled / non-refunded orders)
 *   - orderCount        (count of qualifying orders)
 *   - averageOrderValue (mean grandTotal)
 *   - topProducts       (top 10 SKUs by total units sold × revenue)
 *
 * Supports optional query params:
 *   ?from=YYYY-MM-DD   start of date range (default: 30 days ago)
 *   ?to=YYYY-MM-DD     end of date range   (default: now)
 */

import mongoose from 'mongoose';
import Order from '../models/Order/OrderSchema.js';
import AuditLog from '../models/Audit/AuditLog.model.js';

// Orders in these statuses are excluded from revenue calculations
const EXCLUDED_STATUSES = ['cancelled', 'refunded'];

export const getAnalyticsSummary = async (req, res) => {
    try {
        // ── Date range ────────────────────────────────────────────────────────
        const now = new Date();
        const defaultFrom = new Date(now);
        defaultFrom.setDate(defaultFrom.getDate() - 30);

        const from = req.query.from ? new Date(req.query.from) : defaultFrom;
        const to = req.query.to ? new Date(req.query.to) : now;

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date range. Use YYYY-MM-DD format.' });
        }
        if (from > to) {
            return res.status(400).json({ success: false, message: '`from` must be before `to`.' });
        }

        const dateMatch = { createdAt: { $gte: from, $lte: to } };
        const statusExclude = { status: { $nin: EXCLUDED_STATUSES } };

        // ── 1. Revenue & order count aggregation ──────────────────────────────
        const [revenueResult] = await Order.aggregate([
            { $match: { ...dateMatch, ...statusExclude } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$financials.grandTotal' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        const totalRevenue = revenueResult?.totalRevenue ?? 0;
        const orderCount = revenueResult?.orderCount ?? 0;
        const averageOrderValue = orderCount > 0
            ? parseFloat((totalRevenue / orderCount).toFixed(2))
            : 0;

        // ── 2. Top products aggregation ───────────────────────────────────────
        const topProducts = await Order.aggregate([
            { $match: { ...dateMatch, ...statusExclude } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: {
                        productId: '$items.productId',
                        sku: '$items.sku',
                        name: '$items.productName'
                    },
                    totalUnitsSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    productId: '$_id.productId',
                    sku: '$_id.sku',
                    name: '$_id.name',
                    totalUnitsSold: 1,
                    totalRevenue: 1,
                    orderCount: 1
                }
            }
        ]);

        // ── 3. Revenue by day (sparkline data) ────────────────────────────────
        const dailyRevenue = await Order.aggregate([
            { $match: { ...dateMatch, ...statusExclude } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    revenue: { $sum: '$financials.grandTotal' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    revenue: 1,
                    orders: 1
                }
            }
        ]);

        return res.json({
            success: true,
            data: {
                period: {
                    from: from.toISOString().slice(0, 10),
                    to: to.toISOString().slice(0, 10)
                },
                summary: {
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    orderCount,
                    averageOrderValue
                },
                topProducts,
                dailyRevenue
            }
        });
    } catch (error) {
        console.error('[Analytics] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/analytics/admin-activity ──────────────────────────────────────
export const getAdminActivityAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const defaultFrom = new Date(now);
        defaultFrom.setHours(now.getHours() - 24); // Default to last 24 hours

        const from = req.query.from ? new Date(req.query.from) : defaultFrom;
        const to = req.query.to ? new Date(req.query.to) : now;

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date range.' });
        }

        const dateMatch = { createdAt: { $gte: from, $lte: to } };

        // 1. Recent Actions List (last 50)
        const recentActions = await AuditLog.find(dateMatch)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // 2. Failed Login Attempts
        const failedLogins = await AuditLog.countDocuments({
            ...dateMatch,
            action: 'LOGIN',
            'after.status': 'FAILED'
        });

        // 3. Inventory Adjustments
        const inventoryAdjustments = await AuditLog.countDocuments({
            ...dateMatch,
            action: 'STOCK_ADJUST'
        });

        // 4. Refund Approvals
        const refundApprovals = await AuditLog.countDocuments({
            ...dateMatch,
            action: 'REFUND'
        });

        // 5. Action Breakdown (for pie chart)
        const actionBreakdown = await AuditLog.aggregate([
            { $match: dateMatch },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        return res.json({
            success: true,
            data: {
                period: {
                    from: from.toISOString(),
                    to: to.toISOString()
                },
                metrics: {
                    failedLogins,
                    inventoryAdjustments,
                    refundApprovals,
                    totalActions: await AuditLog.countDocuments(dateMatch)
                },
                actionBreakdown,
                recentActions
            }
        });
    } catch (error) {
        console.error('[Analytics] Admin activity error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
