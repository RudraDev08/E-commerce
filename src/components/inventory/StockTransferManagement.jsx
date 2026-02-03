
import React, { useState, useEffect } from "react";
import {
    FaExchangeAlt,
    FaPlus,
    FaCheckCircle,
    FaTimesCircle,
    FaWarehouse,
    FaArrowRight,
    FaSearch
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE = "http://localhost:5000/api/stock-transfers";
const WAREHOUSE_API = "http://localhost:5000/api/warehouses";
const INVENTORY_API = "http://localhost:5000/api/inventory"; // For searching variants

const StockTransferManagement = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Modal State
    const [warehouses, setWarehouses] = useState([]);
    const [variants, setVariants] = useState([]); // For search results
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        sourceWarehouse: "",
        destinationWarehouse: "",
        items: [], // { variant: id, sku: code, name: name, quantity: 1, max: 10 }
        notes: ""
    });

    useEffect(() => {
        fetchTransfers();
        fetchWarehouses();
    }, []);

    // Search logic for variants
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length > 2) searchVariants();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchTransfers = async () => {
        try {
            setLoading(true);
            const res = await axios.get(API_BASE);
            if (res.data.success) {
                setTransfers(res.data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch transfers");
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await axios.get(WAREHOUSE_API);
            if (res.data.success) {
                setWarehouses(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load warehouses");
        }
    };

    const searchVariants = async () => {
        try {
            // Assuming a search endpoint exists or filtering main inventory
            // For now, let's assume we can exact match SKU or partial text on inventory endpoint
            // Adjust this URL based on actual backend search capabilities
            const res = await axios.get(`${INVENTORY_API}?search=${searchTerm}`);
            if (res.data.success) {
                setVariants(res.data.data.inventory || res.data.data);
            }
        } catch (error) {
            console.error("Search failed");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.sourceWarehouse || !formData.destinationWarehouse) {
            return toast.error("Select both warehouses");
        }
        if (formData.sourceWarehouse === formData.destinationWarehouse) {
            return toast.error("Source and Destination cannot be same");
        }
        if (formData.items.length === 0) {
            return toast.error("Add at least one item");
        }

        try {
            const payload = {
                sourceWarehouse: formData.sourceWarehouse,
                destinationWarehouse: formData.destinationWarehouse,
                items: formData.items.map(i => ({
                    variant: i.variant,
                    sku: i.sku,
                    quantity: parseInt(i.quantity)
                })),
                notes: formData.notes
            };

            await axios.post(API_BASE, payload);
            toast.success("Transfer Request Created");
            setShowModal(false);
            fetchTransfers();
            setFormData({ sourceWarehouse: "", destinationWarehouse: "", items: [], notes: "" });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create transfer");
        }
    };

    const handleComplete = async (id) => {
        if (!window.confirm("Confirm receipt of goods? This will update stock levels.")) return;
        try {
            await axios.post(`${API_BASE}/${id}/complete`);
            toast.success("Transfer Completed");
            fetchTransfers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to complete transfer");
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Cancel this transfer?")) return;
        try {
            await axios.post(`${API_BASE}/${id}/cancel`);
            toast.success("Transfer Cancelled");
            fetchTransfers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel transfer");
        }
    };

    const addItem = (variant) => {
        // Check if duplicate
        if (formData.items.find(i => i.variant === variant.variantId)) return;

        // Check availability in source warehouse (Ideal world: we fetch specific warehouse stock)
        // For now, allow adding and let backend validate or user manually ensure

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                variant: variant.variantId,
                sku: variant.sku,
                name: variant.productName, // or variant attributes
                quantity: 1,
                // max: variant.locations?.find(l => l.warehouseId === formData.sourceWarehouse)?.stock || 0
            }]
        }));
        setSearchTerm("");
        setVariants([]);
    };

    const updateItemQty = (index, qty) => {
        const newItems = [...formData.items];
        newItems[index].quantity = qty;
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaExchangeAlt className="text-indigo-600" /> Stock Transfers
                    </h1>
                    <p className="text-gray-500 mt-1">Move inventory between warehouses</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
                >
                    <FaPlus /> New Transfer
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="p-4 font-semibold">Reference</th>
                                <th className="p-4 font-semibold">From</th>
                                <th className="p-4 font-semibold">To</th>
                                <th className="p-4 font-semibold">Items</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan="7" className="p-6 text-center text-gray-500">Loading transfers...</td></tr>
                            ) : transfers.length === 0 ? (
                                <tr><td colSpan="7" className="p-6 text-center text-gray-500">No transfers found</td></tr>
                            ) : (
                                transfers.map((t) => (
                                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono text-gray-700 font-medium">{t.transferNumber}</td>
                                        <td className="p-4 text-gray-600">{t.sourceWarehouse?.name}</td>
                                        <td className="p-4 text-gray-600">{t.destinationWarehouse?.name}</td>
                                        <td className="p-4 text-gray-600">
                                            {t.items.length} items
                                            <span className="text-xs text-gray-400 block max-w-[200px] truncate">
                                                {t.items.map(i => i.sku).join(', ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    t.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-right space-x-2">
                                            {t.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleComplete(t._id)}
                                                        className="text-green-600 hover:text-green-800 p-1 bg-green-50 rounded"
                                                        title="Complete Transfer"
                                                    >
                                                        <FaCheckCircle />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(t._id)}
                                                        className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded"
                                                        title="Cancel Transfer"
                                                    >
                                                        <FaTimesCircle />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE TRANSFER MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-gray-800">New Stock Transfer</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimesCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-6 flex-1 overflow-y-auto">
                            {/* Route Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">From (Source)</label>
                                    <div className="relative">
                                        <FaWarehouse className="absolute left-3 top-3 text-gray-400" />
                                        <select
                                            value={formData.sourceWarehouse}
                                            onChange={(e) => setFormData({ ...formData, sourceWarehouse: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                            required
                                        >
                                            <option value="">Select Source Warehouse</option>
                                            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center md:pt-6">
                                    <FaArrowRight className="text-gray-300 hidden md:block" />
                                    <span className="md:hidden text-gray-300">↓</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To (Destination)</label>
                                    <div className="relative">
                                        <FaWarehouse className="absolute left-3 top-3 text-gray-400" />
                                        <select
                                            value={formData.destinationWarehouse}
                                            onChange={(e) => setFormData({ ...formData, destinationWarehouse: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                            required
                                        >
                                            <option value="">Select Destination Warehouse</option>
                                            {warehouses.filter(w => w._id !== formData.sourceWarehouse).map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Item Selection */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Transfer Items</h3>

                                {/* Search */}
                                <div className="relative mb-4">
                                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search items by Name or SKU to add..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    {variants.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {variants.map(v => (
                                                <div
                                                    key={v._id || v.variantId}
                                                    onClick={() => addItem(v)}
                                                    className="p-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center text-sm"
                                                >
                                                    <span><span className="font-bold">{v.sku}</span> - {v.productName}</span>
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Add</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Items List */}
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {formData.items.length === 0 && (
                                        <div className="text-center p-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                            No items added yet. Search above to add items.
                                        </div>
                                    )}
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex-1">
                                                <div className="font-bold text-sm text-gray-800">{item.sku}</div>
                                                <div className="text-xs text-gray-500">{item.name}</div>
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItemQty(index, parseInt(e.target.value))}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-500 hover:text-red-700 p-2"
                                            >
                                                <FaTimesCircle />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    rows="2"
                                    placeholder="Reason for transfer, special instructions..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
                                    disabled={formData.items.length === 0}
                                >
                                    <FaCheckCircle /> Create Transfer Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockTransferManagement;
