import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    History,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Clock,
    User,
    ExternalLink,
    Package,
    AlertCircle,
    ArrowRight,
    Warehouse,
    PlusCircle,
    MinusCircle,
    Repeat
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/inventory";

const InventoryLedgerModal = ({ inventory, onClose }) => {
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, count: 0 });

    useEffect(() => {
        if (inventory) {
            fetchLedger();
        }
    }, [inventory]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const variantId = typeof inventory.variantId === "object" ? inventory.variantId._id : inventory.variantId;
            const response = await axios.get(`${API_BASE}/${variantId}/ledger`);

            if (response.data.success) {
                const data = response.data.data;
                setLedger(data);

                // Calculate some quick stats
                const stats = data.reduce((acc, entry) => {
                    if (entry.quantity > 0) acc.totalIn += entry.quantity;
                    else acc.totalOut += Math.abs(entry.quantity);
                    return acc;
                }, { totalIn: 0, totalOut: 0, count: data.length });
                setStats(stats);
            }
        } catch (err) {
            console.error("Error fetching ledger:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => setVisibleCount((prev) => prev + 10);

    if (!inventory) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="pointer-events-auto w-screen max-w-2xl"
                >
                    <div className="flex h-full flex-col bg-white shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <History size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Inventory Audit History</h2>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{inventory.sku}</span>
                                        <span className="text-gray-300">|</span>
                                        <span>{inventory.productName}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2.5 transition-all outline-none"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
                            <div className="px-8 py-4 border-r border-gray-100 bg-white">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Total Events</span>
                                <span className="text-lg font-bold text-gray-900">{stats.count}</span>
                            </div>
                            <div className="px-8 py-4 border-r border-gray-100 bg-white">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-green-500 mb-1 block">Total Inflow</span>
                                <span className="text-lg font-bold text-green-600">+{stats.totalIn}</span>
                            </div>
                            <div className="px-8 py-4 bg-white">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 mb-1 block">Total Outflow</span>
                                <span className="text-lg font-bold text-red-600">-{stats.totalOut}</span>
                            </div>
                        </div>

                        {/* Content Container */}
                        <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                            <div className="p-8">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                        <div className="w-10 h-10 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                                        <p className="text-sm font-medium text-gray-500">Retrieving audit logs...</p>
                                    </div>
                                ) : ledger.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <History size={48} className="text-gray-300 mb-4" />
                                        <p className="text-base font-semibold text-gray-900">No History Found</p>
                                        <p className="text-sm text-gray-500 mt-1 uppercase tracking-tight">System logs will appear here after updates</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Vertical Line */}
                                        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gray-200/60" />

                                        <div className="space-y-8">
                                            {ledger.slice(0, visibleCount).map((entry, idx) => (
                                                <LedgerEntryItem key={entry._id} entry={entry} isLast={idx === ledger.slice(0, visibleCount).length - 1} />
                                            ))}

                                            {visibleCount < ledger.length && (
                                                <div className="ml-12 pt-4">
                                                    <button
                                                        onClick={loadMore}
                                                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-white hover:border-indigo-600 hover:shadow-md transition-all group"
                                                    >
                                                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                                        Load More Activities ({ledger.length - visibleCount} hidden)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-gray-100 bg-slate-50/50 flex justify-between items-center">
                            <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                <AlertCircle size={12} />
                                Audit logs are immutable and permanent
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                            >
                                Close Audit
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const LedgerEntryItem = ({ entry }) => {
    const getTransactionLabel = (type) => {
        switch (type) {
            case "ADJUSTMENT":
                return { label: "Adjustment", color: "blue", icon: RefreshCw };
            case "ORDER_DEDUCT":
                return { label: "Order Fulfilled", color: "red", icon: MinusCircle };
            case "RESERVE":
                return { label: "Reservation", color: "orange", icon: Clock };
            case "STOCK_IN":
                return { label: "Stock Added", color: "green", icon: PlusCircle };
            case "STOCK_OUT":
                return { label: "Stock Removed", color: "red", icon: MinusCircle };
            case "TRANSFER":
                return { label: "Internal Move", color: "purple", icon: Repeat };
            case "ORDER_CANCEL":
                return { label: "Order Cancelled", color: "emerald", icon: PlusCircle };
            case "RETURN_RESTORE":
                return { label: "Return Received", color: "teal", icon: PlusCircle };
            case "RELEASE":
                return { label: "Res. Released", color: "slate", icon: RefreshCw };
            default:
                return { label: type, color: "slate", icon: AlertCircle };
        }
    };

    const config = getTransactionLabel(entry.transactionType);
    const isPositive = entry.quantity > 0;
    const timestamp = new Date(entry.transactionDate);

    const colors = {
        green: "bg-emerald-500 text-emerald-50 text-emerald-600",
        red: "bg-rose-500 text-rose-50 text-rose-600",
        blue: "bg-blue-500 text-blue-50 text-blue-600",
        orange: "bg-amber-500 text-amber-50 text-amber-600",
        purple: "bg-violet-500 text-violet-50 text-violet-600",
        emerald: "bg-emerald-500 text-emerald-50 text-emerald-600",
        teal: "bg-teal-500 text-teal-50 text-teal-600",
        slate: "bg-slate-500 text-slate-50 text-slate-600"
    };

    const selectedColor = colors[config.color] || colors.slate;
    const [bgDot, textDot, textLabel] = selectedColor.split(" ");

    return (
        <div className="relative flex gap-6">
            {/* Timeline Node */}
            <div className="flex flex-col items-center">
                <div className={`mt-1.5 w-12 h-12 rounded-2xl flex items-center justify-center z-10 shadow-sm ${bgDot} ${textDot}`}>
                    <config.icon size={22} />
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow group">
                {/* Top Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className={`text-[10px] uppercase tracking-widest font-black ${textLabel} mb-1`}>{config.label}</div>
                        <div className="text-gray-900 font-bold text-base flex items-center gap-2">
                            {entry.reason.replace(/_/g, " ")}
                            {entry.referenceId && (
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500 group-hover:bg-slate-200 transition-colors uppercase">
                                    #{entry.referenceId.slice(-8)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-lg font-black font-mono ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {isPositive ? "+" : ""}
                            {entry.quantity}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">Quantity</div>
                    </div>
                </div>

                {/* Stock Snapshot Grid */}
                <div className="grid grid-cols-3 gap-0 rounded-xl bg-slate-50 border border-slate-100 mb-4 overflow-hidden divide-x divide-slate-100">
                    <div className="px-4 py-3">
                        <div className="text-[9px] uppercase tracking-tighter font-bold text-gray-400 mb-1">Old Stock</div>
                        <div className="text-sm font-mono font-bold text-slate-600">{entry.stockBefore.total}</div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-center">
                        <ArrowRight size={16} className="text-slate-300" />
                    </div>
                    <div className="px-4 py-3">
                        <div className="text-[9px] uppercase tracking-tighter font-bold text-gray-400 mb-1">New Total</div>
                        <div className="text-sm font-mono font-bold text-slate-900">{entry.stockAfter.total}</div>
                    </div>
                </div>

                {/* Metadata Footer */}
                <div className="flex flex-wrap gap-y-3 gap-x-6 items-center pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Clock size={14} className="text-gray-300" />
                        {format(timestamp, "MMM d, yyyy · HH:mm")}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <User size={14} className="text-gray-300" />
                        {entry.performedBy}
                    </div>
                    {entry.warehouseId && entry.warehouseId !== "WH-DEFAULT" && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-bold bg-indigo-50 px-2 py-1 rounded-lg">
                            <Warehouse size={13} className="text-indigo-400" />
                            Location: {entry.warehouseId}
                        </div>
                    )}
                </div>

                {entry.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-orange-50/30 border border-orange-100/50 flex items-start gap-2">
                        <AlertCircle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                        <p className="text-xs italic text-orange-800 leading-relaxed font-medium">"{entry.notes}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryLedgerModal;
