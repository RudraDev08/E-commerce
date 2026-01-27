import { useState, useEffect, useMemo } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    FolderIcon,
    EyeIcon,
    ListBulletIcon,
    QueueListIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { FolderIcon as FolderIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import CategoryModal from '../../components/Category/CategoryModal';
import categoryApi from '../../Api/Category/categoryApi';
import toast from 'react-hot-toast';

const CategoryManagement = () => {
    // Data State
    const [categories, setCategories] = useState([]); // Tree structure
    const [stats, setStats] = useState({ total: 0, active: 0, featured: 0 });
    const [loading, setLoading] = useState(false);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'flat' (though backend is tree)
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoryApi.getTree();
            if (response.data.success) {
                setCategories(response.data.data);
                // Requirement: Show ONLY root categories initially (Empty expanded set)
                // However, preserving state if re-fetching could be nice, but strict adherence suggests collapsed.
                // We'll keep existing expansion if possible, or reset if simple.
                // For now, reset to collapsed to match "Show ONLY root" strict requirement.
                // setExpandedNodes(new Set()); 
            }
        } catch (error) {
            toast.error('Failed to load categories');
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
            // silent
        }
    };

    // Actions
    const toggleNode = (categoryId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedNodes(newExpanded);
    };

    const expandAll = () => {
        const allIds = new Set();
        const traverse = (nodes) => {
            nodes.forEach(node => {
                if (node.children?.length > 0) {
                    allIds.add(node._id);
                    traverse(node.children);
                }
            });
        };
        traverse(categories);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    // CRUD Ops
    const handleDelete = (categoryId) => {
        toast((t) => (
            <div className="flex items-center gap-4 min-w-[300px]">
                <div className="flex-1">
                    <h3 className="font-bold text-slate-900">Delete Category?</h3>
                    <p className="text-xs text-slate-500 mt-1">This action cannot be undone.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const response = await categoryApi.deleteCategory(categoryId);
                                if (response.data.success) {
                                    toast.success('Category deleted successfully');
                                    fetchCategories();
                                    fetchStats();
                                }
                            } catch (error) {
                                toast.error(error.response?.data?.message || 'Failed to delete');
                            }
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-center',
            style: {
                background: '#fff',
                color: '#1e293b',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                padding: '16px',
                borderRadius: '16px'
            }
        });
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleCreate = () => {
        setSelectedCategory(null);
        setModalMode('create');
        setShowModal(true);
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await categoryApi.toggleStatus(id);
            toast.success("Status updated");
            fetchCategories();
            fetchStats();
        } catch (e) { toast.error("Failed to update status"); }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (modalMode === 'create') {
                await categoryApi.createCategory(formData);
                toast.success('Category created');
            } else {
                await categoryApi.updateCategory(selectedCategory._id, formData);
                toast.success('Category updated');
            }
            fetchCategories();
            fetchStats();
            setShowModal(false);
        } catch (error) {
            throw error;
        }
    };

    // Search & Filter Logic
    const filteredTree = useMemo(() => {
        if (!searchTerm.trim()) return categories;

        const filterNodes = (nodes) => {
            return nodes.reduce((acc, node) => {
                const matchesSelf = node.name.toLowerCase().includes(searchTerm.toLowerCase());
                const filteredChildren = node.children ? filterNodes(node.children) : [];

                if (matchesSelf || filteredChildren.length > 0) {
                    acc.push({ ...node, children: filteredChildren });
                }
                return acc;
            }, []);
        };

        return filterNodes(categories);
    }, [categories, searchTerm]);

    // Auto-expand on search
    useEffect(() => {
        if (searchTerm.trim()) {
            const allIds = new Set();
            const collectIds = (nodes) => {
                nodes.forEach(node => {
                    allIds.add(node._id);
                    if (node.children) collectIds(node.children);
                });
            };
            collectIds(filteredTree);
            setExpandedNodes(allIds);
        }
    }, [searchTerm, filteredTree]);

    // Recursive Renderer
    const renderCategoryRow = (category, level = 0, index, total) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedNodes.has(category._id);
        const isLastChild = index === total - 1;

        return (
            <div key={category._id} className="group relative">
                {/* Row Content */}
                <div
                    className={`
                        relative flex items-center gap-4 px-4 py-3 border-b border-transparent transition-all duration-200
                        ${level === 0 ? 'bg-white' : ''}
                        hover:bg-indigo-50/30
                    `}
                    style={{ paddingLeft: `${level * 2.5 + 1.5}rem` }}
                >
                    {/* Tree Connector Guidelines (L-Shape) for children */}
                    {level > 0 && (
                        <>
                            {/* Vertical line from parent */}
                            <div
                                className="absolute border-l-2 border-slate-200"
                                style={{
                                    left: `${(level - 1) * 2.5 + 2.25}rem`,
                                    top: '-1rem', // Connect to previous row
                                    height: isLastChild ? '2.5rem' : '100%', // Stop halfway if last child
                                    width: '1px'
                                }}
                            />
                            {/* Horizontal curve to item */}
                            <div
                                className="absolute border-b-2 border-l-2 border-slate-200 rounded-bl-xl z-0"
                                style={{
                                    left: `${(level - 1) * 2.5 + 2.25}rem`,
                                    top: '-0.1rem',
                                    height: '2.1rem',
                                    width: '1.5rem'
                                }}
                            />
                        </>
                    )}

                    {/* Expander / Icon */}
                    <div className="relative z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        {hasChildren ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleNode(category._id); }}
                                className={`
                                    w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200
                                    ${isExpanded ? 'bg-indigo-100/80 text-indigo-600 rotate-0' : 'hover:bg-slate-200 text-slate-400 -rotate-90'}
                                `}
                            >
                                <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
                            </button>
                        ) : (
                            // Leaf node indicator
                            <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-200 transition-colors"></div>
                        )}
                    </div>

                    {/* Category Info */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className={`
                            p-2 rounded-lg transition-colors
                            ${category.isFeatured ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm'}
                        `}>
                            {category.isFeatured ? <StarIconSolid className="w-5 h-5" /> : <FolderIcon className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                                {category.name}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono truncate group-hover:text-slate-500">/{category.slug}</p>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 w-48">
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md group-hover:bg-white transition-colors">
                            <span className="font-bold text-slate-700">{category.children?.length || 0}</span> subs
                        </span>
                        {category.priority > 0 && <span className="text-slate-400">#{category.priority}</span>}
                    </div>

                    {/* Status Badge */}
                    <div className="w-24">
                        <button
                            onClick={() => toggleStatus(category._id, category.status)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${category.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${category.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                            {category.status === 'active' ? 'Active' : 'Hidden'}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 w-16">
                        <button
                            onClick={() => handleEdit(category)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Category"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(category._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Category"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Recursive Children Rendering */}
                {hasChildren && isExpanded && (
                    <div className="relative">
                        {category.children.map((child, idx) =>
                            renderCategoryRow(child, level + 1, idx, category.children.length)
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Organize your catalog hierarchy</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={expandAll}
                        className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Collapse All
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Category
                    </button>
                </div>
            </div>

            {/* Tree Table Container */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    {/* Sticky Header Group */}
                    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200">
                        {/* Control Bar */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="relative w-72 group">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filter categories..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-slate-600">
                                        {stats.active} Active
                                    </span>
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                    {stats.total} Total
                                </div>
                            </div>
                        </div>

                        {/* Headers */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-slate-100/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <div className="pl-2">Hierarchy Name</div>
                            <div className="hidden sm:block w-48">Structure</div>
                            <div className="w-24">Status</div>
                            <div className="w-16 text-right">Action</div>
                        </div>
                    </div>

                    {/* Tree Rows */}
                    <div className="divide-y divide-slate-50 flex-1 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10">
                                <div className="flex flex-col items-center">
                                    <ArrowPathIcon className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                                    <p className="text-sm font-medium text-slate-500">Loading catalog...</p>
                                </div>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <FolderIcon className="w-16 h-16 text-slate-200 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900">No Categories Found</h3>
                                <p className="text-slate-500 mt-2 mb-6 max-w-xs mx-auto">
                                    Get started by creating your first root category to organize your products.
                                </p>
                                <button onClick={handleCreate} className="text-indigo-600 font-bold hover:underline">
                                    Create Root Category
                                </button>
                            </div>
                        ) : filteredTree.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <MagnifyingGlassIcon className="w-12 h-12 text-slate-200 mb-4" />
                                <h3 className="text-base font-bold text-slate-900">No matches found</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    No categories match "{searchTerm}"
                                </p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    Clear Search
                                </button>
                            </div>
                        ) : (
                            filteredTree.map((category, idx) => renderCategoryRow(category, 0, idx, filteredTree.length))
                        )}
                    </div>
                </div>
            </div>

            <CategoryModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleModalSubmit}
                category={selectedCategory}
                mode={modalMode}
                allCategories={categories} // Passing Tree, Modal will flatten it
            />
        </div>
    );
};

export default CategoryManagement;
