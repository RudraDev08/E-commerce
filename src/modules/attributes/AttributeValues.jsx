import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAttributes from '../../hooks/useAttributes';
import { ArrowLeftIcon, PlusIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';

const AttributeValues = () => {
    const { id } = useParams();
    const {
        getAttributeTypeById,
        selectedAttribute,
        fetchAttributeValues,
        attributeValues,
        createAttributeValue,
        deleteAttributeValue,
        loading
    } = useAttributes();

    const [newValue, setNewValue] = useState({ name: '', value: '', code: '' });

    useEffect(() => {
        if (id) {
            getAttributeTypeById(id);
            fetchAttributeValues(id);
        }
    }, [id, getAttributeTypeById, fetchAttributeValues]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createAttributeValue({
                ...newValue,
                attributeType: id,
                code: newValue.code || newValue.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
                slug: newValue.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
            });
            setNewValue({ name: '', value: '', code: '' });
            fetchAttributeValues(id);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (valueId) => {
        if (window.confirm('Delete this value?')) {
            await deleteAttributeValue(valueId);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/attributes" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {selectedAttribute?.name} Values
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">{attributeValues.length} items defined</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Add Value Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-28">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Option</h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Label</label>
                                <input
                                    type="text"
                                    value={newValue.name}
                                    onChange={(e) => setNewValue({ ...newValue, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="e.g. Cotton"
                                    required
                                />
                            </div>

                            {selectedAttribute?.inputType === 'swatch' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Hex Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={newValue.value}
                                            onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
                                            className="h-10 w-12 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={newValue.value}
                                            onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 uppercase"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Code</label>
                                <input
                                    type="text"
                                    value={newValue.code}
                                    onChange={(e) => setNewValue({ ...newValue, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 uppercase"
                                    placeholder="Auto-generated if empty"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Value
                            </button>
                        </form>
                    </div>
                </div>

                {/* Values List */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="w-10 px-4 py-3"></th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Label</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Code</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading...</td></tr>
                                ) : attributeValues.length === 0 ? (
                                    <tr><td colSpan="4" className="p-12 text-center text-slate-400">No values added yet</td></tr>
                                ) : (
                                    attributeValues.map((val) => (
                                        <tr key={val._id} className="group hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-300 cursor-move">
                                                <Bars3Icon className="w-5 h-5" />
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    {selectedAttribute?.inputType === 'swatch' && val.value && (
                                                        <div
                                                            className="w-6 h-6 rounded-full border border-slate-200 shadow-sm"
                                                            style={{ backgroundColor: val.value }}
                                                        />
                                                    )}
                                                    <span className="font-bold text-slate-700">{val.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 font-mono text-sm text-slate-500">{val.code}</td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(val._id)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttributeValues;
