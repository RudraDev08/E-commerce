import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../Api/orderApi.js';
import toast from 'react-hot-toast';

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
    PROCESSING: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
    SHIPPED: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
    DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
    REFUNDED: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' },
};

const PAYMENT_STYLES = {
    PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700' },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700' },
    REFUNDED: { bg: 'bg-gray-50', text: 'text-gray-600' },
};

const StatusBadge = ({ status, map = STATUS_STYLES }) => {
    const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
            {status?.replace(/_/g, ' ')}
        </span>
    );
};

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '—';

// ── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
    { key: 'orderId', label: 'Order ID', width: 'w-[160px]' },
    { key: 'customer', label: 'Customer', width: 'w-[180px]' },
    { key: 'items', label: 'Items', width: 'w-[80px]' },
    { key: 'total', label: 'Total', width: 'w-[120px]' },
    { key: 'payment', label: 'Payment', width: 'w-[110px]' },
    { key: 'fulfillment', label: 'Status', width: 'w-[130px]' },
    { key: 'warehouse', label: 'Allocation', width: 'w-[160px]' },
    { key: 'createdAt', label: 'Placed', width: 'w-[160px]' },
    { key: 'actions', label: '', width: 'w-[80px]' },
];

const FULFILLMENT_FILTERS = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_FILTERS = ['', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'];

// ── Main Component ────────────────────────────────────────────────────────────
const OrderListPage = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [fulfillFilter, setFulfillFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const PAGE_SIZE = 20;

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: PAGE_SIZE,
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(fulfillFilter && { status: fulfillFilter }),
                ...(paymentFilter && { paymentStatus: paymentFilter }),
            };
            const res = await orderAPI.getAll(params);
            const data = res.data;
            setOrders(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalItems(data.pagination?.total || 0);
        } catch (err) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, fulfillFilter, paymentFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Reset to page 1 on filter change
    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, fulfillFilter, paymentFilter]);

    // ── Pagination helper ─────────────────────────────────────────────────────
    const paginationPages = () => {
        const pages = [];
        const delta = 2;
        for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Management</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {totalItems.toLocaleString()} total orders · Server-side pagination
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 mt-8 space-y-4">

                {/* ── FILTERS BAR ────────────────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by Order ID or customer name…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>

                    {/* Fulfillment filter */}
                    <select
                        value={fulfillFilter}
                        onChange={e => setFulfillFilter(e.target.value)}
                        className="py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        {FULFILLMENT_FILTERS.map(f => (
                            <option key={f} value={f}>{f || 'All Statuses'}</option>
                        ))}
                    </select>

                    {/* Payment filter */}
                    <select
                        value={paymentFilter}
                        onChange={e => setPaymentFilter(e.target.value)}
                        className="py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        {PAYMENT_FILTERS.map(f => (
                            <option key={f} value={f}>{f || 'All Payments'}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchOrders}
                        className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {/* ── TABLE ──────────────────────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {COLUMNS.map(col => (
                                        <th key={col.key} className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${col.width}`}>
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    [...Array(8)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {COLUMNS.map(col => (
                                                <td key={col.key} className="px-4 py-4">
                                                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLUMNS.length} className="px-6 py-20 text-center text-sm text-gray-400">
                                            No orders found
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map(order => {
                                        // Warehouse allocation summary
                                        const whSummary = (() => {
                                            const whs = new Map();
                                            (order.items || []).forEach(item => {
                                                (item.warehouseAllocations || []).forEach(wa => {
                                                    const name = wa.warehouseCode || wa.warehouseId?.code || 'WH';
                                                    whs.set(name, (whs.get(name) || 0) + (wa.quantity || 0));
                                                });
                                            });
                                            return [...whs.entries()];
                                        })();

                                        return (
                                            <tr
                                                key={order._id}
                                                className="hover:bg-indigo-50/30 cursor-pointer transition-colors"
                                                onClick={() => navigate(`/orders/${order._id}`)}
                                            >
                                                {/* Order ID */}
                                                <td className="px-4 py-4">
                                                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                                                        {order.orderId || order._id?.slice(-8).toUpperCase()}
                                                    </span>
                                                </td>

                                                {/* Customer */}
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                                                        {order.shippingAddress?.fullName || order.userId?.name || '—'}
                                                    </div>
                                                    <div className="text-xs text-gray-400 truncate max-w-[160px]">
                                                        {order.shippingAddress?.email || order.userId?.email || ''}
                                                    </div>
                                                </td>

                                                {/* Items */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-sm font-semibold text-gray-700">{order.items?.length || 0}</span>
                                                </td>

                                                {/* Total */}
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-bold text-gray-900">{fmt(order.totalAmount)}</span>
                                                </td>

                                                {/* Payment */}
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={order.paymentStatus} map={PAYMENT_STYLES} />
                                                </td>

                                                {/* Fulfillment */}
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={order.status} />
                                                </td>

                                                {/* Warehouse allocation summary */}
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {whSummary.length > 0 ? (
                                                            whSummary.map(([wh, qty]) => (
                                                                <span key={wh} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
                                                                    {wh}:<span className="text-indigo-600">{qty}</span>
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Unallocated</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Created at */}
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-gray-500">{fmtDate(order.createdAt)}</span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => navigate(`/orders/${order._id}`)}
                                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                                    >
                                                        View →
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── PAGINATION ─────────────────────────────────────── */}
                    {!loading && orders.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <p className="text-sm text-gray-500">
                                Showing <strong>{((currentPage - 1) * PAGE_SIZE) + 1}</strong>–<strong>{Math.min(currentPage * PAGE_SIZE, totalItems)}</strong> of <strong>{totalItems}</strong> orders
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Prev
                                </button>
                                {paginationPages().map(pg => (
                                    <button
                                        key={pg}
                                        onClick={() => setCurrentPage(pg)}
                                        className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${currentPage === pg
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pg}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderListPage;
