import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    SwatchIcon,
    CheckCircleIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

import { colorAPI } from '../../Api/api';
import toast from 'react-hot-toast';
import StatusSelect from '../../components/Shared/Dropdowns/StatusSelect';

// Custom Dropdown Component
const CustomDropdown = ({ label, value, options, onChange, icon: Icon, color = "indigo" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Color Maps for Dynamic Styling
    const colorStyles = {
        purple: "text-purple-600 ring-purple-500/20 group-hover:ring-purple-500/40",
        pink: "text-pink-600 ring-pink-500/20 group-hover:ring-pink-500/40",
        indigo: "text-indigo-600 ring-indigo-500/20 group-hover:ring-indigo-500/40"
    };

    const activeColor = colorStyles[color] || colorStyles.indigo;

    return (
        <div className="flex flex-col h-full justify-center" ref={containerRef}>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {label}
            </label>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full relative flex items-center gap-3 pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 focus:outline-none focus:ring-2 ${isOpen ? 'ring-2 ' + activeColor : ''}`}
                >
                    {Icon && <Icon className={`w-5 h-5 ${color === 'purple' ? 'text-purple-500' : color === 'pink' ? 'text-pink-500' : 'text-indigo-500'}`} />}
                    <span className="truncate">{selectedOption.label}</span>
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-1 focus:outline-none overflow-hidden origin-top"
                        >
                            {options.map((option) => (
                                <li key={option.value}>
                                    <button
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors ${value === option.value
                                            ? 'bg-slate-50 text-slate-900'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            {option.icon}
                                            {option.label}
                                        </span>
                                        {value === option.value && (
                                            <CheckIcon className={`w-4 h-4 ${color === 'purple' ? 'text-purple-500' : color === 'pink' ? 'text-pink-500' : 'text-indigo-500'}`} />
                                        )}
                                    </button>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const ColorManagement = () => {
    // Data State
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 4;

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedColor, setSelectedColor] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        hexCode: '#000000',
        status: 'active',
        priority: 0,
        description: ''
    });

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load Data
    useEffect(() => {
        loadColors();
    }, [currentPage, filterStatus, sortOrder, debouncedSearch]);

    const loadColors = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                sort: sortOrder
            };

            if (filterStatus !== 'all') params.status = filterStatus;
            if (debouncedSearch) params.search = debouncedSearch;

            const response = await colorAPI.getAll(params);

            setColors(response.data.data || []);

            if (response.data.pagination) {
                setTotalPages(response.data.pagination.pages);
                setTotalItems(response.data.pagination.total);
            }
        } catch (error) {
            toast.error('Failed to load colors');
            setColors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyHex = (hex) => {
        navigator.clipboard.writeText(hex);
        toast.success(`Copied: ${hex}`, { icon: '📋' });
    };

    const handleCreate = () => {
        setFormData({ name: '', hexCode: '#000000', status: 'active', priority: 0, description: '' });
        setSelectedColor(null);
        setModalMode('create');
        setShowModal(true);
    };

    const handleEdit = (color) => {
        setFormData({
            name: color.name,
            hexCode: color.hexCode,
            status: color.status,
            priority: color.priority || 0,
            description: color.description || ''
        });
        setSelectedColor(color);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await colorAPI.create(formData);
                toast.success('Color created successfully');
            } else {
                await colorAPI.update(selectedColor._id, formData);
                toast.success('Color updated successfully');
            }
            setShowModal(false);
            loadColors();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this color?")) return;
        try {
            await colorAPI.delete(id);
            toast.success('Color deleted');
            loadColors();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const toggleStatus = async (id) => {
        try {
            await colorAPI.toggleStatus(id);
            loadColors();
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Filter Options
    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active Only' },
        { value: 'inactive', label: 'Inactive Only' }
    ];

    // Sort Options
    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'priority', label: 'Priority' }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
            {/* Page Header */}
            <div className="px-8 py-8">
                <h1 className="text-2xl font-bold text-slate-900">Color Master</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your color palette and variant options</p>
            </div>

            <div className="px-8 space-y-8">

                {/* Management Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Card 1: Stats */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Colors</p>
                            <p className="text-3xl font-black text-slate-900">{totalItems}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <SwatchIcon className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: Filter Status (Custom Dropdown) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <CustomDropdown
                            label="Filter Status"
                            value={filterStatus}
                            options={statusOptions}
                            onChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
                            icon={FunnelIcon}
                            color="purple"
                        />
                    </div>

                    {/* Card 3: Sort Order (Custom Dropdown) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <CustomDropdown
                            label="Sort Order"
                            value={sortOrder}
                            options={sortOptions}
                            onChange={(val) => setSortOrder(val)}
                            icon={ArrowsUpDownIcon}
                            color="pink"
                        />
                    </div>

                    {/* Card 4: Action (Gradient Button) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            Actions
                        </label>
                        <button
                            onClick={handleCreate}
                            className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl shadow-lg shadow-fuchsia-500/20 text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add New Color
                        </button>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header with Search */}
                    <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Colors List</h2>
                            <p className="text-sm text-slate-500 font-medium">{totalItems} records found</p>
                        </div>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="pl-11 pr-4 py-2.5 w-full sm:w-72 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Color Identity</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Hex Code</th>
                                    <th className="px-6 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    Array.from({ length: itemsPerPage }).map((_, i) => (
                                        <tr key={i} className="animate-pulse h-[88px] border-b border-slate-50 last:border-0 relative">
                                            <td className="px-8 py-5"><div className="w-10 h-10 rounded-xl bg-slate-100 mb-2"></div></td>
                                            <td className="px-6 py-5"><div className="h-4 bg-slate-100 w-24 rounded"></div></td>
                                            <td className="px-6 py-5"><div className="h-6 bg-slate-100 w-12 mx-auto rounded-full"></div></td>
                                            <td className="px-6 py-5"></td>
                                        </tr>
                                    ))
                                ) : colors.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-24 text-center">
                                            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <SwatchIcon className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">No colors found</h3>
                                            <p className="text-sm text-slate-500 mt-1 mb-6">Get started by adding your first color above.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {colors.map((color) => (
                                            <tr key={color._id} className="group hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0 relative h-[88px]">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className="w-12 h-12 rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden relative"
                                                            style={{ backgroundColor: color.hexCode }}
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-white/20 pointer-events-none"></div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900">{color.name}</div>
                                                            <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Priority: {color.priority || 0}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleCopyHex(color.hexCode)}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all uppercase w-fit group/btn shadow-sm"
                                                    >
                                                        <div className="w-2.5 h-2.5 rounded-full border border-black/5" style={{ backgroundColor: color.hexCode }}></div>
                                                        {color.hexCode}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleStatus(color._id)}
                                                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${color.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${color.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(color)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(color._id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Fixed Height Padding: Fill remaining rows to maintain table height */}
                                        {colors.length > 0 && Array.from({ length: Math.max(0, itemsPerPage - colors.length) }).map((_, index) => (
                                            <tr key={`empty-${index}`} className="h-[88px] border-b border-transparent">
                                                <td colSpan="4">&nbsp;</td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Enhanced */}
                    {!loading && colors.length > 0 && (
                        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                <span>Showing</span>
                                <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span>
                                <span>-</span>
                                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
                                <span>of</span>
                                <span className="font-bold text-slate-900">{totalItems}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs uppercase tracking-wider shadow-sm group"
                                >
                                    <ChevronLeftIcon className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                                    Prev
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // Simple page number logic for visual improvement
                                        let pageNum = i + 1;
                                        if (totalPages > 5 && currentPage > 3) {
                                            pageNum = currentPage - 2 + i;
                                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                        }
                                        if (pageNum <= 0) pageNum = i + 1; // Fallback

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${currentPage === pageNum
                                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs uppercase tracking-wider shadow-sm group"
                                >
                                    Next
                                    <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">
                                {modalMode === 'create' ? 'Add New Color' : 'Edit Color'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-all">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Color Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Midnight Blue"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Hex Code <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative w-12 h-12 flex-shrink-0">
                                        <input
                                            type="color"
                                            value={formData.hexCode}
                                            onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                        />
                                        <div className="w-full h-full rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                                            style={{ backgroundColor: formData.hexCode }}>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.hexCode}
                                        onChange={(e) => setFormData({ ...formData, hexCode: e.target.value.toUpperCase() })}
                                        placeholder="#000000"
                                        required
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                    <StatusSelect
                                        value={formData.status}
                                        onChange={(val) => setFormData({ ...formData, status: val })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/20 active:scale-95"
                                >
                                    {modalMode === 'create' ? 'Create Color' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorManagement;
