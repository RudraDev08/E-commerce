import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../Api/orderApi.js';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => d ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '—';

// ── Legal state machine (mirrors backend) ─────────────────────────────────────
const VALID_TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
};

const STATUS_CLASSES = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    PROCESSING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    SHIPPED: 'bg-violet-100 text-violet-800 border-violet-200',
    DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    REFUNDED: 'bg-gray-100 text-gray-600 border-gray-200',
    PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
};

const StatusPill = ({ status }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_CLASSES[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
        {status?.replace(/_/g, ' ')}
    </span>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, children, badge }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h3>
            {badge}
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// ── Confirm modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, onConfirm, onClose, variant = 'danger', loading }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6">
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm text-gray-500">{message}</p>
            </div>
            <div className="px-6 py-5 flex justify-end gap-3 mt-4">
                <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {loading ? 'Processing…' : 'Confirm'}
                </button>
            </div>
        </div>
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const OrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirm, setConfirm] = useState(null); // { title, message, onConfirm, variant }
    const [refundModal, setRefundModal] = useState(null); // { lineItemId, maxQty, sku }
    const [refundQty, setRefundQty] = useState(1);
    const [cancelReason, setCancelReason] = useState('');

    const fetchOrder = useCallback(async () => {
        setLoading(true);
        try {
            const res = await orderAPI.getById(orderId);
            setOrder(res.data.data || res.data);
        } catch (err) {
            toast.error('Failed to load order');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => { fetchOrder(); }, [fetchOrder]);

    // ── Status transition handler ─────────────────────────────────────────────
    const handleStatusChange = (newStatus) => {
        const allowed = VALID_TRANSITIONS[order?.status] || [];
        if (!allowed.includes(newStatus)) {
            return toast.error(`Cannot transition from ${order?.status} → ${newStatus}`);
        }

        setConfirm({
            title: `Mark as ${newStatus}?`,
            message: `Order #${order?.orderId} will be updated to ${newStatus}. This cannot be automatically reversed.`,
            variant: newStatus === 'CANCELLED' ? 'danger' : 'primary',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await orderAPI.updateStatus(orderId, newStatus);
                    toast.success(`Order marked as ${newStatus}`);
                    await fetchOrder();
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Status update failed');
                } finally {
                    setActionLoading(false);
                    setConfirm(null);
                }
            }
        });
    };

    // ── Cancel handler ────────────────────────────────────────────────────────
    const handleCancel = () => {
        const allowed = VALID_TRANSITIONS[order?.status] || [];
        if (!allowed.includes('CANCELLED')) {
            return toast.error(`Order in ${order?.status} cannot be cancelled`);
        }
        setConfirm({
            title: 'Cancel Order?',
            message: 'This will cancel the order and release inventory reservations. Provide a reason above.',
            variant: 'danger',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await orderAPI.cancel(orderId, cancelReason || 'Admin cancelled');
                    toast.success('Order cancelled');
                    await fetchOrder();
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Cancel failed');
                } finally {
                    setActionLoading(false);
                    setConfirm(null);
                }
            }
        });
    };

    // ── Refund handler ────────────────────────────────────────────────────────
    const handleRefund = async () => {
        if (!refundModal) return;
        setActionLoading(true);
        try {
            await orderAPI.refundItem(orderId, refundModal.lineItemId, refundQty);
            toast.success(`Refunded ${refundQty} × ${refundModal.sku}`);
            setRefundModal(null);
            await fetchOrder();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Refund failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Order not found</p>
                    <button onClick={() => navigate('/orders')} className="text-indigo-600 hover:underline text-sm font-semibold">
                        ← Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const allowedNext = VALID_TRANSITIONS[order.status] || [];
    const canCancel = allowedNext.includes('CANCELLED');
    const canRefund = order.status === 'DELIVERED' || order.paymentStatus === 'PAID';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900">
                                    Order <span className="font-mono text-indigo-700">{order.orderId}</span>
                                </h1>
                                <StatusPill status={order.status} />
                                <StatusPill status={order.paymentStatus} />
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5">Placed {fmtDate(order.createdAt)}</p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {allowedNext.filter(s => s !== 'CANCELLED').map(s => (
                            <button
                                key={s}
                                onClick={() => handleStatusChange(s)}
                                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                            >
                                Mark {s}
                            </button>
                        ))}
                        {canCancel && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── LEFT: Order Items + Billing ─────────────────────────── */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Order Items */}
                    <Section
                        title="Order Items"
                        badge={<span className="text-xs text-gray-400">{order.items?.length} items · {fmt(order.totalAmount)}</span>}
                    >
                        <div className="space-y-4">
                            {(order.items || []).map((item, idx) => {
                                const variant = item.variantId || {};
                                const whs = item.warehouseAllocations || [];
                                return (
                                    <div key={item._id || idx} className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                        {/* Image */}
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                                            {item.imageUrl
                                                ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                : <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 truncate">{item.name || variant.sku}</p>
                                                    <p className="text-xs font-mono text-gray-400 mt-0.5">SKU: {variant.sku || item.sku || '—'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold text-gray-900">{fmt(item.priceAtPurchase || item.price)} × {item.quantity}</p>
                                                    <p className="text-xs text-gray-400">= {fmt((item.priceAtPurchase || item.price) * item.quantity)}</p>
                                                </div>
                                            </div>

                                            {/* Snapshots row */}
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {item.priceVersion && (
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">v{item.priceVersion}</span>
                                                )}
                                                {item.promotionSnapshot?.name && (
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">
                                                        🏷 {item.promotionSnapshot.name} (−{item.promotionSnapshot.discountPercent || 0}%)
                                                    </span>
                                                )}
                                                {(item.attributeSnapshot || variant.variantLabel)?.split?.(' / ').map((attr, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">{attr}</span>
                                                ))}
                                            </div>

                                            {/* Warehouse allocations */}
                                            {whs.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {whs.map((wa, i) => (
                                                        <span key={i} className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600">
                                                            {wa.warehouseCode || wa.warehouseId?.code || 'WH'}: {wa.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Refund button */}
                                        {canRefund && (
                                            <button
                                                onClick={() => { setRefundModal({ lineItemId: item._id, maxQty: item.quantity, sku: item.sku || variant.sku }); setRefundQty(1); }}
                                                className="self-start shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
                                            >
                                                Refund
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals */}
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span><span>{fmt(order.subtotalAmount || order.totalAmount)}</span>
                            </div>
                            {order.taxAmount > 0 && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Tax</span><span>{fmt(order.taxAmount)}</span>
                                </div>
                            )}
                            {order.shippingAmount > 0 && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Shipping</span><span>{fmt(order.shippingAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                                <span>Total</span><span>{fmt(order.totalAmount)}</span>
                            </div>
                        </div>
                    </Section>

                    {/* Payment Logs */}
                    {(order.paymentLogs || []).length > 0 && (
                        <Section title="Payment Logs">
                            <div className="space-y-2">
                                {order.paymentLogs.map((log, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{log.event || log.status}</p>
                                            <p className="text-xs text-gray-400">{fmtDate(log.timestamp || log.createdAt)}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Audit Trail */}
                    {(order.statusHistory || order.auditLog || []).length > 0 && (
                        <Section title="Audit Trail">
                            <div className="space-y-3">
                                {(order.statusHistory || order.auditLog || []).map((entry, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {entry.from ? `${entry.from} → ${entry.to}` : entry.action || entry.event}
                                            </p>
                                            {entry.note && <p className="text-xs text-gray-400">{entry.note}</p>}
                                            <p className="text-xs text-gray-400">{fmtDate(entry.timestamp || entry.createdAt)} · {entry.by || 'System'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>

                {/* ── RIGHT: Customer + Shipping + Status ─────────────────── */}
                <div className="space-y-6">

                    {/* Customer */}
                    <Section title="Customer">
                        <div className="space-y-2 text-sm">
                            <p className="font-bold text-gray-900">{order.shippingAddress?.fullName || order.userId?.name || '—'}</p>
                            <p className="text-gray-500">{order.shippingAddress?.email || order.userId?.email || '—'}</p>
                            <p className="text-gray-500">{order.shippingAddress?.phone || '—'}</p>
                        </div>
                    </Section>

                    {/* Shipping Address */}
                    <Section title="Shipping Address">
                        <address className="not-italic text-sm text-gray-600 space-y-0.5">
                            <p>{order.shippingAddress?.address}</p>
                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                            <p>{order.shippingAddress?.pincode}</p>
                        </address>
                    </Section>

                    {/* Order Meta */}
                    <Section title="Order Info">
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Order ID</dt>
                                <dd className="font-mono font-bold text-indigo-700 text-xs">{order.orderId}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Payment Method</dt>
                                <dd className="font-semibold text-gray-800 capitalize">{order.paymentMethod}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Idempotency Key</dt>
                                <dd className="font-mono text-[10px] text-gray-400 truncate max-w-[130px]">{order.idempotencyKey || '—'}</dd>
                            </div>
                        </dl>
                    </Section>

                    {/* Cancel Reason Input (only if cancellable) */}
                    {canCancel && (
                        <Section title="Cancel Reason">
                            <textarea
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                placeholder="Reason for cancellation (optional)"
                                rows={3}
                                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-red-400 resize-none"
                            />
                        </Section>
                    )}
                </div>
            </div>

            {/* ── CONFIRM MODAL ───────────────────────────────────────────── */}
            {confirm && (
                <ConfirmModal
                    title={confirm.title}
                    message={confirm.message}
                    variant={confirm.variant}
                    loading={actionLoading}
                    onConfirm={confirm.onConfirm}
                    onClose={() => setConfirm(null)}
                />
            )}

            {/* ── REFUND MODAL ────────────────────────────────────────────── */}
            {refundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-base font-bold text-gray-900">Refund Line Item</h2>
                            <p className="text-sm text-gray-500 mt-1">SKU: <span className="font-mono">{refundModal.sku}</span></p>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Quantity (max {refundModal.maxQty})</label>
                                <input
                                    type="number" min={1} max={refundModal.maxQty}
                                    value={refundQty}
                                    onChange={e => setRefundQty(Math.min(Math.max(1, parseInt(e.target.value) || 1), refundModal.maxQty))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-red-400"
                                />
                            </div>
                        </div>
                        <div className="px-6 pb-5 flex justify-end gap-3">
                            <button onClick={() => setRefundModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                            <button
                                onClick={handleRefund}
                                disabled={actionLoading}
                                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing…' : 'Confirm Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailPage;
