import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    CheckCircleIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    CheckIcon,
    TagIcon
} from '@heroicons/react/24/outline';

import axios from 'axios';
import toast from 'react-hot-toast';
import StatusSelect from '../../components/Shared/Dropdowns/StatusSelect';
import { GripVertical } from 'lucide-react';

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
        <div className="flex flex-col h-full justify-end" ref={containerRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 ml-1">
                {label}
            </label>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full relative flex items-center gap-3 pl-5 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 ${isOpen ? 'ring-4 ring-slate-100 border-slate-300' : 'shadow-sm'}`}
                >
                    {Icon && <Icon className={`w-5 h-5 transition-colors ${isOpen ? activeColor.split(' ')[0] : 'text-slate-400'}`} />}
                    <span className="truncate">{selectedOption.label}</span>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-slate-600' : ''}`} />
                    </span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 focus:outline-none overflow-hidden origin-top max-h-72 overflow-y-auto custom-scrollbar"
                        >
                            {options.map((option) => (
                                <li key={option.value} className="px-2">
                                    <button
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${value === option.value
                                            ? 'bg-slate-50 text-slate-900'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            {option.icon}
                                            {option.label}
                                        </span>
                                        {value === option.value && (
                                            <div className={`w-1.5 h-1.5 rounded-full ${color === 'purple' ? 'bg-purple-500' : color === 'pink' ? 'bg-pink-500' : 'bg-indigo-500'}`} />
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

const SizeMasterManagement = () => {
    // Data State
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sizeGroups, setSizeGroups] = useState([]);

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [filterStatus, setFilterStatus] = useState('active');

    // Pagination State (Managed locally here as backend seems to support sorting but strict pagination might differ)
    // Assuming backend returns all sizes or supports params. We will implement frontend pagination to match the look if API doesn't support page/limit perfectly,
    // BUT ColorManagement uses server-side pagination. Let's try to verify if Size API supports it.
    // The ViewFile showed params.append('page', ...) wasn't there, meaning it fetches ALL and filters.
    // We will implement FRONTEND pagination for consistent 4 items per page look.
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedSize, setSelectedSize] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        fullName: '',
        category: 'generic',
        sizeGroup: '',
        gender: 'unisex',
        displayOrder: 0,
        status: 'active'
    });

    // Constants
    const sizeCategories = [
        { value: '', label: 'All Categories' },
        { value: 'clothing_alpha', label: 'Clothing (Alpha)' },
        { value: 'clothing_numeric', label: 'Clothing (Numeric)' },
        { value: 'shoe_uk', label: 'Shoes (UK)' },
        { value: 'shoe_us', label: 'Shoes (US)' },
        { value: 'shoe_eu', label: 'Shoes (EU)' },
        { value: 'ring', label: 'Ring Sizes' },
        { value: 'belt', label: 'Belt Sizes' },
        { value: 'generic', label: 'Generic' },
        { value: 'custom', label: 'Custom' },
        { value: 'bra', label: 'Bra Sizes' },
        { value: 'electronics', label: 'Electronics' }
    ];

    const genderOptions = [
        { value: '', label: 'All Genders' },
        { value: 'unisex', label: 'Unisex' },
        { value: 'men', label: 'Men' },
        { value: 'women', label: 'Women' },
        { value: 'boys', label: 'Boys' },
        { value: 'girls', label: 'Girls' },
        { value: 'kids', label: 'Kids' },
        { value: 'infant', label: 'Infant' }
    ];

    const statusOptions = [
        { value: 'active', label: 'Active Only' },
        { value: 'inactive', label: 'Inactive Only' },
        { value: '', label: 'All Statuses' } // Adjusted logic to match backend filters
    ];

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
        fetchSizes();
        fetchSizeGroups();
    }, [debouncedSearch, filterCategory, filterGroup, filterGender, filterStatus]);

    const fetchSizes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterCategory) params.append('sizeCategory', filterCategory);
            if (filterGroup) params.append('sizeGroup', filterGroup);
            if (filterGender) params.append('gender', filterGender);
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterStatus) params.append('status', filterStatus);
            params.append('sort', 'displayOrder');

            const { data } = await axios.get(`/api/sizes?${params}`);

            // Handle frontend sort if needed, but backend does displayOrder sort
            setSizes(data.data || []);
        } catch (error) {
            console.error('Error fetching sizes:', error);
            toast.error('Failed to load sizes');
        } finally {
            setLoading(false);
        }
    };

    const fetchSizeGroups = async () => {
        try {
            const { data } = await axios.get('/api/sizes/groups');
            setSizeGroups(data.data.map(g => ({ value: g, label: g })));
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    // Frontend Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sizes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sizes.length / itemsPerPage);

    const handleCreate = () => {
        setFormData({
            name: '',
            code: '',
            fullName: '',
            category: 'generic',
            sizeGroup: '',
            gender: 'unisex',
            displayOrder: 0,
            status: 'active'
        });
        setSelectedSize(null);
        setModalMode('create');
        setShowModal(true);
    };

    const handleEdit = (size) => {
        setFormData({
            name: size.name,
            code: size.code,
            fullName: size.fullName || '',
            category: size.category,
            sizeGroup: size.sizeGroup || '',
            gender: size.gender,
            displayOrder: size.displayOrder || 0,
            status: size.status
        });
        setSelectedSize(size);
        setModalMode('edit');
        setShowModal(true);
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
            fetchSizes();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this size?")) return;
        try {
            await axios.delete(`/api/sizes/${id}`);
            toast.success('Size deleted');
            fetchSizes();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const toggleStatus = async (id) => {
        try {
            await axios.patch(`/api/sizes/${id}/toggle-status`);
            fetchSizes();
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getCategoryBadgeColor = (category) => {
        const colors = {
            clothing_alpha: 'bg-blue-50 text-blue-700 ring-blue-700/10',
            clothing_numeric: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10',
            shoe_uk: 'bg-purple-50 text-purple-700 ring-purple-700/10',
            shoe_us: 'bg-pink-50 text-pink-700 ring-pink-700/10',
            shoe_eu: 'bg-rose-50 text-rose-700 ring-rose-700/10',
            ring: 'bg-amber-50 text-amber-700 ring-amber-700/10',
            belt: 'bg-orange-50 text-orange-700 ring-orange-700/10',
            generic: 'bg-slate-50 text-slate-700 ring-slate-700/10',
            custom: 'bg-teal-50 text-teal-700 ring-teal-700/10',
            bra: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-700/10',
            electronics: 'bg-cyan-50 text-cyan-700 ring-cyan-700/10'
        };
        return colors[category] || 'bg-slate-50 text-slate-700 ring-slate-700/10';
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
            {/* Page Container */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-8">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Size Master</h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Manage global size standards & configurations</p>
                </div>

                <div className="space-y-10">

                    {/* Management Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                        {/* Card 1: Stats */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Sizes</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tight">{sizes.length}</p>
                            </div>
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                                <TagIcon className="w-7 h-7" />
                            </div>
                        </div>

                        {/* Card 2: Filter Category */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-100 transition-all duration-300">
                            <CustomDropdown
                                label="Category"
                                value={filterCategory}
                                options={sizeCategories}
                                onChange={(val) => { setFilterCategory(val); setCurrentPage(1); }}
                                icon={FunnelIcon}
                                color="purple"
                            />
                        </div>

                        {/* Card 3: Filter Status */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-pink-100 transition-all duration-300">
                            <CustomDropdown
                                label="Status"
                                value={filterStatus}
                                options={statusOptions}
                                onChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
                                icon={CheckCircleIcon}
                                color="pink"
                            />
                        </div>

                        {/* Card 4: Actions */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:border-fuchsia-100 transition-all duration-300">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                Actions
                            </label>
                            <button
                                onClick={handleCreate}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-900/10 text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 hover:-translate-y-0.5"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Add New Size
                            </button>
                        </div>
                    </div>

                    {/* Main Table Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Header with Search */}
                        <div className="px-8 py-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Sizes List</h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">{sizes.length} records found</p>
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search sizes..."
                                    className="pl-12 pr-6 py-3 w-full sm:w-80 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Identity</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        Array.from({ length: itemsPerPage }).map((_, i) => (
                                            <tr key={i} className="animate-pulse h-[88px] border-b border-slate-50 last:border-0 relative">
                                                <td className="px-8 py-5"><div className="w-8 h-8 rounded-lg bg-slate-100"></div></td>
                                                <td className="px-6 py-5"><div className="h-4 bg-slate-100 w-24 rounded"></div></td>
                                                <td className="px-6 py-5"><div className="h-6 bg-slate-100 w-20 rounded-full"></div></td>
                                                <td className="px-6 py-5"><div className="h-6 bg-slate-100 w-12 mx-auto rounded-full"></div></td>
                                                <td className="px-6 py-5"></td>
                                            </tr>
                                        ))
                                    ) : currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-24 text-center">
                                                <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <TagIcon className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">No sizes found</h3>
                                                <p className="text-sm text-slate-500 mt-1 mb-6">Get started by adding your first size.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {currentItems.map((size, index) => (
                                                <tr key={size._id} className="group hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0 relative h-[88px]">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <GripVertical size={16} className="text-slate-300 cursor-grab hover:text-indigo-500 transition-colors" />
                                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md min-w-[30px] text-center">
                                                                {size.displayOrder}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900">{size.name}</div>
                                                            <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{size.code} • {size.gender}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getCategoryBadgeColor(size.category)}`}>
                                                            {sizeCategories.find(c => c.value === size.category)?.label || size.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => toggleStatus(size._id)}
                                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${size.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                        >
                                                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${size.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(size)}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(size._id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Fixed Height Padding */}
                                            {currentItems.length > 0 && Array.from({ length: Math.max(0, itemsPerPage - currentItems.length) }).map((_, index) => (
                                                <tr key={`empty-${index}`} className="h-[88px] border-b border-transparent">
                                                    <td colSpan="5">&nbsp;</td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && sizes.length > 0 && (
                            <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                    <span>Showing</span>
                                    <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span>
                                    <span>-</span>
                                    <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, sizes.length)}</span>
                                    <span>of</span>
                                    <span className="font-bold text-slate-900">{sizes.length}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs uppercase tracking-wider shadow-sm group hover:border-slate-300"
                                    >
                                        <ChevronLeftIcon className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                                        Prev
                                    </button>

                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum = i + 1;
                                            if (totalPages > 5 && currentPage > 3) {
                                                pageNum = currentPage - 2 + i;
                                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                            }
                                            if (pageNum <= 0) pageNum = i + 1;

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${currentPage === pageNum
                                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
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
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs uppercase tracking-wider shadow-sm group hover:border-slate-300"
                                    >
                                        Next
                                        <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
                            <h2 className="text-lg font-bold text-slate-900">
                                {modalMode === 'create' ? 'Add New Size' : 'Edit Size'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-all">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Size Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                        placeholder="XL, 32, 10..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Size Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                        placeholder="code-xl..."
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                        placeholder="Extra Large..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {sizeCategories.filter(c => c.value !== '').map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Gender
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {genderOptions.filter(g => g.value !== '').map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Status
                                    </label>
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
                                    {modalMode === 'create' ? 'Create Size' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SizeMasterManagement;
