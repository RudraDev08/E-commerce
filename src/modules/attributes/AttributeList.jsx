import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAttributes from '../../hooks/useAttributes';
import PageHeader from '../../components/layout/PageHeader'; // Using new header
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    TagIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
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

const AttributeList = () => {
    const { attributeTypes, fetchAttributeTypes, deleteAttributeType, loading } = useAttributes();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        fetchAttributeTypes();
    }, [fetchAttributeTypes]);

    const handleDelete = async (id) => {
        customConfirm('Are you sure you want to delete this attribute type? This action cannot be undone.', async () => {
            await deleteAttributeType(id);
        }, 'Delete', 'bg-red-600 hover:bg-red-700');
    };

    const filteredAttributes = attributeTypes.filter(attr => {
        const matchesSearch = attr.name.toLowerCase().includes(searchTerm.toLowerCase()) || attr.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || attr.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(attributeTypes.map(attr => attr.category))];

    return (
        <div className="w-full">
            {/* 1. Page Header with Breadcrumbs */}
            <PageHeader
                title="Attribute Manager"
                subtitle="Define and manage global product specifications like material, fit, and pattern."
                primaryAction={
                    <Link
                        to="/attributes/create"
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create Attribute
                    </Link>
                }
            />

            <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">

                {/* 2. Toolbar Section */}
                <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative group w-full sm:w-80">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search attributes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full focus:bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer w-full focus:bg-white transition-all"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat?.charAt(0).toUpperCase() + cat?.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3. Content Table */}
                <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F8FAFC] border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name / Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Input Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Config</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-8 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredAttributes.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <TagIcon className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">No attributes found</h3>
                                            <p className="text-sm mt-1 mb-6">Create a new attribute to get started.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAttributes.map((attr) => (
                                        <tr key={attr._id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{attr.name}</span>
                                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">{attr.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 capitalize border border-indigo-100/50">
                                                    {attr.inputType?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-medium text-slate-600 capitalize">{attr.category}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center gap-2">
                                                    {attr.showInFilters && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100" title="Filterable">FILTER</span>}
                                                    {attr.showInVariants && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-100" title="Used in Variants">VARIANT</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        to={`/attributes/${attr._id}/values`}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Manage Values"
                                                    >
                                                        <TagIcon className="w-5 h-5" />
                                                    </Link>
                                                    <Link
                                                        to={`/attributes/${attr._id}/edit`}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit Attribute"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(attr._id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Attribute"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
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

export default AttributeList;
