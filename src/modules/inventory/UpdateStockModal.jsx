
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Warehouse,
    ArrowRight,
    Check,
    AlertCircle,
    Package,
    History,
    TrendingUp,
    TrendingDown,
    RefreshCw
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE = `${API_URL}/inventory`;
const WAREHOUSE_API = `${API_URL}/warehouses`;

const UpdateStockModal = ({ inventory, onClose, onSuccess }) => {
    const [updateType, setUpdateType] = useState('add');
    const [quantity, setQuantity] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [warehouses, setWarehouses] = useState([]);
    const [reason, setReason] = useState('MANUAL_CORRECTION');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setIsLoadingData(true);
            const res = await axios.get(WAREHOUSE_API);
            if (res.data.success) {
                setWarehouses(res.data.data);
                // Auto-select default
                const defaultWh = res.data.data.find(w => w.isDefault);
                if (defaultWh) setWarehouseId(defaultWh._id);
                else if (res.data.data.length > 0) setWarehouseId(res.data.data[0]._id);
            }
        } catch (error) {
            console.error("Failed to load warehouses");
        } finally {
            setIsLoadingData(false);
        }
    };

    const getCurrentLocationStock = () => {
        if (!inventory || !warehouseId) return 0;
        const loc = inventory.locations?.find(l => l.warehouseId === warehouseId || l.warehouseId._id === warehouseId);
        return loc ? loc.stock : 0;
    };

    const currentStock = getCurrentLocationStock();

    const calculateNewStock = () => {
        const qty = parseInt(quantity) || 0;
        if (updateType === 'add') return currentStock + qty;
        if (updateType === 'deduct') return Math.max(0, currentStock - qty);
        return qty; // set
    };

    const newStock = calculateNewStock();
    const difference = newStock - currentStock;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!warehouseId) {
            toast.error("Please select a target warehouse");
            return;
        }

        if (updateType === 'deduct' && currentStock < parseInt(quantity)) {
            toast.error("Cannot deduct more than available stock");
            return;
        }

        setLoading(true);
        try {
            const variantId = typeof inventory.variantId === 'object'
                ? inventory.variantId._id
                : inventory.variantId;

            await axios.put(`${API_BASE}/${variantId}/update-stock`, {
                updateType,
                quantity: parseInt(quantity) || 0,
                warehouseId,
                reason,
                notes,
                performedBy: 'ADMIN'
            });

            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <Check className="h-10 w-10 text-green-500 bg-green-50 rounded-full p-2" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">Stock Updated</p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {inventory.sku} is now {newStock} units at {warehouses.find(w => w._id === warehouseId)?.name}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ));

            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update stock');
        } finally {
            setLoading(false);
        }
    };

    if (!inventory) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-slate-50/50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Update Stock Level</h2>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <Package size={14} />
                                {inventory.productName}
                                <span className="text-gray-300">|</span>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{inventory.sku}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-8 space-y-8">

                            {/* Warehouse Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Warehouse size={16} className="text-indigo-600" />
                                    Target Location
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {isLoadingData ? (
                                        <div className="col-span-2 h-12 bg-gray-100 animate-pulse rounded-lg"></div>
                                    ) : (
                                        warehouses.map(w => (
                                            <div
                                                key={w._id}
                                                onClick={() => setWarehouseId(w._id)}
                                                className={`
                                                    cursor-pointer p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group
                                                    ${warehouseId === w._id
                                                        ? 'bg-indigo-50 border-indigo-600 shadow-sm ring-1 ring-indigo-600/20'
                                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold text-sm ${warehouseId === w._id ? 'text-indigo-900' : 'text-gray-700'}`}>{w.name}</span>
                                                    <span className="text-xs text-gray-500">{w.code}</span>
                                                </div>
                                                {warehouseId === w._id && <div className="text-indigo-600"><Check size={16} /></div>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Action + Quantity Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left: Action Type */}
                                <div className="space-y-4">
                                    <label className="text-sm font-semibold text-gray-700">Action</label>
                                    <div className="flex p-1 bg-gray-100 rounded-xl">
                                        {[
                                            { id: 'add', label: 'Add', icon: TrendingUp },
                                            { id: 'deduct', label: 'Deduct', icon: TrendingDown },
                                            { id: 'set', label: 'Set', icon: RefreshCw },
                                        ].map((action) => (
                                            <button
                                                key={action.id}
                                                type="button"
                                                onClick={() => {
                                                    setUpdateType(action.id);
                                                    // If switching to set, default to current stock, else 0/empty
                                                    setQuantity("");
                                                }}
                                                className={`
                                                    flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all
                                                    ${updateType === action.id
                                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                                    }
                                                `}
                                            >
                                                <action.icon size={14} />
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Quantity Input */}
                                <div className="space-y-4">
                                    <label className="text-sm font-semibold text-gray-700 flex justify-between">
                                        Quantity
                                        <span className="text-xs font-normal text-gray-500">
                                            Current: <span className="font-mono font-medium text-gray-700">{currentStock}</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-4 pr-4 py-3 text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-300"
                                            autoFocus
                                        />
                                        {updateType !== 'set' && quantity > 0 && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-gray-400">
                                                {updateType === 'add' ? '+' : '-'}{quantity}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Result Preview Card */}
                            <div className={`
                                rounded-xl p-4 flex items-center justify-between border transition-colors
                                ${difference > 0 ? 'bg-green-50/50 border-green-100' : difference < 0 ? 'bg-red-50/50 border-red-100' : 'bg-gray-50/50 border-gray-100'}
                            `}>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Before</div>
                                        <div className="text-lg font-mono font-medium text-gray-600">{currentStock}</div>
                                    </div>
                                    <ArrowRight className="text-gray-300" />
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">After</div>
                                        <div className={`text-2xl font-mono font-bold ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-800'
                                            }`}>
                                            {newStock}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-medium ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-400'
                                        }`}>
                                        {difference > 0 ? `+${difference} units` : difference < 0 ? `${difference} units` : 'No Change'}
                                    </div>
                                    <div className="text-xs text-gray-400">Net Adjustment</div>
                                </div>
                            </div>

                            {/* Reason & Notes */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Reason Code</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
                                    >
                                        <option value="MANUAL_CORRECTION">Manual Correction</option>
                                        <option value="STOCK_RECEIVED">Stock Received (Inbound)</option>
                                        <option value="CUSTOMER_RETURN">Customer Return</option>
                                        <option value="DAMAGE">Damaged / Expired</option>
                                        <option value="THEFT">Loss / Theft</option>
                                        <option value="AUDIT_ADJUSTMENT">Cycle Count Adjustment</option>
                                        <option value="PRODUCTION">Production Output</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Add any relevant reference numbers or details..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm resize-none"
                                    />
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !warehouseId || quantity === "" || (updateType === 'deduct' && currentStock < parseInt(quantity))}
                            className={`
                                relative px-8 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all
                                ${loading || !warehouseId || quantity === ""
                                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0'
                                }
                            `}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                <span>Confirm Update</span>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UpdateStockModal;
