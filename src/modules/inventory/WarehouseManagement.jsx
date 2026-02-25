
import React, { useState, useEffect } from "react";
import {
    FaWarehouse,
    FaPlus,
    FaEdit,
    FaTrash,
    FaMapMarkerAlt,
    FaPhone,
    FaCheckCircle,
    FaTimesCircle,
    FaBoxOpen,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE = "http://localhost:5000/api/warehouses";

const WarehouseManagement = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        type: "PHYSICAL",
        address: { street: "", city: "", state: "", zip: "", country: "" },
        contact: { name: "", phone: "", email: "" },
        isDefault: false,
    });

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(API_BASE);
            if (res.data.success) {
                setWarehouses(res.data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch warehouses");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;

        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData((prev) => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API_BASE}/${editingId}`, formData);
                toast.success("Warehouse updated successfully");
            } else {
                await axios.post(API_BASE, formData);
                toast.success("Warehouse created successfully");
            }
            setShowModal(false);
            resetForm();
            fetchWarehouses();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleEdit = (warehouse) => {
        setEditingId(warehouse._id);
        setFormData({ ...warehouse }); // Ensure structure matches
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        // Zero-confirm policy enforcement
        try {
            await axios.delete(`${API_BASE}/${id}`);
            toast.success("Warehouse deactivated");
            fetchWarehouses();
        } catch (error) {
            toast.error("Failed to delete warehouse");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: "",
            code: "",
            type: "PHYSICAL",
            address: { street: "", city: "", state: "", zip: "", country: "" },
            contact: { name: "", phone: "", email: "" },
            isDefault: false,
        });
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaWarehouse className="text-indigo-600" /> Warehouse Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage physical locations and storage</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
                >
                    <FaPlus /> Add Warehouse
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {warehouses.map((wh) => (
                        <div key={wh._id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow ${wh.isDefault ? 'ring-2 ring-indigo-50 border-indigo-100' : ''}`}>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{wh.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{wh.code}</span>
                                            {wh.isDefault && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Default</span>}
                                            {!wh.isActive && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                                        </div>
                                    </div>
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <FaWarehouse size={20} />
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex items-start gap-2">
                                        <FaMapMarkerAlt className="mt-1 text-gray-400" />
                                        <p className="line-clamp-2">
                                            {wh.address?.street}, {wh.address?.city}, {wh.address?.state} {wh.address?.zip}
                                        </p>
                                    </div>
                                    {wh.contact?.name && (
                                        <div className="flex items-center gap-2">
                                            <FaPhone className="text-gray-400" />
                                            <span>{wh.contact.name} ({wh.contact.phone})</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                                <button
                                    onClick={() => handleEdit(wh)}
                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                                    title="Edit"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDelete(wh._id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-md transition-colors"
                                    title="Deactivate"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? "Edit Warehouse" : "Add New Warehouse"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FaTimesCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name*</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Code*</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono uppercase"
                                        placeholder="e.g. WH-NY-01"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                    >
                                        <option value="PHYSICAL">Physical Warehouse</option>
                                        <option value="STORE">Retail Store</option>
                                        <option value="3PL">Third Party (3PL)</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            name="isDefault"
                                            checked={formData.isDefault}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Set as Default Warehouse</span>
                                    </label>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b pb-1">Address Details</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <input
                                        type="text"
                                        name="address.street"
                                        value={formData.address?.street}
                                        onChange={handleChange}
                                        placeholder="Street Address"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <input
                                            type="text"
                                            name="address.city"
                                            value={formData.address?.city}
                                            onChange={handleChange}
                                            placeholder="City"
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <input
                                            type="text"
                                            name="address.state"
                                            value={formData.address?.state}
                                            onChange={handleChange}
                                            placeholder="State"
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <input
                                            type="text"
                                            name="address.zip"
                                            value={formData.address?.zip}
                                            onChange={handleChange}
                                            placeholder="ZIP Code"
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <input
                                            type="text"
                                            name="address.country"
                                            value={formData.address?.country}
                                            onChange={handleChange}
                                            placeholder="Country"
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b pb-1">Contact Person</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        name="contact.name"
                                        value={formData.contact?.name}
                                        onChange={handleChange}
                                        placeholder="Full Name"
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <input
                                        type="tel"
                                        name="contact.phone"
                                        value={formData.contact?.phone}
                                        onChange={handleChange}
                                        placeholder="Phone Number"
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <input
                                        type="email"
                                        name="contact.email"
                                        value={formData.contact?.email}
                                        onChange={handleChange}
                                        placeholder="Email Address"
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
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
                                >
                                    {editingId ? <FaCheckCircle /> : <FaPlus />}
                                    {editingId ? "Save Changes" : "Create Warehouse"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseManagement;
