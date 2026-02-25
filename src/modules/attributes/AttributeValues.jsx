import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAttributes from '../../hooks/useAttributes';
import { ArrowLeftIcon, PlusIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ICON_MAP = {
    'bg-red-600 hover:bg-red-700': { icon: '🗑️', label: 'Destructive action' },
    'bg-amber-600 hover:bg-amber-700': { icon: '📦', label: 'Archive action' },
    'bg-indigo-600 hover:bg-indigo-700': { icon: '↩️', label: 'Restore action' },
    'bg-slate-800 hover:bg-slate-900': { icon: '🔒', label: 'Lock action' },
};

const customConfirm = (message, onConfirm, confirmText = 'Confirm', confirmColor = 'bg-indigo-600 hover:bg-indigo-700') => {
    const meta = ICON_MAP[confirmColor] || { icon: '⚡', label: 'Action' };
    toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>{meta.icon}</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#F1F5F9', lineHeight: '1.4', flex: 1 }}>
                    {message}
                </span>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 -2px' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#94A3B8', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.11)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                >
                    Cancel
                </button>
                <button
                    onClick={() => { toast.dismiss(t.id); onConfirm(); }}
                    style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: '#fff', background: confirmColor.includes('red') ? '#DC2626' : confirmColor.includes('amber') ? '#D97706' : confirmColor.includes('slate') ? '#1E293B' : '#4F46E5', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.target.style.opacity = '0.85'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    ), {
        duration: Infinity,
        style: {
            background: '#0F172A', color: '#F1F5F9', borderRadius: '16px', padding: '16px 18px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)', maxWidth: '380px', border: 'none',
            borderLeft: '3px solid ' + (confirmColor.includes('red') ? '#F87171' : confirmColor.includes('amber') ? '#FBBF24' : confirmColor.includes('slate') ? '#64748B' : '#818CF8'),
        },
    });
};

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

    const [newValue, setNewValue] = useState({ name: '', value: '', code: '', modifierType: 'none', modifierValue: '' });

    useEffect(() => {
        if (id) {
            getAttributeTypeById(id);
            fetchAttributeValues(id);
        }
    }, [id, getAttributeTypeById, fetchAttributeValues]);

    const handleAdd = async (e) => {
        e.preventDefault();

        if (!selectedAttribute) {
            toast.error('Attribute data still loading. Please wait.');
            return;
        }

        try {
            const payload = {
                attributeType: id,
                name: newValue.name.trim(),
                displayName: newValue.name.trim(),
                value: newValue.value || newValue.name,
                pricingModifiers: {
                    modifierType: newValue.modifierType,
                    value: newValue.modifierType === 'none' ? 0 : parseFloat(newValue.modifierValue || 0)
                },
                code: newValue.code?.trim() || undefined,
                slug: newValue.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
            };

            // Mapping based on Category to satisfy Backend Validators
            const category = selectedAttribute.category;

            if (category === 'visual') {
                payload.visualData = {
                    hexCode: newValue.value || '#000000',
                    swatchType: selectedAttribute.inputType === 'swatch' ? 'color' : 'none',
                    swatchValue: newValue.value || '#000000'
                };
            } else if (category === 'physical') {
                payload.measurements = {
                    sizeGroup: 'Standard',
                    weight: 0
                };
            } else if (category === 'technical') {
                payload.technicalData = {
                    numericValue: 0
                };
            } else if (category === 'material') {
                payload.materialData = {
                    primaryMaterial: 'Generic'
                };
            } else if (category === 'style') {
                payload.styleData = {
                    styleCategory: 'classic',
                    fitType: 'regular'
                };
            }

            await createAttributeValue(payload);
            setNewValue({ name: '', value: '', code: '', modifierType: 'none', modifierValue: '' });
            fetchAttributeValues(id);
        } catch (error) {
            console.error('Add attribute value failed:', error);
            // Surface the specific validation error message from the backend
            const msg = error.response?.data?.message || error.message || 'Operation failed';
            toast.error(msg, { duration: 5000 });
        }
    };

    const handleDelete = async (valueId) => {
        customConfirm('Are you sure you want to delete this value?', async () => {
            await deleteAttributeValue(valueId);
        }, 'Delete', 'bg-red-600 hover:bg-red-700');
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
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="Auto-generated if empty"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Pricing Modifier</label>
                                <select
                                    value={newValue.modifierType}
                                    onChange={(e) => setNewValue({ ...newValue, modifierType: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-3"
                                >
                                    <option value="none">None</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                    <option value="percentage">Percentage (%)</option>
                                </select>

                                {newValue.modifierType !== 'none' && (
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={newValue.modifierType === 'percentage' ? -100 : -1000000}
                                        max={newValue.modifierType === 'percentage' ? 500 : 1000000}
                                        value={newValue.modifierValue}
                                        onChange={(e) => setNewValue({ ...newValue, modifierValue: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        placeholder={newValue.modifierType === 'fixed' ? 'e.g. 500' : 'e.g. 10'}
                                        required
                                    />
                                )}
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
                                                    <span className="font-bold text-slate-700 mt-0.5">{val.name}</span>
                                                    {val.pricingModifiers && val.pricingModifiers.modifierType !== 'none' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            {val.pricingModifiers.modifierType === 'fixed' ? '+₹' : '+'}{val.pricingModifiers.value}{val.pricingModifiers.modifierType === 'percentage' ? '%' : ''}
                                                        </span>
                                                    )}
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
