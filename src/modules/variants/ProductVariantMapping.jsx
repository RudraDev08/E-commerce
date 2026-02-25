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
        const configured = products.filter(p => p.configured).length;
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        border: '1px solid #86EFAC'
                    }}>
                    Configured
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #FCA5A5'
                }}>
                Not Configured
            </span>
        );
    };

    const ProductCell = ({ product }) => {
        const imgUrl = getImageUrl(product.image || product.images?.[0] || product.featuredImage);
        return (
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <PhotoIcon className="h-5 w-5 text-[#9CA3AF]" />
                    )}
                </div>
                <div>
                    <div className="font-semibold text-[14px] text-[#111827]">{product.name}</div>
                    <div className="text-[12px] text-[#6B7280]">{product.brand?.name || 'Unknown Brand'}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20">
            <div className="w-full px-8 py-8">

                {/* PAGE HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                    <div>
                        <h1 className="text-[24px] font-semibold tracking-tight text-[#111827]">
                            Variant Mapping
                        </h1>
                        <p className="mt-1.5 text-[14px] text-[#6B7280]">
                            Configure sizes, colors, and sellable variants for your products.
                        </p>
                    </div>

                    {/* Summary Pills */}
                    <div className="flex items-center gap-2">
                        <div className="px-[14px] py-[6px] bg-[#F3F4F6] border border-[#E5E7EB] rounded-full text-[12px] font-medium text-[#374151]">
                            Total: <span className="font-semibold">{stats.total}</span>
                        </div>
                        <div className="px-[14px] py-[6px] bg-[#ECFDF5] border border-[#A7F3D0] rounded-full text-[12px] font-medium text-[#065F46]">
                            Configured: <span className="font-semibold">{stats.configured}</span>
                        </div>
                        <div className="px-[14px] py-[6px] bg-[#FEF2F2] border border-[#FECACA] rounded-full text-[12px] font-medium text-[#991B1B]">
                            Not Configured: <span className="font-semibold">{stats.notConfigured}</span>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="space-y-6">

                    {/* Search + Filter Card */}
                    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-[#9CA3AF]" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full h-[42px] pl-10 pr-3 border border-[#E5E7EB] rounded-lg bg-white placeholder-[#9CA3AF] text-[#111827] text-sm focus:outline-none focus:ring-[3px] focus:ring-[rgba(79,70,229,0.15)] focus:border-[#4F46E5] transition-all duration-200"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative w-full sm:w-48">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FunnelIcon className="h-4 w-4 text-[#9CA3AF]" />
                                </div>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="block w-full h-[42px] pl-9 pr-10 border border-[#E5E7EB] rounded-lg bg-white text-[#111827] text-sm focus:outline-none focus:ring-[3px] focus:ring-[rgba(79,70,229,0.15)] focus:border-[#4F46E5] hover:border-[#4F46E5] transition-all duration-200 cursor-pointer"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* TABLE CARD */}
                    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">

                        {/* Empty State Banner */}
                        {!loading && filteredProducts.length > 0 && stats.configured === 0 && !searchTerm && (
                            <div className="p-8 border-b border-[#E5E7EB] bg-[#F9FAFB] flex flex-col items-center justify-center text-center">
                                <div className="h-12 w-12 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center mb-4 shadow-sm" style={{ color: '#CBD5E1' }}>
                                    <Square3Stack3DIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-base font-semibold" style={{ color: '#0F172A' }}>No variants configured yet</h3>
                                <p className="mt-2 text-sm max-w-md" style={{ color: '#64748B' }}>
                                    Your products are ready, but they don't have variants (Size/Color) configured yet.
                                    Configure variants to enable inventory management and selling.
                                </p>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#E5E7EB]">
                                <thead className="bg-[#F9FAFB]">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.05em] border-b border-[#E5E7EB]">
                                            Product
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.05em] w-32 border-b border-[#E5E7EB]">
                                            SKU
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.05em] w-40 border-b border-[#E5E7EB]">
                                            Category
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.05em] w-32 border-b border-[#E5E7EB]">
                                            Base Price
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.05em] w-40 border-b border-[#E5E7EB]">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.05em] w-48 border-b border-[#E5E7EB]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#F3F4F6]">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-4 py-4"><div className="h-12 bg-[#F3F4F6] rounded-lg w-full"></div></td>
                                                <td className="px-4 py-4"><div className="h-4 bg-[#F3F4F6] rounded w-20"></div></td>
                                                <td className="px-4 py-4"><div className="h-4 bg-[#F3F4F6] rounded w-24"></div></td>
                                                <td className="px-4 py-4"><div className="h-4 bg-[#F3F4F6] rounded w-16"></div></td>
                                                <td className="px-4 py-4"><div className="h-6 bg-[#F3F4F6] rounded-full w-24"></div></td>
                                                <td className="px-4 py-4"></td>
                                            </tr>
                                        ))
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-12 text-center text-sm text-[#6B7280]">
                                                <CubeIcon className="mx-auto h-12 w-12 text-[#9CA3AF] mb-3" />
                                                No products found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <tr key={product._id} className="hover:bg-[#F9FAFB] transition-all duration-200">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <ProductCell product={product} />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono text-[#6B7280]">
                                                        {product.sku || '---'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-[#6B7280]">
                                                    {product.category?.name || 'Uncategorized'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-[#111827]">
                                                    ₹{product.basePrice || product.price || 0}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <StatusBadge configured={product.configured} />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleConfigure(product)}
                                                        className="inline-flex items-center gap-1.5 h-[36px] px-4 bg-[#4F46E5] text-white text-sm font-medium rounded-lg hover:bg-[#4338CA] focus:outline-none transition-all duration-200"
                                                        style={{ boxShadow: '0 4px 14px rgba(79,70,229,0.25)' }}
                                                    >
                                                        {product.configured ? 'Edit Variants' : 'Configure'}
                                                        {!product.configured && <ArrowRightIcon className="h-3.5 w-3.5" />}
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
                            <div className="bg-[#F9FAFB] px-4 py-4 border-t border-[#F3F4F6] flex items-center justify-between">
                                <div className="text-[13px] text-[#6B7280]">
                                    Showing <span className="font-medium text-[#111827]">{filteredProducts.length}</span> results
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