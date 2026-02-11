
import React, { useState, useEffect } from "react";
import {
    FaClipboardCheck,
    FaPlus,
    FaCheckCircle,
    FaTimesCircle,
    FaWarehouse,
    FaExclamationTriangle,
    FaSave,
    FaHistory
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE = "http://localhost:5000/api/cycle-counts";
const WAREHOUSE_API = "http://localhost:5000/api/warehouses";

const CycleCountManagement = () => {
    const [counts, setCounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeCount, setActiveCount] = useState(null); // When viewing/performing a count

    const [warehouses, setWarehouses] = useState([]);
    const [newCountData, setNewCountData] = useState({ warehouse: "", notes: "", countType: "FULL" });

    useEffect(() => {
        fetchCounts();
        fetchWarehouses();
    }, []);

    const fetchCounts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(API_BASE);
            if (res.data.success) setCounts(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch cycle counts");
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await axios.get(WAREHOUSE_API);
            if (res.data.success) setWarehouses(res.data.data);
        } catch (error) {
            console.error("Failed to load warehouses");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(API_BASE, newCountData);
            toast.success("Cycle Count Session Started");
            setShowModal(false);
            fetchCounts();
            setActiveCount(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to start count");
        }
    };

    const handleUpdateItem = async (itemId, qty) => {
        try {
            await axios.put(`${API_BASE}/${activeCount._id}/items/${itemId}`, { quantity: qty });
            // Update local state for immediate feedback
            const updatedItems = activeCount.items.map(item => {
                if (item._id === itemId) {
                    const variance = qty - item.systemQuantity;
                    return { ...item, countedQuantity: qty, variance, status: variance === 0 ? 'MATCH' : 'VARIANCE' };
                }
                return item;
            });
            setActiveCount({ ...activeCount, items: updatedItems });
        } catch (error) {
            toast.error("Failed to save count");
        }
    };

    const handleFinalize = async () => {
        if (!window.confirm("Are you sure? This will adjust system stock based on variances.")) return;
        try {
            await axios.post(`${API_BASE}/${activeCount._id}/finalize`);
            toast.success("Cycle Count Finalized & Stock Adjusted");
            setActiveCount(null);
            fetchCounts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to finalize");
        }
    };

    const viewCount = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/${id}`);
            if (res.data.success) setActiveCount(res.data.data);
        } catch (error) {
            toast.error("Failed to load count details");
        }
    }

    if (activeCount) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <button onClick={() => setActiveCount(null)} className="text-indigo-600 text-sm font-bold mb-2 block hover:underline">← Back to List</button>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <FaClipboardCheck /> Cycle Count: {activeCount.countNumber}
                        </h1>
                        <p className="text-gray-500">Warehouse: {activeCount.warehouse?.name} | {activeCount.countType}</p>
                    </div>
                    {activeCount.status === 'IN_PROGRESS' && (
                        <button
                            onClick={handleFinalize}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
                        >
                            <FaCheckCircle /> Finalize & Adjust
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Items</p>
                        <p className="text-2xl font-bold">{activeCount.summary.totalItems}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Items Counted</p>
                        <p className="text-2xl font-bold text-indigo-600">{activeCount.items.filter(i => i.countedQuantity > 0).length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Variances Found</p>
                        <p className="text-2xl font-bold text-orange-600">{activeCount.items.filter(i => i.variance !== 0 && i.status !== 'PENDING').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${activeCount.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {activeCount.status}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b">
                                <th className="p-4">SKU / Item</th>
                                <th className="p-4 text-center">System Qty</th>
                                <th className="p-4 text-center w-32">Counted Qty</th>
                                <th className="p-4 text-center">Variance</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {activeCount.items.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-800">{item.sku}</td>
                                    <td className="p-4 text-center font-mono">{item.systemQuantity}</td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            disabled={activeCount.status === 'COMPLETED'}
                                            defaultValue={item.countedQuantity}
                                            onBlur={(e) => handleUpdateItem(item._id, parseInt(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </td>
                                    <td className={`p-4 text-center font-bold ${item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                        {item.variance > 0 ? `+${item.variance}` : item.variance}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'MATCH' ? 'bg-green-100 text-green-600' :
                                            item.status === 'VARIANCE' ? 'bg-orange-100 text-orange-600' :
                                                item.status === 'ADJUSTED' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-gray-100 text-gray-400'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaClipboardCheck className="text-indigo-600" /> Cycle Counting
                    </h1>
                    <p className="text-gray-500 mt-1">Inventory audits and stock reconciliation</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
                >
                    <FaPlus /> Start New Audit
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b">
                            <th className="p-4">Reference</th>
                            <th className="p-4">Warehouse</th>
                            <th className="p-4">Items</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400">Loading history...</td></tr>
                        ) : counts.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400 text-sm">No inventory audits found. Click "Start New Audit" to begin.</td></tr>
                        ) : (
                            counts.map(c => (
                                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono font-bold text-gray-700">{c.countNumber}</td>
                                    <td className="p-4 text-gray-600">{c.warehouse?.name}</td>
                                    <td className="p-4 text-gray-500">{c.summary?.totalItems} items</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                   ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => viewCount(c._id)}
                                            className="text-indigo-600 hover:underline font-bold"
                                        >
                                            {c.status === 'COMPLETED' ? 'View Report' : 'Perform Count'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center text-gray-800">
                            <h2 className="text-xl font-bold">Start Inventory Audit</h2>
                            <button onClick={() => setShowModal(false)}><FaTimesCircle size={24} className="text-gray-300 hover:text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Select Warehouse</label>
                                <select
                                    value={newCountData.warehouse}
                                    onChange={(e) => setNewCountData({ ...newCountData, warehouse: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                >
                                    <option value="">Choose Warehouse...</option>
                                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Audit Type</label>
                                <select
                                    value={newCountData.countType}
                                    onChange={(e) => setNewCountData({ ...newCountData, countType: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="FULL">Full Warehouse Count</option>
                                    <option value="ADHOC">Spot Check / Ad-hoc</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-lg">Cancel</button>
                                <button type="submit" disabled={!newCountData.warehouse} className={`px-5 py-2 rounded-lg font-bold shadow-sm ${!newCountData.warehouse ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>Start Working</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CycleCountManagement;
