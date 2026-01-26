import { useState, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    SwatchIcon, // For color icon
    FunnelIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { colorAPI } from '../../api/api';
import toast from 'react-hot-toast';

const ColorManagement = () => {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
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

    useEffect(() => {
        loadColors();
    }, [filterStatus]);

    const loadColors = async () => {
        setLoading(true);
        try {
            const params = filterStatus !== 'all' ? { status: filterStatus } : {};
            const response = await colorAPI.getAll(params);
            setColors(response.data.data || []);
        } catch (error) {
            toast.error('Failed to load colors');
            setColors([]);
        } finally {
            setLoading(false);
        }
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
            toast.success('Color deleted successfully');
            loadColors();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const toggleStatus = async (id) => {
        try {
            await colorAPI.toggleStatus(id);
            toast.success('Status updated');
            loadColors();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredColors = colors.filter(color => {
        const term = searchTerm.toLowerCase();
        return color.name.toLowerCase().includes(term) || color.hexCode.toLowerCase().includes(term);
    });

    const activeCount = colors.filter(c => c.status === 'active').length;
    const inactiveCount = colors.filter(c => c.status === 'inactive').length;

    // UI Components
    const StatusBadge = ({ status }) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {status === 'active' ? 'Active' : 'Inactive'}
        </span>
    );

    const TableSkeleton = () => (
        <>{[1, 2, 3].map(i => (
            <tr key={i} className="animate-pulse border-b border-gray-100"><td className="px-6 py-4" colSpan="4"><div className="h-8 bg-gray-100 rounded"></div></td></tr>
        ))}</>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Color Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage color palette and hex codes.</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm hover:shadow-md"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Color
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Colors', value: colors.length, icon: SwatchIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Active', value: activeCount, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Inactive', value: inactiveCount, icon: XCircleIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search colors..."
                                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="relative min-w-[180px]">
                            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                        <button
                            onClick={loadColors}
                            className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200 md:border-transparent"
                            title="Refresh"
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Color Info</th>
                                    <th className="px-6 py-4">Hex Code</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <TableSkeleton />
                                ) : filteredColors.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                    <SwatchIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-lg font-medium text-gray-900">No colors found</p>
                                                <p className="text-sm mt-1">Create your first color.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredColors.map((color) => (
                                        <tr key={color._id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
                                                        style={{ backgroundColor: color.hexCode }}
                                                    />
                                                    <span className="font-medium text-gray-900">{color.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 font-mono">
                                                    {color.hexCode}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={color.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => toggleStatus(color._id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Toggle Status">
                                                        <ArrowPathIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleEdit(color)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(color._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                        <TrashIcon className="w-4 h-4" />
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

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4">
                            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{modalMode === 'create' ? 'Add Color' : 'Edit Color'}</h2>
                                        <p className="text-sm text-gray-500 mt-1">Define color properties.</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><XMarkIcon className="w-6 h-6" /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Color Name *</label>
                                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm" placeholder="e.g. Midnight Blue" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hex Code *</label>
                                        <div className="flex gap-3">
                                            <input type="color" value={formData.hexCode} onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })} className="h-[42px] w-[60px] cursor-pointer rounded-xl border border-gray-300" />
                                            <input type="text" value={formData.hexCode} onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })} required className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm uppercase font-mono" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                                        <input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} min="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                                        <div className="flex gap-4">
                                            {['active', 'inactive'].map(status => (
                                                <label key={status} className={`flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl border cursor-pointer transition-all ${formData.status === status ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                                                    <input type="radio" value={status} checked={formData.status === status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="sr-only" />
                                                    <span className="capitalize text-sm font-semibold">{status}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                                        <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">{modalMode === 'create' ? 'Create' : 'Save'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColorManagement;
