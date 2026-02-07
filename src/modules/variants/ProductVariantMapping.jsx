import { useState, useEffect, useMemo } from 'react';
import {
    MagnifyingGlassIcon,
    CubeIcon,
    ArrowRightIcon,
    FunnelIcon,
    PhotoIcon,
    Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import { productAPI, categoryAPI } from '../../Api/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProductVariantMapping = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                const [prodRes, catRes] = await Promise.all([
                    productAPI.getAll(),
                    categoryAPI.getAll({ status: 'active' })
                ]);

                if (isMounted) {
                    setProducts(prodRes.data.data || prodRes.data || []);
                    setCategories(catRes.data.data || []);
                }
            } catch (error) {
                if (isMounted) toast.error('Failed to load data');
                console.error(error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, []);

    const handleConfigure = (product) => {
        if (!product?._id) return;
        navigate(`/variant-builder/${product._id}`, { state: { product } });
    };

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------
    const getImageUrl = (image) => {
        if (!image) return null;
        let path = typeof image === 'string' ? image : image.url;
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;

        let cleanPath = path.replace(/^\//, '');
        if (!cleanPath.includes('/') && !cleanPath.includes('\\')) {
            cleanPath = `uploads/${cleanPath}`;
        }

        const baseUrl = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
            : 'http://localhost:5000';

        return `${baseUrl}/${cleanPath}`;
    };

    // Stats
    const stats = useMemo(() => {
        const total = products.length;
        // Use variantCount if available, otherwise fallback to check if hasVariants is true (which is less accurate for "configured" status)
        // Ideally variantCount should be populated from backend
        const configured = products.filter(p => (p.variantCount || 0) > 0).length;
        return {
            total,
            configured,
            notConfigured: total - configured
        };
    }, [products]);

    // Filtering
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            if (filterCategory !== 'all') {
                const cID = product.category?._id || product.category;
                if (cID !== filterCategory) return false;
            }
            const term = searchTerm.toLowerCase().trim();
            if (!term) return true;
            return (product.name?.toLowerCase() || '').includes(term) ||
                (product.sku?.toLowerCase() || '').includes(term);
        });
    }, [products, filterCategory, searchTerm]);

    // ------------------------------------------------------------------
    // UI COMPONENTS
    // ------------------------------------------------------------------

    const StatusBadge = ({ configured }) => {
        if (configured) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Configured
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                Not Configured
            </span>
        );
    };

    const ProductCell = ({ product }) => {
        const imgUrl = getImageUrl(product.image || product.images?.[0] || product.featuredImage);
        return (
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <PhotoIcon className="h-4 w-4 text-gray-300" />
                    )}
                </div>
                <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.brand?.name || 'Unknown Brand'}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* PAGE HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Variant Mapping
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Configure sizes, colors, and sellable variants for your products.
                        </p>
                    </div>

                    {/* Summary Chips */}
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                            Total: <span className="text-gray-900 font-bold">{stats.total}</span>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-medium text-emerald-700">
                            Configured: <span className="font-bold">{stats.configured}</span>
                        </div>
                        <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                            Not Configured: <span className="text-gray-900 font-bold">{stats.notConfigured}</span>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="space-y-6">

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative w-full sm:w-48">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FunnelIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="block w-full pl-9 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">

                        {/* Empty State Banner (If no products configured yet) */}
                        {!loading && filteredProducts.length > 0 && stats.configured === 0 && !searchTerm && (
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                                <div className="h-12 w-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                                    <Square3Stack3DIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">No variants configured yet</h3>
                                <p className="mt-1 text-sm text-gray-500 max-w-md mb-6">
                                    Your products are ready, but they don't have variants (Size/Color) configured yet.
                                    Configure variants to enable inventory management and selling.
                                </p>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                            SKU
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                                            Category
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                            Base Price
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded w-full"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                                <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-24"></div></td>
                                                <td className="px-6 py-4"></td>
                                            </tr>
                                        ))
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                                                <CubeIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                                No products found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <ProductCell product={product} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono text-gray-500">
                                                        {product.sku || '---'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.category?.name || 'Uncategorized'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₹{product.basePrice || product.price || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge configured={(product.variantCount || 0) > 0} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleConfigure(product)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                                                    >
                                                        {(product.variantCount || 0) > 0 ? 'Edit Variants' : 'Configure'}
                                                        {(!product.variantCount || product.variantCount === 0) && <ArrowRightIcon className="h-3.5 w-3.5" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* FOOTER */}
                        {!loading && filteredProducts.length > 0 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-medium">{filteredProducts.length}</span> results
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductVariantMapping;