import { useState, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    FolderIcon,
    EyeIcon,
    EyeSlashIcon,
    StarIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { FolderIcon as FolderIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import CategoryModal from '../../components/Category/CategoryModal';
import categoryApi from '../../Api/Category/categoryApi';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, featured: 0 });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterTag, setFilterTag] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [notification, setNotification] = useState(null);

    // Fetch categories from backend
    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching categories from API...');

            const response = await categoryApi.getTree();
            console.log('📦 API Response:', response);
            console.log('📦 Response data:', response.data);

            if (response.data.success) {
                console.log('✅ Success! Categories:', response.data.data);
                console.log('📊 Number of categories:', response.data.data.length);

                setCategories(response.data.data);

                // Auto-expand all categories that have children
                const expandAll = (cats) => {
                    const expanded = new Set();
                    const traverse = (categories) => {
                        categories.forEach(cat => {
                            if (cat.children && cat.children.length > 0) {
                                expanded.add(cat._id);
                                traverse(cat.children);
                            }
                        });
                    };
                    traverse(cats);
                    return expanded;
                };

                const expandedSet = expandAll(response.data.data);
                console.log('🔓 Auto-expanding categories:', expandedSet);
                setExpandedNodes(expandedSet);
            } else {
                console.error('❌ API returned success: false');
            }
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            showNotification('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await categoryApi.getStats();
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    // Toggle node expansion
    const toggleNode = (categoryId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedNodes(newExpanded);
    };

    // Toggle category status
    const toggleStatus = async (categoryId) => {
        try {
            const response = await categoryApi.toggleStatus(categoryId);
            if (response.data.success) {
                showNotification(response.data.message);
                fetchCategories();
                fetchStats();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            showNotification(error.response?.data?.message || 'Failed to toggle status', 'error');
        }
    };

    // Toggle featured
    const toggleFeatured = async (categoryId) => {
        try {
            const response = await categoryApi.toggleFeatured(categoryId);
            if (response.data.success) {
                showNotification(response.data.message);
                fetchCategories();
                fetchStats();
            }
        } catch (error) {
            console.error('Error toggling featured:', error);
            showNotification(error.response?.data?.message || 'Failed to toggle featured', 'error');
        }
    };

    // Delete category
    const handleDelete = async (categoryId) => {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            const response = await categoryApi.deleteCategory(categoryId);
            if (response.data.success) {
                showNotification(response.data.message);
                fetchCategories();
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showNotification(error.response?.data?.message || 'Failed to delete category', 'error');
        }
    };

    // Edit category
    const handleEdit = (category) => {
        setSelectedCategory(category);
        setModalMode('edit');
        setShowModal(true);
    };

    // Create new category
    const handleCreate = () => {
        setSelectedCategory(null);
        setModalMode('create');
        setShowModal(true);
    };

    // Handle modal submit
    const handleModalSubmit = async (formData) => {
        try {
            let response;
            if (modalMode === 'create') {
                response = await categoryApi.createCategory(formData);
            } else {
                response = await categoryApi.updateCategory(selectedCategory._id, formData);
            }

            if (response.data.success) {
                showNotification(response.data.message);
                fetchCategories();
                fetchStats();
                return Promise.resolve();
            }
        } catch (error) {
            console.error('Error submitting category:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save category';
            showNotification(errorMessage, 'error');
            return Promise.reject(new Error(errorMessage));
        }
    };

    // Render category row
    const renderCategory = (category, level = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedNodes.has(category._id);

        return (
            <div key={category._id}>
                {/* Category Row */}
                <div
                    className={`
            flex items-center gap-3 px-5 py-3.5 border-b border-slate-100
            hover:bg-slate-50 transition-colors
            ${level > 0 ? 'bg-slate-50/50' : 'bg-white'}
          `}
                    style={{ paddingLeft: `${level * 2 + 1.25}rem` }}
                >
                    {/* Expand/Collapse */}
                    <div className="w-6 flex-shrink-0">
                        {hasChildren && (
                            <button
                                onClick={() => toggleNode(category._id)}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDownIcon className="w-4 h-4 text-slate-600" />
                                ) : (
                                    <ChevronRightIcon className="w-4 h-4 text-slate-600" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Icon & Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {category.isFeatured ? (
                            <FolderIconSolid className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        ) : (
                            <FolderIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-slate-900 truncate">
                                    {category.name}
                                </h3>
                                {category.isFeatured && (
                                    <StarIconSolid className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">/{category.slug}</p>
                        </div>
                    </div>

                    {/* Product Count */}
                    <div className="hidden sm:block text-xs text-slate-500 w-20 text-center">
                        {category.productCount || 0} items
                    </div>

                    {/* Tags */}
                    <div className="hidden md:flex gap-1 w-32">
                        {category.tags?.slice(0, 2).map((tag, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Status */}
                    <div className="w-24">
                        <button
                            onClick={() => toggleStatus(category._id)}
                            className={`
                px-3 py-1 rounded-full text-xs font-semibold transition-colors
                ${category.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }
              `}
                        >
                            {category.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => toggleFeatured(category._id)}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Toggle Featured"
                        >
                            {category.isFeatured ? (
                                <StarIconSolid className="w-4 h-4 text-amber-500" />
                            ) : (
                                <StarIcon className="w-4 h-4 text-slate-400" />
                            )}
                        </button>
                        <button
                            onClick={() => handleEdit(category)}
                            className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <PencilIcon className="w-4 h-4 text-indigo-600" />
                        </button>
                        <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <TrashIcon className="w-4 h-4 text-red-600" />
                        </button>
                    </div>
                </div>

                {/* Render Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {category.children.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
            {/* Header - Fixed at top */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>
                            <p className="text-sm text-slate-600 mt-1">
                                Manage product categories and hierarchy
                            </p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md active:scale-95"
                        >
                            <PlusIcon className="w-5 h-5" />
                            New Category
                        </button>
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div className="px-6 pb-4">
                        <div className={`p-4 rounded-lg border ${notification.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-green-50 border-green-200 text-green-700'
                            }`}>
                            <div className="flex items-center gap-2">
                                {notification.type === 'error' ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <p className="font-medium">{notification.message}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Total Categories</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-xl">
                                    <FolderIconSolid className="w-8 h-8 text-indigo-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Active</p>
                                    <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.active}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl">
                                    <EyeIcon className="w-8 h-8 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Featured</p>
                                    <p className="text-3xl font-bold text-amber-600 mt-2">{stats.featured}</p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl">
                                    <StarIconSolid className="w-8 h-8 text-amber-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search categories..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                                <option value="priority">Sort by Priority</option>
                                <option value="products">Sort by Products</option>
                            </select>
                        </div>
                    </div>

                    {/* Category List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Table Header */}
                        <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
                            <div className="w-6"></div>
                            <div className="flex-1 text-xs font-bold text-slate-700 uppercase tracking-wider">Category</div>
                            <div className="hidden sm:block w-20 text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Products</div>
                            <div className="hidden md:block w-32 text-xs font-bold text-slate-700 uppercase tracking-wider">Tags</div>
                            <div className="w-24 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</div>
                            <div className="w-32 text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</div>
                        </div>

                        {/* Category Rows */}
                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="py-16 text-center">
                                    <div className="inline-block w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    <p className="mt-4 text-sm font-medium text-slate-500">Loading categories...</p>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                                        <FolderIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-900">No categories</h3>
                                    <p className="mt-2 text-sm text-slate-500">Get started by creating a new category</p>
                                    <button
                                        onClick={handleCreate}
                                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Create Category
                                    </button>
                                </div>
                            ) : (
                                categories.map(category => renderCategory(category))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Modal */}
            <CategoryModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleModalSubmit}
                category={selectedCategory}
                mode={modalMode}
                allCategories={categories}
            />
        </div>
    );
};

export default CategoryManagement;
