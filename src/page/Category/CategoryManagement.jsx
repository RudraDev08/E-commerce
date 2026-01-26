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
    QueueListIcon
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
    const handleDelete = async (categoryId) => {
        if (!window.confirm("Are you sure? This will delete the category.")) return;
        try {
            const response = await categoryApi.deleteCategory(categoryId);
            if (response.data.success) {
                toast.success('Category deleted');
                fetchCategories();
                fetchStats();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
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

    // Recursive Renderer
    const renderCategoryRow = (category, level = 0, index, total) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedNodes.has(category._id);

        // Search Filter Logic: If searching, always expand relevant nodes or show flat list?
        // Simple tree search is complex. For now, if text search is active, we might fallback to flat search?
        // But backend sends tree.
        // We'll hide non-matching nodes unless children match.
        // For MVP, we'll just render the tree and let user expand.

        const isLastChild = index === total - 1;

        return (
            <div key={category._id} className="group">
                {/* Row Content */}
                <div
                    className={`
                        flex items-center gap-4 px-4 py-3 border-b border-slate-100 transition-all duration-200
                        ${level === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-50'}
                        hover:pl-5 
                    `}
                    style={{ paddingLeft: `${level * 2.5 + 1}rem` }}
                >
                    {/* Tree Connector Lines (Visual enhancement) */}
                    <div className="w-6 flex-shrink-0 flex justify-center">
                        {hasChildren ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleNode(category._id); }}
                                className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-200 text-slate-400'}`}
                            >
                                {isExpanded ? (
                                    <ChevronDownIcon className="w-4 h-4" />
                                ) : (
                                    <ChevronRightIcon className="w-4 h-4" />
                                )}
                            </button>
                        ) : (
                            // Dot for leaf nodes
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        )}
                    </div>

                    {/* Category Info */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.isFeatured ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                            {category.isFeatured ? <StarIconSolid className="w-5 h-5" /> : <FolderIcon className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                                {category.name}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono truncate">/{category.slug}</p>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 w-48">
                        <span className="flex items-center gap-1">
                            {category.children?.length || 0} sub-categories
                        </span>
                    </div>

                    {/* Status Badge */}
                    <div className="w-24">
                        <button
                            onClick={() => toggleStatus(category._id, category.status)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${category.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${category.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                            {category.status === 'active' ? 'Active' : 'Hidden'}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleEdit(category)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Edit Category"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(category._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete Category"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Recursive Children Rendering */}
                {hasChildren && isExpanded && (
                    <div className="relative">
                        {/* Vertical Guide Line for Children */}
                        <div
                            className="absolute border-l-2 border-slate-100 h-full"
                            style={{ left: `${level * 2.5 + 1.75}rem`, top: 0 }}
                        />
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Control Bar */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="relative w-72">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter categories..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {stats.total} Total Categories
                        </div>
                    </div>

                    {/* Headers */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-slate-100/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <div className="pl-2">Hierarchy Name</div>
                        <div className="hidden sm:block w-48">Structure</div>
                        <div className="w-24">Status</div>
                        <div className="w-16 text-right">Action</div>
                    </div>

                    {/* Tree Rows */}
                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Loading hierarchy...</div>
                        ) : categories.length === 0 ? (
                            <div className="p-12 text-center">
                                <FolderIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-900">No Categories Found</h3>
                                <p className="text-slate-500 mt-2 mb-6">Start building your product hierarchy</p>
                                <button onClick={handleCreate} className="text-indigo-600 font-bold hover:underline">Create Root Category</button>
                            </div>
                        ) : (
                            categories
                                .filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase())) // Simple Root Filter for now
                                .map((category, idx) => renderCategoryRow(category, 0, idx, categories.length))
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
