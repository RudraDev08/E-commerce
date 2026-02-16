import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    LockClosedIcon,
    LockOpenIcon,
    ChevronDownIcon,
    XMarkIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import axios from 'axios';
import toast from 'react-hot-toast';

// ----------------------------------------------------------------------------
// 🎨 ENTERPRISE DESIGN SYSTEM (LOCKED)
// ----------------------------------------------------------------------------
const COLORS = {
    primary: '#1D4ED8',
    primaryHover: '#1E40AF',
    primarySoft: '#DBEAFE',
    success: '#059669',
    successSoft: '#D1FAE5',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    bg: '#F9FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#6B7280'
};

const TRANSITIONS = {
    fast: '150ms ease',
    medium: '200ms ease',
    spring: { type: 'spring', stiffness: 300, damping: 30 }
};

// ----------------------------------------------------------------------------
// 🧩 SUB-COMPONENTS
// ----------------------------------------------------------------------------

const StatusBadge = ({ status }) => {
    const normalizedStatus = (status || 'ACTIVE').toUpperCase();

    const styles = {
        ACTIVE: { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', dot: '#059669' },
        DRAFT: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE', dot: '#1D4ED8' },
        DEPRECATED: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: '⚠️' },
        ARCHIVED: { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB', dot: '#6B7280' }
    };

    const style = styles[normalizedStatus] || styles.ACTIVE;

    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border transition-opacity duration-150"
            style={{
                backgroundColor: style.bg,
                color: style.text,
                borderColor: style.border
            }}
        >
            {style.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />}
            {style.icon && <span className="text-[10px]">{style.icon}</span>}
            {normalizedStatus}
        </span>
    );
};

const SkeletonRow = () => (
    <tr className="h-14 border-b border-[#F1F5F9]">
        {[...Array(9)].map((_, i) => (
            <td key={i} className="px-6 py-4">
                <div className="h-4 rounded-md animate-shimmer"
                    style={{
                        background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 37%, #F3F4F6 63%)',
                        backgroundSize: '200% 100%'
                    }}
                />
            </td>
        ))}
    </tr>
);

const EmptyState = ({ onCreate }) => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 mb-6 rounded-full bg-[#F3F4F6] flex items-center justify-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-[#9CA3AF]" />
        </div>
        <h3 className="text-[18px] font-semibold text-[#111827] mb-2">No sizes found</h3>
        <p className="text-[14px] text-[#6B7280] mb-8 max-w-sm">
            Try adjusting your filters or create a new size definition to get started.
        </p>
        <button
            onClick={onCreate}
            className="flex items-center gap-2 px-6 py-3 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg font-medium text-[14px] shadow-sm transition-all active:scale-[0.98]"
        >
            <PlusIcon className="w-5 h-5" />
            Add New Size
        </button>
    </div>
);

// ----------------------------------------------------------------------------
// 🚀 MAIN COMPONENT
// ----------------------------------------------------------------------------

const SizeMasterManagement = () => {
    // Data State
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const abortControllerRef = useRef(null);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        gender: '',
        region: '',
        status: ''
    });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedSize, setSelectedSize] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [sizeToDelete, setSizeToDelete] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        value: '',
        displayName: '',
        category: 'CLOTHING',
        gender: 'UNISEX',
        primaryRegion: 'US',
        normalizedRank: 0,
        lifecycleState: 'ACTIVE'
    });

    // ------------------------------------------------------------------------
    // ⚡ EFFECTS & HANDLERS
    // ------------------------------------------------------------------------

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.search]);

    // Fetch Data
    const fetchSizes = useCallback(async (reset = false) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.category) params.append('category', filters.category);
            if (filters.gender) params.append('gender', filters.gender);
            if (filters.region) params.append('region', filters.region);
            if (filters.status) params.append('status', filters.status);
            if (debouncedSearch) params.append('search', debouncedSearch);

            if (!reset && cursor) params.append('cursor', cursor);

            params.append('limit', '20');
            params.append('sort', 'normalizedRank');

            const { data } = await axios.get(`/api/sizes?${params}`, {
                signal: abortControllerRef.current.signal
            });

            const newSizes = data.data || [];

            setSizes(prev => reset ? newSizes : [...prev, ...newSizes]);

            if (reset) {
                setCursor(newSizes[newSizes.length - 1]?._id);
            } else {
                setCursor(newSizes[newSizes.length - 1]?._id);
            }

            setHasMore(newSizes.length === 20);

        } catch (error) {
            if (axios.isCancel(error)) return;
            console.error('Fetch error:', error);
            toast.error('Failed to load sizes');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filters.category, filters.gender, filters.region, filters.status, cursor]);

    // Initial Load & Filter Change
    useEffect(() => {
        fetchSizes(true);
    }, [debouncedSearch, filters.category, filters.gender, filters.region, filters.status]);

    // ------------------------------------------------------------------------
    // 🗑 ACTIONS
    // ------------------------------------------------------------------------

    const handleCreate = () => {
        setFormData({
            value: '',
            displayName: '',
            category: 'CLOTHING',
            gender: 'UNISEX',
            primaryRegion: 'US',
            normalizedRank: 0,
            lifecycleState: 'ACTIVE'
        });
        setModalMode('create');
        setShowModal(true);
    };

    const handleEdit = (size) => {
        if (size.isLocked) return;

        setFormData({
            value: size.value || size.name,
            displayName: size.displayName || size.fullName,
            category: size.category,
            gender: size.gender,
            primaryRegion: size.primaryRegion || 'US',
            normalizedRank: size.normalizedRank || size.displayOrder || 0,
            lifecycleState: size.lifecycleState || size.status?.toUpperCase() || 'ACTIVE'
        });
        setSelectedSize(size);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleDeleteClick = (size) => {
        if (size.isLocked) return;
        setSizeToDelete(size);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!sizeToDelete) return;
        try {
            await axios.delete(`/api/sizes/${sizeToDelete._id}`);
            toast.success('Size definition deleted');
            fetchSizes(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        } finally {
            setShowDeleteConfirm(false);
            setSizeToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await axios.post('/api/sizes', formData);
                toast.success('Size created successfully');
            } else {
                await axios.put(`/api/sizes/${selectedSize._id}`, formData);
                toast.success('Size updated successfully');
            }
            setShowModal(false);
            fetchSizes(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    // ------------------------------------------------------------------------
    // 🎭 RENDER
    // ------------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans">
            <style>{`
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                .animate-shimmer { animation: shimmer 1.2s ease-in-out infinite; }
            `}</style>

            {/* Header */}
            <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-20">
                <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
                    <div>
                        <h1 className="text-[28px] font-semibold text-[#111827] leading-tight">
                            Size Master Registry
                        </h1>
                        <p className="text-[14px] text-[#6B7280] mt-1">
                            Manage standardized size definitions across regions and categories
                        </p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg font-medium text-[14px] shadow-sm transition-all active:scale-[0.98]"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add New Size
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-8 py-8 space-y-6">

                {/* Filter Bar */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search sizes..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[14px] text-[#111827] focus:outline-none focus:border-[#1D4ED8] focus:ring-[3px] focus:ring-[#1D4ED8]/10 transition-all placeholder-[#9CA3AF]"
                        />
                        {loading && filters.search && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>

                    {[
                        { key: 'category', options: ['CLOTHING', 'FOOTWEAR', 'ACCESSORIES', 'STORAGE', 'RAM', 'DISPLAY', 'DIMENSION'] },
                        { key: 'gender', options: ['MEN', 'WOMEN', 'UNISEX', 'KIDS', 'BOYS', 'GIRLS', 'INFANT'] },
                        { key: 'region', options: ['US', 'UK', 'EU', 'JP', 'AU', 'CN', 'GLOBAL'] },
                        { key: 'status', options: ['ACTIVE', 'DRAFT', 'DEPRECATED', 'ARCHIVED'] }
                    ].map(filter => (
                        <select
                            key={filter.key}
                            value={filters[filter.key]}
                            onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                            className="px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[14px] text-[#111827] cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:border-[#1D4ED8] focus:ring-[3px] focus:ring-[#1D4ED8]/10 capitalize"
                        >
                            <option value="">All {filter.key}s</option>
                            {filter.options.map(opt => (
                                <option key={opt} value={opt}>{opt.charAt(0) + opt.slice(1).toLowerCase()}</option>
                            ))}
                        </select>
                    ))}
                </div>

                {/* Data Grid */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-[#E5E7EB]">
                                {['Value', 'Display Name', 'Category', 'Gender', 'Region', 'Rank', 'Status', 'Usage', 'Actions'].map(head => (
                                    <th key={head} className="px-6 py-4 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                            {loading && sizes.length === 0 ? (
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : sizes.length === 0 ? (
                                <tr>
                                    <td colSpan="9">
                                        <EmptyState onCreate={handleCreate} />
                                    </td>
                                </tr>
                            ) : (
                                sizes.map(size => (
                                    <tr
                                        key={size._id}
                                        className="hover:bg-[#F8FAFC] transition-colors duration-150 group"
                                    >
                                        <td className="px-6 py-4 text-[14px] font-semibold text-[#111827]">
                                            {size.value || size.name}
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                                            {size.displayName || size.fullName || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                                            {size.category}
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                                            {size.gender}
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                                            {size.primaryRegion || 'US'}
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                                            {size.normalizedRank || size.displayOrder || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={size.lifecycleState || size.status} />
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-[#6B7280]">
                                            <span className="inline-flex items-center gap-1.5">
                                                {size.usageCount || 0}
                                                {size.usageCount > 0 && (
                                                    <span className="text-[11px] text-[#9CA3AF]">variants</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                {size.isLocked ? (
                                                    <div className="p-1.5 text-[#1D4ED8]" title="This size is locked">
                                                        <LockClosedIcon className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(size)}
                                                            className="p-1.5 text-[#6B7280] hover:text-[#1D4ED8] hover:bg-[#DBEAFE] rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(size)}
                                                            className="p-1.5 text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Load More */}
                    {hasMore && sizes.length > 0 && (
                        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-center">
                            <button
                                onClick={() => fetchSizes(false)}
                                disabled={loading}
                                className="px-6 py-2.5 bg-white border border-[#E5E7EB] text-[#4B5563] text-[14px] font-medium rounded-lg hover:bg-[#F3F4F6] disabled:opacity-50 transition-all shadow-sm"
                            >
                                {loading ? 'Loading...' : 'Load More Sizes'}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="px-6 py-5 border-b border-[#E5E7EB] flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-[20px] font-semibold text-[#111827]">
                                    {modalMode === 'create' ? 'Add New Size' : 'Edit Size'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#111827] transition-colors">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-medium text-[#4B5563]">Value</label>
                                        <input
                                            required
                                            value={formData.value}
                                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#1D4ED8] focus:ring-[3px] focus:ring-[#1D4ED8]/10"
                                            placeholder="e.g. XL"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-medium text-[#4B5563]">Display Name</label>
                                        <input
                                            required
                                            value={formData.displayName}
                                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#1D4ED8] focus:ring-[3px] focus:ring-[#1D4ED8]/10"
                                            placeholder="e.g. Extra Large"
                                        />
                                    </div>

                                    {/* Dropdowns */}
                                    {['Category', 'Gender', 'PrimaryRegion'].map(field => (
                                        <div key={field} className="space-y-2">
                                            <label className="text-[13px] font-medium text-[#4B5563]">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                            <select
                                                value={formData[field.charAt(0).toLowerCase() + field.slice(1)]}
                                                onChange={e => setFormData({ ...formData, [field.charAt(0).toLowerCase() + field.slice(1)]: e.target.value })}
                                                className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#1D4ED8] focus:ring-[3px] focus:ring-[#1D4ED8]/10"
                                            >
                                                {field === 'Category' && ['CLOTHING', 'FOOTWEAR', 'ACCESSORIES', 'STORAGE', 'RAM', 'DISPLAY', 'DIMENSION'].map(o => <option key={o} value={o}>{o}</option>)}
                                                {field === 'Gender' && ['MEN', 'WOMEN', 'UNISEX', 'KIDS', 'BOYS', 'GIRLS', 'INFANT'].map(o => <option key={o} value={o}>{o}</option>)}
                                                {field === 'PrimaryRegion' && ['US', 'UK', 'EU', 'JP', 'AU', 'CN', 'GLOBAL'].map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                    ))}

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-medium text-[#4B5563]">Normalized Rank</label>
                                        <input
                                            type="number"
                                            value={formData.normalizedRank}
                                            onChange={e => setFormData({ ...formData, normalizedRank: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#1D4ED8] focus:ring-[3px] focus:ring-[#1D4ED8]/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-medium text-[#4B5563]">Lifecycle State</label>
                                        <select
                                            value={formData.lifecycleState}
                                            onChange={e => setFormData({ ...formData, lifecycleState: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#1D4ED8] focus:ring-[3px] focus:ring-[#1D4ED8]/10"
                                        >
                                            {['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#E5E7EB] flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[#4B5563] font-medium text-[14px] hover:bg-[#F9FAFB] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 bg-[#1D4ED8] text-white rounded-lg font-medium text-[14px] hover:bg-[#1E40AF] shadow-sm transition-all active:scale-[0.98]"
                                    >
                                        {modalMode === 'create' ? 'Create Size' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DELETE CONFIRMATION */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-[#FEE2E2] rounded-full flex items-center justify-center mb-4">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-[#DC2626]" />
                                </div>
                                <h3 className="text-[18px] font-semibold text-[#111827] mb-2">Delete Size Definition?</h3>

                                <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-4 mb-6 text-left w-full">
                                    <p className="text-[13px] text-[#92400E] leading-relaxed">
                                        <strong>Warning:</strong> This size might be used in active variants.
                                        Deleting it could impact product configurations. Consider deprecating instead.
                                    </p>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[#4B5563] font-medium text-[14px] hover:bg-[#F9FAFB] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-4 py-2.5 bg-[#DC2626] text-white rounded-lg font-medium text-[14px] hover:bg-[#B91C1C] shadow-sm transition-all active:scale-[0.98]"
                                    >
                                        Confirm Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SizeMasterManagement;
