import { useState, useEffect, useMemo } from 'react';
import {
    MagnifyingGlassIcon,
    CubeIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    FunnelIcon,
    ListBulletIcon,
    Squares2X2Icon,
    SparklesIcon,
    ChevronRightIcon,
    PhotoIcon
} from '@heroicons/react/24/outline';
import { productAPI, categoryAPI } from '../../api/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProductVariantMapping = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); // Default to list for enterprise feel
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            setLoading(true);
            try {
                const response = await productAPI.getAll();
                if (isMounted) {
                    setProducts(response.data.data || response.data || []);
                }
            } catch (error) {
                if (isMounted) toast.error('Failed to load products');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const loadCategories = async () => {
            try {
                const response = await categoryAPI.getAll({ status: 'active' });
                if (isMounted) {
                    setCategories(response.data.data || []);
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };

        loadProducts();
        loadCategories();

        return () => { isMounted = false; };
    }, []);

    const handleSelectProduct = (product) => {
        if (!product?._id) return toast.error("Invalid Product ID");
        navigate(`/variant-builder/${product._id}`, { state: { product } });
    };

    // ------------------------------------------------------------------
    // 🛠️ ROBUST IMAGE RESOLVER (LOGIC UNTOUCHED)
    // ------------------------------------------------------------------
    const getImageUrl = (image) => {
        if (!image) return null;

        let path = '';
        if (typeof image === 'string') {
            path = image;
        } else if (typeof image === 'object' && image.url) {
            path = image.url;
        } else {
            return null;
        }

        if (!path) return null;

        // Return as is if absolute URL or data URI
        if (path.startsWith('http') || path.startsWith('data:')) {
            return path;
        }

        // Clean path and prepend base URL
        const cleanPath = path.replace(/^\//, '');
        const baseUrl = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
            : 'http://localhost:5000';

        return `${baseUrl}/${cleanPath}`;
    };

    const stats = useMemo(() => {
        return {
            total: products.length,
            withVariants: products.filter(p => p.hasVariants).length,
            pending: products.filter(p => !p.hasVariants).length
        };
    }, [products]);

    // Build category options for filter dropdown
    const categoryOptions = useMemo(() => {
        return ['all', ...categories.map(cat => cat._id)];
    }, [categories]);

    // Helper to get category name by ID
    const getCategoryName = (categoryId) => {
        if (!categoryId) return 'Uncategorized';
        const category = categories.find(cat => cat._id === categoryId);
        return category?.name || 'Uncategorized';
    };

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // Category Filter - compare by ID
            if (filterCategory !== 'all') {
                const productCategoryId = product.category?._id || product.category;
                if (productCategoryId !== filterCategory) return false;
            }

            // Search Filter
            const term = searchTerm.toLowerCase().trim();
            if (!term) return true;

            const name = product.name?.toLowerCase() || '';
            const sku = product.sku?.toLowerCase() || '';

            return name.includes(term) || sku.includes(term);
        });
    }, [products, filterCategory, searchTerm]);

    // --- UI SUB-COMPONENTS ---

    const StatusBadge = ({ configured }) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${configured
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {configured ? 'Configured' : 'Pending'}
        </span>
    );

    const ProductImage = ({ product, className }) => {
        const rawImage = product.image || product.images?.[0];
        const imageUrl = getImageUrl(rawImage);

        if (imageUrl) {
            return (
                <img
                    src={imageUrl}
                    alt={product.name}
                    className={`${className} object-cover`}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x600/f3f4f6/9ca3af?text=IMG';
                    }}
                />
            );
        }
        return (
            <div className={`${className} bg-slate-100 flex items-center justify-center text-slate-300`}>
                <PhotoIcon className="w-1/2 h-1/2" />
            </div>
        );
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse border-b border-gray-100">
            <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
            <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-24"></div></td>
            <td className="px-6 py-4"></td>
        </tr>
    );

    const SkeletonCard = () => (
        <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-40 bg-gray-100 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
            <div className="flex justify-between">
                <div className="h-6 bg-gray-100 rounded w-16"></div>
                <div className="h-6 bg-gray-100 rounded-full w-20"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* --- HEADER SECTION --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Variant Mapping
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Configure sizes, colors, and inventory variants.
                        </p>
                    </div>

                    {/* Compact Stats Pill */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm divide-x divide-slate-100 overflow-hidden">
                        <div className="px-4 py-2 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Total</span>
                            <span className="text-sm font-bold text-slate-900">{stats.total}</span>
                        </div>
                        <div className="px-4 py-2 flex items-center gap-2 bg-emerald-50/30">
                            <span className="text-xs font-semibold text-emerald-600 uppercase">Ready</span>
                            <span className="text-sm font-bold text-emerald-700">{stats.withVariants}</span>
                        </div>
                        <div className="px-4 py-2 flex items-center gap-2 bg-amber-50/30">
                            <span className="text-xs font-semibold text-amber-600 uppercase">Pending</span>
                            <span className="text-sm font-bold text-amber-700">{stats.pending}</span>
                        </div>
                    </div>
                </div>

                {/* --- TOOLBAR --- */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row items-center p-1.5 gap-2">
                    {/* Search */}
                    <div className="relative flex-1 w-full md:w-auto">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter by Name, SKU..."
                            className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-sm focus:ring-0 text-slate-700 placeholder-slate-400"
                        />
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-6 bg-slate-100"></div>

                    {/* Category Filter */}
                    <div className="relative w-full md:w-48 group">
                        <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-transparent border-none text-sm focus:ring-0 text-slate-600 font-medium cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* View Toggle (Segmented Control) */}
                    <div className="flex bg-slate-100/80 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all shadow-sm ${viewMode === 'list' ? 'bg-white text-slate-900 shadow' : 'bg-transparent text-slate-400 hover:text-slate-600 shadow-none'}`}
                            title="List View"
                        >
                            <ListBulletIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all shadow-sm ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow' : 'bg-transparent text-slate-400 hover:text-slate-600 shadow-none'}`}
                            title="Grid View"
                        >
                            <Squares2X2Icon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                {loading ? (
                    viewMode === 'list' ? (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full">
                                <tbody>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    )
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-xl border-dashed">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <CubeIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No products found</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            We couldn't find any products matching your filters.
                        </p>
                        <button
                            onClick={() => { setSearchTerm(''); setFilterCategory('all'); }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <SparklesIcon className="w-4 h-4 text-blue-500" />
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* === LIST VIEW === */}
                        {viewMode === 'list' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Img</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredProducts.map((product) => (
                                                <tr
                                                    key={product._id}
                                                    onClick={() => handleSelectProduct(product)}
                                                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-3">
                                                        <ProductImage product={product} className="h-10 w-10 rounded-lg border border-slate-100" />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {product.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                            {product.sku || '---'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 hidden sm:table-cell">
                                                        <span className="text-sm text-slate-500">
                                                            {product.category?.name || product.category || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-sm font-semibold text-slate-700">
                                                            ₹{product.basePrice || product.price || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <StatusBadge configured={product.hasVariants} />
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2 text-slate-400 group-hover:text-blue-600 transition-colors text-xs font-medium opacity-0 group-hover:opacity-100">
                                                            Configure <ChevronRightIcon className="w-4 h-4" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* === GRID VIEW === */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product._id}
                                        onClick={() => handleSelectProduct(product)}
                                        className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col hover:-translate-y-1"
                                    >
                                        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                                            <ProductImage product={product} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute top-3 right-3">
                                                <StatusBadge configured={product.hasVariants} />
                                            </div>
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                    {product.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-xs font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                    {product.sku || 'N/A'}
                                                </span>
                                                {(product.category?.name || product.category) && (
                                                    <span className="text-xs text-slate-400 truncate max-w-[120px]">
                                                        • {product.category?.name || product.category}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <span className="font-bold text-slate-900">
                                                    ₹{product.basePrice || product.price || 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                                    Configure <ArrowRightIcon className="w-3.5 h-3.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Footer Count */}
                {!loading && filteredProducts.length > 0 && (
                    <div className="mt-8 text-center">
                        <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-500">
                            Showing {filteredProducts.length} of {products.length} products
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductVariantMapping;