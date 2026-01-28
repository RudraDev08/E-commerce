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
    TagIcon,
    XMarkIcon
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

    // Generator State (Shared)
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(true);

    // Generator State (Single Color)
    const [selectedColors, setSelectedColors] = useState([]);

    // Generator State (Colorway)
    const [colorwayName, setColorwayName] = useState('');
    const [colorwayPalette, setColorwayPalette] = useState([]); // Array of Color Objects

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
            // -----------------------------------------------------
            const existingArgs = (varRes.data.data || []).map(v => {
                // Determine if this is a legacy variant (single) or new colorway
                const isColorway = !!v.colorwayName || (v.colorParts && v.colorParts.length > 0);

                // Color Logic
                let displayColorName = 'N/A';
                let displayHex = null; // Single Hex
                let displayPalette = []; // Array of Hexes

                if (isColorway) {
                    displayColorName = v.colorwayName || 'Custom Colorway';
                    // Map populated colorParts to hexes
                    if (v.colorParts && v.colorParts.length > 0) {
                        displayPalette = v.colorParts.map(cp => cp.hexCode || '#eee');
                    }
                } else {
                    // Single Color
                    const cId = v.colorId || (typeof v.color === 'string' ? v.color : v.color?._id);
                    const matchedColor = loadedColors.find(c => c._id === cId);
                    displayColorName = v.attributes?.color || matchedColor?.name || 'N/A';
                    displayHex = matchedColor?.hexCode || '#eee';
                }

                return {
                    ...v, // Keep original DB fields
                    isNew: false,
                    isEdited: false,

                    // Unified UI Fields
                    sizeCode: v.attributes?.size || v.size?.code || 'N/A',

                    // Render Hints
                    isColorway,
                    displayColorName,
                    displayHex,      // Used if Single
                    displayPalette,  // Used if Colorway

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
        if (selectedSizes.length === 0) return;

        const isColorwayMode = product.variantType === 'COLORWAY';

        // Validation based on Mode
        if (isColorwayMode) {
            if (!colorwayName) { toast.error("Colorway Name is required"); return; }
            if (colorwayPalette.length === 0) { toast.error("Select at least 1 color for the palette"); return; }
        } else {
            if (selectedColors.length === 0) { toast.error("Select at least 1 color"); return; }
        }

        // Base SKU Logic
        let baseRef = product.sku;
        if (!baseRef) {
            const safeSlug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            baseRef = safeSlug.toUpperCase().substring(0, 8);
        }
        if (!baseRef || baseRef.length < 2) baseRef = 'PROD-' + Math.floor(Math.random() * 1000);
        const baseSku = baseRef.replace(/[^A-Z0-9-]/g, '').toUpperCase();

        const newVariants = [];
        let skipped = 0;

        // Generator Loop
        selectedSizes.forEach(size => {
            const sizeCode = size.code.replace(/[^a-zA-Z0-9]/g, '');
            const genPrice = Number(product.basePrice || product.price || 0);

            if (isColorwayMode) {
                // ------------------------------------
                // MODE: COLORWAY (One Concept, Multiple Sizes)
                // ------------------------------------

                // Duplicate Check (Same Size + Same Colorway Name)
                const exists = variants.find(v =>
                    (v.sizeCode === size.code) &&
                    (v.displayColorName.toLowerCase() === colorwayName.toLowerCase())
                );

                if (exists) {
                    skipped++;
                    return;
                }

                // SKU: MODEL-SIZE-COLORWAY (e.g. J4-US9-CHI)
                const colorwayCode = colorwayName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X');

                const tempId = `temp-${Date.now()}-${size._id}`; // Date.now() is safer here as user clicks once per "concept"

                newVariants.push({
                    _id: tempId,
                    productId: product._id,
                    variantType: 'COLORWAY',

                    // Identity
                    sizeId: size._id,
                    sizeCode: size.code,

                    // Color Data
                    colorwayName: colorwayName,
                    colorParts: colorwayPalette, // Store full objects for UI, extract IDs on save

                    // UI Helpers
                    isColorway: true,
                    displayColorName: colorwayName,
                    displayPalette: colorwayPalette.map(c => c.hexCode),

                    // Biz Data
                    sku: `${baseSku}-${sizeCode}-${colorwayCode}`,
                    price: genPrice,
                    stock: 0,
                    status: 'active',
                    isNew: true,
                    isEdited: true
                });

            } else {
                // ------------------------------------
                // MODE: SINGLE COLOR (Matrix: Sizes x Colors)
                // ------------------------------------
                selectedColors.forEach(color => {
                    // Duplicate Check
                    const exists = variants.find(v => {
                        return v.sizeCode === size.code && v.displayColorName === color.name;
                    });

                    if (exists) {
                        skipped++;
                        return;
                    }

                    const colorCode = color.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
                    const tempId = `temp-${size._id}-${color._id}`;

                    newVariants.push({
                        _id: tempId,
                        productId: product._id,
                        variantType: 'SINGLE_COLOR',

                        sizeId: size._id,
                        sizeCode: size.code,

                        colorId: color._id,
                        colorName: color.name, // Legacy helper

                        isColorway: false,
                        displayColorName: color.name,
                        displayHex: color.hexCode,

                        sku: `${baseSku}-${sizeCode}-${colorCode}`,
                        price: genPrice,
                        stock: 0,
                        status: 'active',
                        isNew: true,
                        isEdited: true
                    });
                });
            }
        });

        if (newVariants.length > 0) {
            setVariants(prev => [...prev, ...newVariants]);
            toast.success(`Generated ${newVariants.length} new variants`);

            // Clear inputs based on mode
            setSelectedSizes([]);
            if (isColorwayMode) {
                // Keep the colorway name/palette? Usually user wants to add same shoe in different sizes.
                // Or maybe they want to switch colorways. Let's clear Name to be safe.
                setColorwayName('');
                // Keep Palette? Maybe not.
                setColorwayPalette([]);
            } else {
                setSelectedColors([]);
            }
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
                    variants: newItems.map(v => {
                        const base = {
                            attributes: {
                                size: v.sizeCode,
                                color: v.displayColorName // Fallback for legacy search
                            },
                            sizeId: v.sizeId,
                            sku: v.sku,
                            price: Number(v.price) || 0,
                            stock: Number(v.stock) || 0,
                            status: v.status === 'active'
                        };

                        // Add Type Specifics
                        if (v.isColorway) {
                            base.colorwayName = v.colorwayName;
                            base.colorParts = v.colorParts.map(c => c._id); // Extract IDs
                        } else {
                            base.colorId = v.colorId;
                        }

                        return base;
                    })
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
                        status: v.status === 'active'
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
    const isColorwayMode = product.variantType === 'COLORWAY';

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
                                    <img src={productImageUrl} alt="" className="w-full h-full object-cover" />
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
                                    {/* Strategy Badge */}
                                    {isColorwayMode ? (
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 uppercase">
                                            Colorway Strategy
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                                            Single Color Strategy
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
                                <p className="text-sm text-slate-500">
                                    {isColorwayMode
                                        ? "Create defined colorways for multiple sizes"
                                        : "Combine sizes and colors to create new SKUs"
                                    }
                                </p>
                            </div>
                        </div>
                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
                            {isGenerating ? 'Collapse Panel' : 'Expand Panel'}
                        </button>
                    </div>

                    {isGenerating && (
                        <div className="p-8 bg-slate-50/30">
                            {/* DYNAMIC GENERATOR UI */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">

                                {/* 1. Size Dropdown (Common) */}
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

                                {/* 2. Color Logic (Conditional) */}
                                {isColorwayMode ? (
                                    // MODE: COLORWAY COMPOSER
                                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-5">

                                        {/* Name Input */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                Colorway Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                placeholder="e.g. 'Chicago', 'Panda', 'Triple Black'"
                                                value={colorwayName}
                                                onChange={(e) => setColorwayName(e.target.value)}
                                            />
                                        </div>

                                        <div className="border-t border-slate-100 pt-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <SwatchIcon className="w-4 h-4 text-indigo-500" />
                                                    Composition
                                                </h3>
                                                <span className="text-xs font-medium text-slate-400">
                                                    {colorwayPalette.length} Parts
                                                </span>
                                            </div>

                                            {/* Composite List */}
                                            <div className="space-y-2 mb-4">
                                                {colorwayPalette.map((color, index) => (
                                                    <div
                                                        key={`${color._id}-${index}`}
                                                        className="group flex items-center justify-between p-2 pl-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">

                                                            {/* Index / Primary Badge */}
                                                            {index === 0 ? (
                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                                                                    Primary
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100 min-w-[24px] text-center">
                                                                    Part {index + 1}
                                                                </span>
                                                            )}

                                                            {/* Color Preview */}
                                                            <div
                                                                className="w-6 h-6 rounded-full border border-slate-200 shadow-sm"
                                                                style={{ backgroundColor: color.hexCode }}
                                                            />

                                                            {/* Details */}
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-700 leading-none">
                                                                    {color.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                                                                    {color.hexCode}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                const newPalette = [...colorwayPalette];
                                                                newPalette.splice(index, 1);
                                                                setColorwayPalette(newPalette);
                                                            }}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                            title="Remove part"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {colorwayPalette.length === 0 && (
                                                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center">
                                                        <p className="text-xs font-medium text-slate-400">No colors added yet.</p>
                                                        <p className="text-[10px] text-slate-300">Add colors to build the palette.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add Color Dropdown (Re-using MultiSelect logic or simplified) */}
                                            {/* Ideally this should be a simplified "Pick one to append" dropdown. 
                                                For now we re-purpose the existing one but strictly handle "Append".
                                            */}
                                            <div className="relative">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Add Part</label>
                                                <select
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                                                    onChange={(e) => {
                                                        const cId = e.target.value;
                                                        if (!cId) return;
                                                        const color = allColors.find(c => c._id === cId);
                                                        if (color) {
                                                            // Verify it's not already in (or allow duplicates if "Part Name" logic existed?)
                                                            // For now, prevent exact duplicates for simplicity/safety
                                                            if (colorwayPalette.find(p => p._id === cId)) {
                                                                toast('Color already in palette', { icon: '⚠️' });
                                                            } else {
                                                                setColorwayPalette(prev => [...prev, color]);
                                                            }
                                                        }
                                                        e.target.value = ""; // Reset
                                                    }}
                                                >
                                                    <option value="">+ Select Color to Add</option>
                                                    {allColors.map(c => (
                                                        <option key={c._id} value={c._id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // MODE: SINGLE COLOR MATRIX
                                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                                <SwatchIcon className="w-4 h-4 text-indigo-500" />
                                                Select Colors
                                            </h3>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                                {selectedColors.length} Selected
                                            </span>
                                        </div>
                                        <div className="min-h-[200px]">
                                            <ColorMultiSelectDropdown
                                                value={selectedColors.map(c => c._id)}
                                                onChange={(ids) => {
                                                    const objects = allColors.filter(c => ids.includes(c._id));
                                                    setSelectedColors(objects);
                                                }}
                                                label=""
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                                            This will generate <strong>{selectedColors.length * selectedSizes.length}</strong> unique SKUs (1 per size-color combination).
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end items-center pt-4 border-t border-slate-200">
                                <button
                                    onClick={generateVariants}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Generate Variants
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
                                                <div className="flex items-center gap-4">
                                                    {/* VISUAL IDENTITY (DOTS vs PALETTE) */}
                                                    <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center bg-white shadow-sm flex-shrink-0 relative overflow-hidden">
                                                        {variant.isColorway ? (
                                                            // COLORWAY PALETTE VISUAL
                                                            <div className="flex flex-wrap w-full h-full">
                                                                {variant.displayPalette.slice(0, 4).map((hex, i) => (
                                                                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: hex }}></div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            // SINGLE COLOR VISUAL
                                                            <div
                                                                className="w-8 h-8 rounded-lg border border-slate-100 shadow-inner"
                                                                style={{ backgroundColor: variant.displayHex }}
                                                            />
                                                        )}

                                                        {variant.isNew && (
                                                            <div className="absolute top-0 right-0 p-0.5 bg-indigo-500 rounded-bl-lg">
                                                                <SparklesIcon className="w-2.5 h-2.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* TEXT IDENTITY */}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 text-lg">{variant.sizeCode}</span>
                                                            <span className="text-slate-300 text-xs">•</span>
                                                            <span className="font-medium text-slate-600">{variant.displayColorName}</span>
                                                        </div>
                                                        {variant.isColorway && (
                                                            <div className="flex -space-x-1 mt-1">
                                                                {variant.displayPalette.map((hex, i) => (
                                                                    <div key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: hex }} />
                                                                ))}
                                                            </div>
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
