import { useState, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    SwatchIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

import { colorAPI } from '../../api/api';
import toast from 'react-hot-toast';
import StatusSelect from '../../components/Shared/Dropdowns/StatusSelect';



const ColorManagement = () => {
    // Data State
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest'); // 'name', 'priority', 'newest'

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 5;

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
            setCurrentPage(1); // Reset to page 1 on search
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

    // Helper for Sort Label
    const getSortLabel = () => {
        if (sortOrder === 'name') return 'Name (A-Z)';
        if (sortOrder === 'priority') return 'Priority';
        return 'Newest First';
    };

    // Cycle Sort Order
    const handleSortChange = () => {
        const nextSort = sortOrder === 'newest' ? 'name' : sortOrder === 'name' ? 'priority' : 'newest';
        setSortOrder(nextSort);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 font-sans text-slate-900">
            {/* Top Bar Background */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Color Master</h1>
                        <p className="text-sm text-slate-500 font-medium">Manage solid colors and variants</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search colors..."
                                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all w-64"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Color
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Stats & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Stats Card (Static for now as API doesn't return total counts by status easily without extra calls) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
                            <p className="text-2xl font-black text-slate-900">{totalItems}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                            <SwatchIcon className="w-6 h-6 text-indigo-500" />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center col-span-2 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <FunnelIcon className="w-4 h-4" />
                        </span>
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-3 bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors appearance-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ArrowsUpDownIcon className="w-4 h-4 text-slate-300 transform" />
                        </div>
                    </div>

                    {/* Sort */}
                    <button
                        onClick={handleSortChange}
                        className="bg-white px-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors font-bold text-sm text-slate-600"
                    >
                        <ArrowsUpDownIcon className="w-4 h-4 text-slate-400" />
                        {getSortLabel()}
                        <span className="text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">SORT</span>
                    </button>
                </div>

                {/* Main Table */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Color Info</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Hex Code</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                // Skeleton
                                [1, 2, 3, 4].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded bg-slate-100"></div><div className="h-4 bg-slate-100 w-24 rounded"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 w-16 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 w-12 mx-auto rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-slate-100 w-8 ml-auto rounded"></div></td>
                                    </tr>
                                ))
                            ) : colors.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                                        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <SwatchIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No colors found</h3>
                                        <p className="text-sm mt-1 mb-6">Create your first color or adjust filters.</p>
                                        <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition-colors">
                                            Create New Color
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                colors.map((color) => (
                                    <tr key={color._id} className="group hover:bg-slate-50/80 transition-colors">
                                        {/* Color Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-xl shadow-sm border border-slate-100 ring-1 ring-slate-100 overflow-hidden relative"
                                                    style={{ backgroundColor: color.hexCode }}
                                                >
                                                    {/* Shine/Gloss effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-white/20 pointer-events-none"></div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{color.name}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Solid Color</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Hex Code */}
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleCopyHex(color.hexCode)}
                                                className="group/code flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm text-xs font-mono font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md transition-all active:scale-95 uppercase"
                                                title="Click to copy HEX"
                                            >
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hexCode }}></div>
                                                {color.hexCode}
                                                <ClipboardDocumentIcon className="w-3 h-3 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                            </button>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleStatus(color._id)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${color.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${color.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(color)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit Color"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(color._id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Color"
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

                    {/* Pagination Controls */}
                    {!loading && colors.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <p className="text-sm text-slate-500 font-medium">
                                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-bold text-slate-700">{totalItems}</span> results
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {modalMode === 'create' ? 'Add New Color' : 'Edit Color'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Define visual properties for variants</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                    Color Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Midnight Blue"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:font-normal"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                    Hex Code <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={formData.hexCode}
                                            onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                                            className="w-12 h-12 p-0 border-0 rounded-xl overflow-hidden cursor-pointer shadow-sm ring-1 ring-slate-200"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.hexCode}
                                        onChange={(e) => setFormData({ ...formData, hexCode: e.target.value.toUpperCase() })}
                                        placeholder="#000000"
                                        required
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Priority</label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Status</label>
                                    <StatusSelect
                                        value={formData.status}
                                        onChange={(val) => setFormData({ ...formData, status: val })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold text-sm shadow-md shadow-indigo-600/20"
                                >
                                    {modalMode === 'create' ? 'Create Color' : 'Update Color'}
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
