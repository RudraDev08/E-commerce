import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    SparklesIcon,
    TagIcon,
    SwatchIcon,
    CubeIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { productAPI, sizeAPI, colorAPI } from '../../Api/api';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * ========================================================================
 * VARIANT COMBINATION BUILDER
 * ========================================================================
 * 
 * Purpose: Generate ALL possible combinations of attributes
 * 
 * Example:
 * - Select: 1TB, 512GB (Storage)
 * - Select: 12GB, 8GB (RAM)
 * - Select: Silver, Black (Color)
 * 
 * Result: 8 variants (2 × 2 × 2)
 *   1. 1TB / 12GB / Silver
 *   2. 1TB / 12GB / Black
 *   3. 1TB / 8GB / Silver
 *   4. 1TB / 8GB / Black
 *   5. 512GB / 12GB / Silver
 *   6. 512GB / 12GB / Black
 *   7. 512GB / 8GB / Silver
 *   8. 512GB / 8GB / Black
 * ========================================================================
 */

const VariantCombinationBuilder = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    // Data State
    const [product, setProduct] = useState(null);
    const [allSizes, setAllSizes] = useState([]);
    const [allColors, setAllColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Selection State
    const [selectedStorages, setSelectedStorages] = useState([]);
    const [selectedRAMs, setSelectedRAMs] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);

    // Preview State
    const [preview, setPreview] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [genericConfirm, setGenericConfirm] = useState(null); // { title, message, onConfirm, confirmText, type }

    useEffect(() => {
        fetchData();
    }, [productId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, sizeRes, colorRes] = await Promise.all([
                productAPI.getById(productId),
                sizeAPI.getAll({ status: 'active' }),
                colorAPI.getAll({ status: 'active' })
            ]);

            setProduct(prodRes.data.data || prodRes.data);
            setAllSizes(sizeRes.data.data || []);
            setAllColors(colorRes.data.data || []);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Filter sizes by category
    const storageSizes = allSizes.filter(s => s.category === 'storage');
    const ramSizes = allSizes.filter(s => s.category === 'ram');

    // Calculate total combinations
    const totalCombinations = Math.max(
        (selectedStorages.length || 1) *
        (selectedRAMs.length || 1) *
        selectedColors.length,
        0
    );

    // Preview combinations
    const handlePreview = async () => {
        if (selectedColors.length === 0) {
            toast.error('Please select at least one color');
            return;
        }

        if (selectedStorages.length === 0 && selectedRAMs.length === 0) {
            toast.error('Please select at least one size attribute');
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await axios.post(`${API_URL}/variants/preview-combinations`, {
                productGroup: product.sku || product.name,
                brand: product.brand?.name || 'Unknown',
                storageIds: selectedStorages,
                ramIds: selectedRAMs,
                colorIds: selectedColors
            });

            setPreview(response.data.data);
            setShowPreview(true);
        } catch (error) {
            toast.error('Failed to preview combinations');
        }
    };

    // Generate variants
    const handleGenerate = async () => {
        if (selectedColors.length === 0) {
            toast.error('Please select at least one color');
            return;
        }

        if (selectedStorages.length === 0 && selectedRAMs.length === 0) {
            toast.error('Please select at least one size attribute');
            return;
        }

        const _doGenerate = async () => {
            setGenerating(true);
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const response = await axios.post(`${API_URL}/variants/generate-combinations`, {
                    productGroup: product.sku || product.name,
                    productName: product.name,
                    brand: product.brand?.name || 'Unknown',
                    category: product.category?._id || product.category,
                    storageIds: selectedStorages,
                    ramIds: selectedRAMs,
                    colorIds: selectedColors,
                    basePrice: product.basePrice || product.price || 0,
                    description: product.description || '',
                    specifications: product.specifications || {},
                    images: product.images || []
                });

                const result = response.data.data;

                toast.success(
                    `Successfully generated ${result.totalGenerated} variants!` +
                    (result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : '')
                );

                // Clear selections
                setSelectedStorages([]);
                setSelectedRAMs([]);
                setSelectedColors([]);
                setShowPreview(false);
                setPreview(null);

                // Navigate to variant list
                setTimeout(() => {
                    navigate('/variant-mapping');
                }, 1500);

            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to generate variants');
            } finally {
                setGenerating(false);
            }
        };

        setGenericConfirm({
            title: 'Generate Variants?',
            message: `You are about to create ${totalCombinations} variant combinations. This will populate your inventory with these items. Continue?`,
            confirmText: 'Generate Now',
            onConfirm: _doGenerate
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return <div className="p-10 text-center">Product not found</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="w-full px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/variant-mapping')}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Combination Generator</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full px-8 py-8 space-y-6">
                {/* Instructions */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900 mb-2">How Combination Generator Works</h3>
                            <p className="text-sm text-indigo-700 leading-relaxed">
                                Select multiple options from each category below. The system will automatically generate
                                <strong> ALL possible combinations</strong> as separate sellable variants.
                            </p>
                            <p className="text-sm text-indigo-700 mt-2">
                                <strong>Example:</strong> 2 Storages × 2 RAMs × 2 Colors = <strong>8 unique variants</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Storage Selection */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TagIcon className="w-5 h-5 text-indigo-500" />
                                Storage
                            </h3>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                {selectedStorages.length} selected
                            </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {storageSizes.map(size => (
                                <label
                                    key={size._id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedStorages.includes(size._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStorages([...selectedStorages, size._id]);
                                            } else {
                                                setSelectedStorages(selectedStorages.filter(id => id !== size._id));
                                            }
                                        }}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{size.displayName || size.value}</span>
                                </label>
                            ))}
                            {storageSizes.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-4">No storage sizes available</p>
                            )}
                        </div>
                    </div>

                    {/* RAM Selection */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CubeIcon className="w-5 h-5 text-indigo-500" />
                                RAM
                            </h3>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                {selectedRAMs.length} selected
                            </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {ramSizes.map(size => (
                                <label
                                    key={size._id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedRAMs.includes(size._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedRAMs([...selectedRAMs, size._id]);
                                            } else {
                                                setSelectedRAMs(selectedRAMs.filter(id => id !== size._id));
                                            }
                                        }}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{size.displayName || size.value}</span>
                                </label>
                            ))}
                            {ramSizes.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-4">No RAM sizes available</p>
                            )}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <SwatchIcon className="w-5 h-5 text-indigo-500" />
                                Colors
                            </h3>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                {selectedColors.length} selected
                            </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {allColors.map(color => (
                                <label
                                    key={color._id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedColors.includes(color._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedColors([...selectedColors, color._id]);
                                            } else {
                                                setSelectedColors(selectedColors.filter(id => id !== color._id));
                                            }
                                        }}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-slate-300"
                                        style={{ backgroundColor: color.hexCode }}
                                    />
                                    <span className="text-sm font-medium text-slate-700">{color.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary & Actions */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg mb-1">Ready to Generate</h3>
                            <p className="text-sm text-slate-600">
                                {totalCombinations > 0 ? (
                                    <>
                                        <strong className="text-indigo-600">{totalCombinations}</strong> unique variants will be created
                                    </>
                                ) : (
                                    'Select options above to see combination count'
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePreview}
                                disabled={totalCombinations === 0}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Preview
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={totalCombinations === 0 || generating}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Generate Variants
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreview && preview && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Preview: {preview.totalCombinations} Variants
                                    </h3>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <XCircleIcon className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {preview.previews.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                                        >
                                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {item.displayName}
                                                </p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                    {item.sku}
                                                </p>
                                            </div>
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0"
                                                style={{ backgroundColor: item.color.hexCode }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        handleGenerate();
                                    }}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all"
                                >
                                    Confirm & Generate
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* GENERIC CONFIRMATION MODAL */}
                {genericConfirm && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 scale-in-center">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-indigo-50 text-indigo-600">
                                <SparklesIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{genericConfirm.title || 'Generate Variants?'}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                {genericConfirm.message}
                            </p>
                            <div className="flex gap-3 justify-end font-bold">
                                <button
                                    onClick={() => setGenericConfirm(null)}
                                    className="px-6 py-2.5 text-sm text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        genericConfirm.onConfirm();
                                        setGenericConfirm(null);
                                    }}
                                    className="px-6 py-2.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                                >
                                    {genericConfirm.confirmText || 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VariantCombinationBuilder;
