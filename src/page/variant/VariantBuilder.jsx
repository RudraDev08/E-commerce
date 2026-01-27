import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon,
    CubeIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    SwatchIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { productAPI, sizeAPI, colorAPI, variantAPI } from '../../api/api';
import toast, { Toaster } from 'react-hot-toast';
import ProductSelectDropdown from '../../components/Shared/Dropdowns/ProductSelectDropdown';
import SizeMultiSelectDropdown from '../../components/Shared/Dropdowns/SizeMultiSelectDropdown';
import ColorMultiSelectDropdown from '../../components/Shared/Dropdowns/ColorMultiSelectDropdown';

const VariantBuilder = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    // Data State
    const [product, setProduct] = useState(null);
    const [allSizes, setAllSizes] = useState([]);
    const [allColors, setAllColors] = useState([]);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Generator State
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [isGenerating, setIsGenerating] = useState(true);

    // UI State
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAllData();
    }, [productId]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [prodRes, sizeRes, colorRes, varRes] = await Promise.all([
                productAPI.getById(productId),
                sizeAPI.getAll({ status: 'active' }),
                colorAPI.getAll({ status: 'active' }),
                variantAPI.getByProduct(productId)
            ]);

            const productData = prodRes.data.data || prodRes.data;
            setProduct(productData);
            const loadedSizes = sizeRes.data.data || [];
            const loadedColors = colorRes.data.data || [];
            setAllSizes(loadedSizes);
            setAllColors(loadedColors);

            // Map existing variants to UI structure
            // FIX: Handle Boolean Status (DB) vs String Status (UI)
            const existingArgs = (varRes.data.data || []).map(v => {
                // ROBUST COLOR LOOKUP:
                // 1. Try populated color.hexCode
                // 2. Try finding by ID in loadedColors
                // 3. Try finding by Name in loadedColors (fallback)
                let resolvedHex = '#EEEEEE';

                if (v.color?.hexCode) {
                    resolvedHex = v.color.hexCode;
                } else {
                    const colorId = v.color?._id || (typeof v.color === 'string' ? v.color : null);
                    const colorName = v.attributes?.color || v.color?.name;

                    const matchedColor = loadedColors.find(c =>
                        (colorId && c._id === colorId) ||
                        (colorName && c.name.toLowerCase() === colorName.toLowerCase())
                    );

                    if (matchedColor) resolvedHex = matchedColor.hexCode;
                }

                return {
                    ...v,
                    isNew: false,
                    isEdited: false,
                    sizeCode: v.attributes?.size || v.size?.code || 'N/A',
                    colorName: v.attributes?.color || v.color?.name || 'N/A',
                    colorHex: resolvedHex,
                    price: Number(v.price) || 0,
                    stock: Number(v.stock) || 0,
                    status: (v.status === true || v.status === 'active') ? 'active' : 'inactive'
                };
            });
            setVariants(existingArgs);
        } catch (error) {
            toast.error('Failed to load product data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- GENERATOR LOGIC ---


    const generateVariants = () => {
        if (selectedSizes.length === 0 || selectedColors.length === 0) return;

        // FIX: Robust Base SKU generation
        // Fallback: SKU -> Slug -> Name -> 'PROD'
        let baseRef = product.sku;
        if (!baseRef) {
            const safeSlug = product.slug || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            baseRef = safeSlug.toUpperCase().substring(0, 8);
        }
        if (!baseRef || baseRef.length < 2) baseRef = 'PROD-' + Math.floor(Math.random() * 1000);

        const baseSku = baseRef.replace(/[^A-Z0-9-]/g, '').toUpperCase();

        const newVariants = [];
        let skipped = 0;

        selectedSizes.forEach(size => {
            selectedColors.forEach(color => {
                // Duplicate Check
                const exists = variants.find(v => {
                    const vSize = v.sizeCode || v.attributes?.size;
                    const vColor = v.colorName || v.attributes?.color;
                    return vSize === size.code && vColor === color.name;
                });

                if (exists) {
                    skipped++;
                    return;
                }

                const colorCode = color.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
                const sizeCode = size.code.replace(/[^a-zA-Z0-9]/g, '');
                const genPrice = Number(product.basePrice || product.price || 0);

                newVariants.push({
                    _id: `temp-${Date.now()}-${size.code}-${color.code}`,
                    productId: product._id,
                    sizeId: size._id,
                    colorId: color._id,
                    sizeCode: size.code,
                    sizeName: size.name,
                    colorName: color.name,
                    colorHex: color.hexCode,
                    sku: `${baseSku}-${sizeCode}-${colorCode}`,
                    price: genPrice,
                    stock: 0,
                    status: 'active',
                    isNew: true,
                    isEdited: true
                });
            });
        });

        if (newVariants.length > 0) {
            setVariants(prev => [...prev, ...newVariants]);
            toast.success(`Generated ${newVariants.length} new variants`);
            setSelectedSizes([]);
            setSelectedColors([]);
        } else if (skipped > 0) {
            toast('Combinations already exist', { icon: 'ℹ️' });
        }
    };

    // --- TABLE INTERACTIONS ---
    const updateVariant = (id, field, value) => {
        setVariants(prev => prev.map(v => {
            if (v._id === id) {
                return { ...v, [field]: value, isEdited: true };
            }
            return v;
        }));
    };

    const deleteVariant = (id, isNew) => {
        if (isNew) {
            setVariants(prev => prev.filter(v => v._id !== id));
            toast.success('Variant removed');
        } else {
            const previous = [...variants];
            setVariants(prev => prev.filter(v => v._id !== id));

            variantAPI.delete(id)
                .then(() => toast.success('Variant deleted'))
                .catch(err => {
                    toast.error('Failed to delete');
                    setVariants(previous);
                });
        }
    };

    const saveChanges = async () => {
        const newItems = variants.filter(v => v.isNew);
        const editedItems = variants.filter(v => v.isEdited && !v.isNew);

        if (newItems.length === 0 && editedItems.length === 0) {
            toast('No changes to save');
            return;
        }

        setSaving(true);
        try {
            // Bulk Create New
            if (newItems.length > 0) {
                const payload = {
                    productId: product._id,
                    variants: newItems.map(v => ({
                        attributes: {
                            size: v.sizeName || v.sizeCode,
                            color: v.colorName
                        },
                        sku: v.sku,
                        price: Number(v.price) || 0,
                        stock: Number(v.stock) || 0,
                        status: v.status === 'active' // Convert String to Boolean
                    }))
                };
                await variantAPI.create(payload);
            }

            // Update Edited
            if (editedItems.length > 0) {
                await Promise.all(editedItems.map(v =>
                    variantAPI.update(v._id, {
                        price: Number(v.price),
                        stock: Number(v.stock),
                        sku: v.sku,
                        status: v.status === 'active' // Convert String to Boolean
                    })
                ));
            }

            toast.success('All changes saved!');
            fetchAllData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    // --- STATISTICS ---
    const stats = useMemo(() => {
        return {
            total: variants.length,
            new: variants.filter(v => v.isNew).length,
            stock: variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        };
    }, [variants]);

    const filteredVariants = variants.filter(v => {
        if (filter === 'new') return v.isNew;
        return v.sku.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getImageUrl = (image) => {
        if (!image) return null;
        let path = typeof image === 'string' ? image : image.url;
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;

        let cleanPath = path.replace(/^\//, '');
        // If path is just a filename (no slash), assume it's in uploads
        if (!cleanPath.includes('/') && !cleanPath.includes('\\')) {
            cleanPath = `uploads/${cleanPath}`;
        }

        const baseUrl = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
            : 'http://localhost:5000';

        return `${baseUrl}/${cleanPath}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Loading Builder...</p>
            </div>
        </div>
    );

    if (!product) return <div className="p-10 text-center">Product not found</div>;

    const mainImage = product.image || product.images?.[0];
    const productImageUrl = getImageUrl(mainImage);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/variant-mapping')}
                            className="group p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                {productImageUrl ? (
                                    <img
                                        src={productImageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <CubeIcon className="w-6 h-6 text-slate-300" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 leading-tight">{product.name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {product.sku || 'NO-SKU'}
                                    </span>
                                    {stats.new > 0 && (
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                            Unsaved Changes
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-sm mx-4">
                        <ProductSelectDropdown
                            value={productId}
                            onChange={(newId) => navigate(`/variant-builder/${newId}`)}
                            label=""
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex flex-col items-end border-r border-slate-200 pr-6">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Variants</span>
                            <span className="font-bold text-slate-900 text-xl">{stats.total}</span>
                        </div>
                        <button
                            onClick={saveChanges}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Generator */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible transition-all duration-300">
                    <div
                        className="p-6 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setIsGenerating(!isGenerating)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                                <SparklesIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-lg">Variant Generator</h2>
                                <p className="text-sm text-slate-500">Combine sizes and colors to create new SKUs</p>
                            </div>
                        </div>
                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
                            {isGenerating ? 'Collapse Panel' : 'Expand Panel'}
                        </button>
                    </div>

                    {isGenerating && (
                        <div className="p-8 bg-slate-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                {/* Size Dropdown */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <TagIcon className="w-4 h-4 text-indigo-500" />
                                            Select Sizes
                                        </h3>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {selectedSizes.length} Selected
                                        </span>
                                    </div>
                                    <SizeMultiSelectDropdown
                                        value={selectedSizes.map(s => s._id)}
                                        onChange={(ids) => {
                                            const objects = allSizes.filter(s => ids.includes(s._id));
                                            setSelectedSizes(objects);
                                        }}
                                        label=""
                                    />
                                </div>

                                {/* Color Dropdown */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <SwatchIcon className="w-4 h-4 text-indigo-500" />
                                            Select Colors
                                        </h3>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {selectedColors.length} Selected
                                        </span>
                                    </div>
                                    <ColorMultiSelectDropdown
                                        value={selectedColors.map(c => c._id)}
                                        onChange={(ids) => {
                                            const objects = allColors.filter(c => ids.includes(c._id));
                                            setSelectedColors(objects);
                                        }}
                                        label=""
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end items-center pt-4 border-t border-slate-200">
                                <button
                                    onClick={generateVariants}
                                    disabled={selectedSizes.length === 0 || selectedColors.length === 0}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Generate {selectedSizes.length > 0 && selectedColors.length > 0 ? selectedSizes.length * selectedColors.length : ''} Combinations
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Data Table */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                All Variants
                            </button>
                            <button
                                onClick={() => setFilter('new')}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'new' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Unsaved ({stats.new})
                            </button>
                        </div>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-5 py-2.5 border border-slate-200 rounded-xl text-sm w-full sm:w-72 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Product Spec</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-40">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Stock</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredVariants.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                                            <div className="inline-block p-4 rounded-full bg-slate-50 mb-3">
                                                <CubeIcon className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="font-medium">No variants found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVariants.map((variant) => (
                                        <tr key={variant._id} className={`group transition-all hover:bg-slate-50/80 ${variant.isNew ? 'bg-indigo-50/30' : ''}`}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4" title="Size and Color are fixed. Delete and recreate to change.">
                                                    <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center bg-white shadow-sm flex-shrink-0">
                                                        <div
                                                            className="w-8 h-8 rounded-lg border border-slate-100 shadow-inner"
                                                            style={{ backgroundColor: variant.colorHex }}
                                                            title={variant.colorHex}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 text-lg">{variant.sizeCode}</span>
                                                            <span className="text-slate-300 text-xs">•</span>
                                                            <span className="font-medium text-slate-600">{variant.colorName}</span>
                                                        </div>
                                                        {variant.isNew && (
                                                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded-full shadow-sm">
                                                                <SparklesIcon className="w-3 h-3" />
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(e) => updateVariant(variant._id, 'sku', e.target.value)}
                                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-slate-700 bg-white transition-all hover:border-slate-300"
                                                    placeholder="SKU"
                                                />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="relative group/input">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                                    <input
                                                        type="number"
                                                        value={variant.price}
                                                        onChange={(e) => updateVariant(variant._id, 'price', e.target.value)}
                                                        className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 bg-white group-hover/input:border-slate-300 transition-all"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <input
                                                    type="number"
                                                    value={variant.stock}
                                                    onChange={(e) => updateVariant(variant._id, 'stock', e.target.value)}
                                                    className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold bg-white transition-all ${Number(variant.stock) === 0 ? 'border-amber-200 text-amber-600 bg-amber-50/50' : 'border-slate-200 text-slate-900 hover:border-slate-300'}`}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={() => updateVariant(variant._id, 'status', variant.status === 'active' ? 'inactive' : 'active')}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${variant.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${variant.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => deleteVariant(variant._id, variant.isNew)}
                                                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default VariantBuilder;
