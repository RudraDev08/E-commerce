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
    SparklesIcon
} from '@heroicons/react/24/outline';
import { productAPI } from '../../api/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProductVariantMapping = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await productAPI.getAll();
            setProducts(response.data.data || response.data || []);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = (product) => {
        navigate(`/variant-builder/${product._id}`, { state: { product } });
    };

    // ------------------------------------------------------------------
    // 🛠️ ROBUST IMAGE RESOLVER
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

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category?.name || p.category).filter(Boolean));
        return ['all', ...Array.from(cats)];
    }, [products]);

    const filteredProducts = products.filter(product => {
        if (filterCategory !== 'all') {
            const cat = product.category?.name || product.category;
            if (cat !== filterCategory) return false;
        }

        const name = product.name || '';
        const sku = product.sku || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sku.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Product Variant Mapping</h1>
                    <p className="text-sm text-gray-600 mt-2">
                        Browse products and configure their size, color, and variant options
                    </p>
                </div>

                {/* Stats Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <CubeIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <CheckBadgeIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">With Variants</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.withVariants}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Setup</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Controls */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by product name or SKU..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer min-w-[180px]"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Squares2X2Icon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <ListBulletIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="py-20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                                    <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-16 text-center shadow-xl shadow-gray-200/40">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200/50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                            <CubeIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">No products found</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                            {searchTerm || filterCategory !== 'all'
                                ? "Try adjusting your search or filter criteria."
                                : "No products available in the catalog."}
                        </p>
                        <button
                            onClick={() => { setSearchTerm(''); setFilterCategory('all'); }}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "space-y-4"
                    }>
                        {filteredProducts.map((product) => {
                            // FIXED: Check 'image' (singular) as per Schema, fallback to 'images' array
                            const rawImage = product.image || product.images?.[0];
                            const imageUrl = getImageUrl(rawImage);

                            return (
                                <div
                                    key={product._id}
                                    onClick={() => handleSelectProduct(product)}
                                    className={`group relative bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-2 ${viewMode === 'grid'
                                        ? 'flex flex-col h-full'
                                        : 'flex items-center p-6'
                                        }`}
                                >
                                    {/* Gradient Overlay on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/3 group-hover:to-purple-500/5 transition-all duration-500"></div>

                                    {/* Product Image */}
                                    <div className={viewMode === 'grid'
                                        ? "relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200/50 overflow-hidden rounded-t-2xl"
                                        : "relative w-24 h-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 flex-shrink-0 overflow-hidden"
                                    }>
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent z-10"></div>
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/600x600/e5e7eb/6b7280?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <CubeIcon className="w-10 h-10 text-gray-400" />
                                            </div>
                                        )}

                                        {/* Variant Status Badge */}
                                        {product.hasVariants && (
                                            <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 z-20">
                                                <CheckBadgeIcon className="w-3.5 h-3.5" />
                                                Configured
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className={viewMode === 'grid'
                                        ? "p-6 flex flex-col flex-1"
                                        : "ml-6 flex-1 min-w-0"
                                    }>
                                        <div className="flex flex-col flex-1">
                                            <div className="mb-4">
                                                <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors ${viewMode === 'grid'
                                                    ? 'text-lg line-clamp-2 mb-2'
                                                    : 'text-lg'
                                                    }`}>
                                                    {product.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-mono tracking-wide bg-gray-100 inline-block px-2 py-1 rounded">
                                                    SKU: {product.sku || 'N/A'}
                                                </p>
                                            </div>

                                            {/* Category Tag */}
                                            {(viewMode === 'grid' || product.category) && (
                                                <div className="mb-5">
                                                    <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
                                                        {product.category?.name || product.category || 'Uncategorized'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Price and Action */}
                                            <div className={`flex items-center justify-between ${viewMode === 'grid'
                                                ? 'mt-auto pt-5 border-t border-gray-100'
                                                : ''
                                                }`}>
                                                <div>
                                                    <span className="text-xl font-black text-gray-900 block">
                                                        ₹{product.basePrice || product.price || 0}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">Base Price</span>
                                                </div>

                                                <button className={`relative overflow-hidden group/btn flex items-center gap-2 bg-slate-900 text-white font-medium transition-all hover:bg-slate-800 ${viewMode === 'grid'
                                                    ? 'px-5 py-2.5 text-sm rounded-xl shadow-lg shadow-slate-900/20'
                                                    : 'px-6 py-3 text-sm rounded-xl'
                                                    }`}>
                                                    <span>Manage</span>
                                                    <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Results Count */}
                {!loading && filteredProducts.length > 0 && (
                    <div className="mt-8 text-center text-sm text-gray-400 font-medium">
                        Showing {filteredProducts.length} of {products.length} products
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductVariantMapping;