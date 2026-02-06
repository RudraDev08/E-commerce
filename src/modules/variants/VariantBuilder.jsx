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
    XMarkIcon,
    LockClosedIcon,
    PhotoIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { productAPI, sizeAPI, colorAPI, variantAPI } from '../../Api/api';
import { uploadAPI } from '../../api/uploadApi';
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
            // Map existing variants to UI structure
            // -----------------------------------------------------
            const existingArgs = (varRes.data.data || []).map(v => {
                // Determine if this is a legacy variant (single) or new colorway
                const isColorway = !!v.colorwayName || (v.colorParts && v.colorParts.length > 0);

                // Color Logic
                let displayColorName = 'N/A';
                let displayHex = null; // Single Hex
                let displayPalette = []; // Array of Hexes
                let colorId = null;

                if (isColorway) {
                    displayColorName = v.colorwayName || 'Custom Colorway';
                    // Map populated colorParts to hexes
                    if (v.colorParts && v.colorParts.length > 0) {
                        displayPalette = v.colorParts.map(cp => cp.hexCode || '#eee');
                    }
                } else {
                    // Single Color
                    // Schema uses 'color' field (populated object or ID)
                    // We need to robustly handle: v.color (object/ID), v.colorId (legacy/frontend-prop)
                    const colorObj = v.color || v.colorId;

                    if (colorObj && typeof colorObj === 'object') {
                        // Populated - use directly
                        displayColorName = colorObj.name || v.attributes?.color || 'N/A';
                        displayHex = colorObj.hexCode || '#eee';
                        colorId = colorObj._id;
                    } else {
                        // Not populated (ID string or missing)
                        const cId = colorObj || (typeof v.color === 'string' ? v.color : v.color?._id);
                        const matchedColor = loadedColors.find(c => c._id === cId);
                        displayColorName = v.attributes?.color || matchedColor?.name || 'N/A';
                        displayHex = matchedColor?.hexCode || '#eee';
                        colorId = cId;
                    }
                }

                // Size Logic
                // Schema uses 'size' field (populated object or ID)
                let sizeCode = 'N/A';
                let sizeId = null;
                const sizeObj = v.size || v.sizeId;

                if (sizeObj && typeof sizeObj === 'object') {
                    sizeCode = sizeObj.code || sizeObj.name || 'N/A';
                    sizeId = sizeObj._id;
                } else {
                    const sId = sizeObj;
                    const matchedSize = loadedSizes.find(s => s._id === sId);
                    sizeCode = matchedSize?.code || matchedSize?.name || v.attributes?.size || 'N/A';
                    sizeId = sId;
                }

                return {
                    ...v, // Keep original DB fields
                    isNew: false,
                    isEdited: false,

                    // Unified UI Fields
                    sizeCode,
                    size: typeof v.size === 'object' ? v.size : null, // Pass full object for UI rendering
                    sizeId, // Ensure we have the ID for updates
                    colorId, // Ensure we have the ID for updates (Single Color Mode)

                    // Render Hints
                    isColorway,
                    displayColorName,
                    displayHex,      // Used if Single
                    displayPalette,  // Used if Colorway

                    price: Number(v.price) || 0,
                    // stock: REMOVED - Managed by Inventory Master
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
            // STRICT VALIDATION: Skip invalid sizes
            // if (!size.ram || !size.storage) {
            //     console.warn(`Skipping invalid size: ${size.name}`);
            //     skipped++;
            //     return;
            // }

            // NEW SKU LOGIC: Use RAM/Storage if available (e.g. 12-256), else fallback to Code
            let sizePart = size.code.replace(/[^a-zA-Z0-9]/g, '');
            if (size.ram && size.storage) {
                sizePart = `${size.ram}-${size.storage}`;
            }

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
                    sku: `${baseSku}-${sizePart}-${colorwayCode}`,
                    price: genPrice,
                    images: [], // New Image Field
                    // stock: REMOVED - Managed by Inventory Master
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

                        sku: `${baseSku}-${sizePart}-${colorCode}`,
                        price: genPrice,
                        images: [], // New Image Field
                        // stock: REMOVED - Managed by Inventory Master
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
                        const attributes = {
                            size: v.sizeCode
                        };

                        // LEGACY: Support old reports/search (Requested by Requirement 7)
                        if (v.displayColorName) {
                            attributes.color = v.displayColorName;
                        }

                        // STRICT: Follow variantAttributes.js rules for modern logic
                        if (!v.isColorway) {
                            attributes.colorId = v.colorId;
                        }

                        const base = {
                            attributes,
                            sizeId: v.sizeId,
                            sku: v.sku,
                            price: Number(v.price) || 0,
                            // stock: REMOVED - Managed by Inventory Master
                            status: v.status === 'active'
                        };

                        // Add Type Specifics
                        if (v.isColorway) {
                            base.colorwayName = v.colorwayName;
                            base.colorParts = v.colorParts.map(c => c._id); // Extract IDs
                        } else {
                            base.colorId = v.colorId;
                        }

                        // Add Images (New Feature)
                        if (v.images && v.images.length > 0) {
                            base.images = v.images;
                        }

                        return base;
                    })
                };
                const res = await variantAPI.create(payload);
                if (res.data?.stats) {
                    const { created, skipped } = res.data.stats;
                    if (created > 0 && skipped > 0) {
                        toast(`Saved ${created} variants (${skipped} skipped as duplicates)`, { icon: '⚠️' });
                    } else if (created > 0) {
                        toast.success(`Created ${created} variants`);
                    } else {
                        toast('No new variants created (duplicates)', { icon: 'info' });
                    }
                }
            }

            // Update Edited
            if (editedItems.length > 0) {
                await Promise.all(editedItems.map(v =>
                    variantAPI.update(v._id, {
                        price: Number(v.price),
                        // stock: REMOVED - Managed by Inventory Master
                        sku: v.sku,
                        status: v.status === 'active'
                    })
                ));
            }

            if (newItems.length === 0 && editedItems.length > 0) {
                toast.success('Updates saved successfully');
            }

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
            new: variants.filter(v => v.isNew).length
            // stock: REMOVED - Check Inventory Master for stock info
        };
    }, [variants]);

    const filteredVariants = useMemo(() => {
        return variants.filter(v => {
            // 1. Status Filter
            if (filter === 'new' && !v.isNew) return false;

            // 2. Search Filter (Debounced-ish via state)
            if (!searchTerm) return true;

            const term = searchTerm.toLowerCase();
            const skuMatch = v.sku?.toLowerCase().includes(term);
            const colorMatch = v.displayColorName?.toLowerCase().includes(term);
            const sizeMatch = v.sizeCode?.toLowerCase().includes(term);

            return skuMatch || colorMatch || sizeMatch;
        });
    }, [variants, filter, searchTerm]);

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

    const handleImageUpload = async (variantId, files) => {
        if (!files || files.length === 0) return;

        const currentVariant = variants.find(v => v._id === variantId);
        const currentCount = (currentVariant.images || []).length;

        if (currentCount + files.length > 5) {
            toast.error(`Limit reached: You can only have 5 images per variant.`);
            return;
        }

        const toastId = toast.loading('Uploading images...');
        try {
            const res = await uploadAPI.uploadMultiple(files);
            const uploadedImages = res.data.data.map(img => ({
                url: img.url,
                alt: img.filename,
                sortOrder: 0
            }));

            const currentVariant = variants.find(v => v._id === variantId);
            const currentImages = currentVariant.images || [];

            updateVariant(variantId, 'images', [...currentImages, ...uploadedImages]);

            toast.success('Images uploaded!', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Upload failed', { id: toastId });
        }
    };

    const handleRemoveImage = (variantId, imgIndex) => {
        if (!window.confirm('Remove this image?')) return;

        const currentVariant = variants.find(v => v._id === variantId);
        const currentImages = [...(currentVariant.images || [])];
        currentImages.splice(imgIndex, 1);

        updateVariant(variantId, 'images', currentImages);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
                <div className="w-full px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => navigate('/variant-mapping')}
                            className="group p-3 rounded-full hover:bg-slate-100/80 transition-all text-slate-400 hover:text-slate-900"
                        >
                            <ArrowLeftIcon className="w-6 h-6 stroke-[2]" />
                        </button>

                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-lg shadow-slate-200/50 overflow-hidden flex-shrink-0 ring-1 ring-slate-100">
                                {productImageUrl ? (
                                    <img src={productImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <CubeIcon className="w-6 h-6 text-slate-300" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{product.name}</h1>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs font-semibold text-slate-500 tracking-wide">
                                        {product.sku || 'NO-SKU'}
                                    </span>
                                    {/* Strategy Badge */}
                                    {isColorwayMode ? (
                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            Colorway
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            Single Color
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md mx-8 transition-opacity duration-200 opacity-80 hover:opacity-100">
                        <ProductSelectDropdown
                            value={productId}
                            onChange={(newId) => navigate(`/variant-builder/${newId}`)}
                            label=""
                        />
                    </div>

                    <div className="flex items-center gap-10">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Variants</span>
                            <span className="font-bold text-slate-900 text-2xl leading-none">{stats.total}</span>
                        </div>
                        <button
                            onClick={saveChanges}
                            disabled={saving}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-full font-bold shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="w-full px-6 lg:px-8 py-8 space-y-8">
                {/* Generator */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                    <div
                        className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
                        onClick={() => setIsGenerating(!isGenerating)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-base">Variant Generator</h2>
                                <p className="text-sm text-slate-500 font-medium mt-0.5">
                                    {isColorwayMode
                                        ? "Create defined colorways for multiple sizes"
                                        : "Combine sizes and colors to create new SKUs"
                                    }
                                </p>
                            </div>
                        </div>
                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all border border-indigo-100/50">
                            {isGenerating ? 'Collapse Panel' : 'Expand Panel'}
                        </button>
                    </div>

                    {isGenerating && (
                        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                            {/* DYNAMIC GENERATOR UI */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                                {/* 1. Size Dropdown (Common) */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2.5 text-base">
                                            <TagIcon className="w-5 h-5 text-indigo-500" />
                                            Select Sizes
                                        </h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${selectedSizes.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
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
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm/50 space-y-6">

                                        {/* Name Input */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                Colorway Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                                                placeholder="e.g. 'Chicago', 'Panda', 'Triple Black'"
                                                value={colorwayName}
                                                onChange={(e) => setColorwayName(e.target.value)}
                                            />
                                        </div>

                                        <div className="border-t border-slate-100 pt-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <SwatchIcon className="w-4 h-4 text-indigo-500" />
                                                    Composition
                                                </h3>
                                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                                    {colorwayPalette.length} Parts
                                                </span>
                                            </div>

                                            {/* Composite List */}
                                            <div className="space-y-2 mb-4">
                                                {colorwayPalette.map((color, index) => (
                                                    <div
                                                        key={`${color._id}-${index}`}
                                                        className="group flex items-center justify-between p-2 pl-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3">

                                                            {/* Index / Primary Badge */}
                                                            {index === 0 ? (
                                                                <span className="text-[10px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded shadow-sm shadow-indigo-200 uppercase tracking-wider">
                                                                    Primary
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 min-w-[24px] text-center">
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
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Remove part"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {colorwayPalette.length === 0 && (
                                                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                                                        <p className="text-xs font-semibold text-slate-400">No colors added yet.</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">Add colors below to build the palette.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add Color Dropdown */}
                                            <div className="relative">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Add Part</label>
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer transition-all"
                                                    onChange={(e) => {
                                                        const cId = e.target.value;
                                                        if (!cId) return;
                                                        const color = allColors.find(c => c._id === cId);
                                                        if (color) {
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
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm/50 h-full flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-slate-800 flex items-center gap-2.5 text-base">
                                                <SwatchIcon className="w-5 h-5 text-indigo-500" />
                                                Select Colors
                                            </h3>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${selectedColors.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {selectedColors.length} Selected
                                            </span>
                                        </div>
                                        <div className="flex-1 min-h-[160px]">
                                            <ColorMultiSelectDropdown
                                                value={selectedColors.map(c => c._id)}
                                                onChange={(ids) => {
                                                    const objects = allColors.filter(c => ids.includes(c._id));
                                                    setSelectedColors(objects);
                                                }}
                                                label=""
                                            />
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-slate-100">
                                            <p className="text-xs text-slate-400 font-medium">
                                                This will generate <strong className="text-slate-700">{Math.max(1, selectedColors.length * selectedSizes.length)}</strong> unique SKUs
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end items-center pt-6 border-t border-slate-100">
                                <button
                                    onClick={generateVariants}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-0.5"
                                >
                                    <PlusIcon className="w-5 h-5 stroke-[2.5]" />
                                    Generate Variants
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Data Table */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${filter === 'all'
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                            >
                                All Variants
                            </button>
                            <button
                                onClick={() => setFilter('new')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${filter === 'new'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
                            >
                                Unsaved <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filter === 'new' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{stats.new}</span>
                            </button>
                        </div>
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-full text-sm w-full sm:w-72 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all font-medium placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-8 py-5 font-medium">Variant Identity</th>
                                    <th className="px-6 py-5 font-medium">Images</th>
                                    <th className="px-6 py-5 font-medium w-64">SKU Code</th>
                                    <th className="px-6 py-5 font-medium w-40">Price (₹)</th>
                                    <th className="px-6 py-5 font-medium w-24 text-center">Active</th>
                                    <th className="px-6 py-5 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredVariants.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-50/50">
                                                    <CubeIcon className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-slate-900 font-bold text-lg mb-1">No variants found</h3>
                                                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                                    Use the generator above to create new size/color combinations.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVariants.map((variant) => (
                                        <tr
                                            key={variant._id}
                                            className={`group transition-all duration-200 hover:bg-slate-50/60 ${variant.isNew ? 'bg-indigo-50/10' : ''}`}
                                        >
                                            {/* 1. IDENTITY COLUMN */}
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    {/* Color Swatch */}
                                                    <div className="relative w-12 h-12 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] flex-shrink-0 overflow-hidden ring-1 ring-black/5 bg-white group-hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)] transition-shadow">
                                                        {variant.isColorway ? (
                                                            <div className="flex flex-wrap h-full w-full">
                                                                {variant.displayPalette.slice(0, 4).map((hex, i) => (
                                                                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: hex || '#eee' }} />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full relative">
                                                                <div
                                                                    className="absolute inset-0"
                                                                    style={{ backgroundColor: variant.displayHex || '#eee' }}
                                                                />
                                                                {/* Glossy Overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-white/20 pointer-events-none" />
                                                            </div>
                                                        )}

                                                        {/* New Indicator */}
                                                        {variant.isNew && (
                                                            <div className="absolute top-0 right-0 p-1 bg-indigo-500 rounded-bl-lg shadow-sm z-10">
                                                                <SparklesIcon className="w-2 h-2 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Text Info */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-base">
                                                                {variant.size && variant.size.ram && variant.size.storage
                                                                    ? `${variant.size.ram}GB / ${variant.size.storage}${variant.size.storageUnit || 'GB'}`
                                                                    : variant.size ? (variant.size.name || variant.size.code) : (variant.sizeCode || 'N/A')
                                                                }
                                                            </span>
                                                            {!variant.isNew && (
                                                                <div className="text-slate-300" title="Attributes Locked">
                                                                    <LockClosedIcon className="w-3 h-3" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-500">
                                                            {variant.displayColorName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* IMAGES COLUMN */}
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col items-start gap-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {(variant.images || []).map((img, imgIdx) => (
                                                            <div key={imgIdx} className="relative group/img w-10 h-10 rounded-lg ring-1 ring-slate-200/80 overflow-hidden bg-white shadow-sm hover:scale-110 transition-transform z-0 hover:z-10">
                                                                <img
                                                                    src={getImageUrl(img)}
                                                                    alt="Variant"
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => e.target.style.display = 'none'}
                                                                />
                                                                <button
                                                                    onClick={() => handleRemoveImage(variant._id, imgIdx)}
                                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-[1px]"
                                                                >
                                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white ring-1 ring-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm active:translate-y-0.5 select-none">
                                                        <CloudArrowUpIcon className="w-3.5 h-3.5" />
                                                        Upload
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleImageUpload(variant._id, e.target.files)}
                                                        />
                                                    </label>
                                                </div>
                                            </td>

                                            {/* 2. SKU COLUMN */}
                                            <td className="px-6 py-6">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={variant.sku}
                                                        onChange={(e) => updateVariant(variant._id, 'sku', e.target.value)}
                                                        className="w-full bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 text-slate-600 text-xs font-mono font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-md focus:bg-white placeholder-slate-300"
                                                        placeholder="GEN-SKU-..."
                                                    />
                                                </div>
                                            </td>

                                            {/* 3. PRICE COLUMN */}
                                            <td className="px-6 py-6">
                                                <div className="relative group/input">
                                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                        <span className="text-slate-400 font-medium text-sm">₹</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={variant.price}
                                                        onChange={(e) => updateVariant(variant._id, 'price', e.target.value)}
                                                        className="w-full bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 text-slate-900 font-bold text-sm rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm focus:shadow-md focus:bg-white"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </td>

                                            {/* 4. STATUS COLUMN */}
                                            <td className="px-6 py-6">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => updateVariant(variant._id, 'status', variant.status === 'active' ? 'inactive' : 'active')}
                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${variant.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                    >
                                                        <span className="sr-only">Toggle active</span>
                                                        <span
                                                            aria-hidden="true"
                                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${variant.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`}
                                                        />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* 6. ACTIONS COLUMN */}
                                            <td className="px-6 py-6 text-right">
                                                <button
                                                    onClick={() => deleteVariant(variant._id, variant.isNew)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform hover:scale-105 active:scale-95"
                                                    title="Remove Variant"
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
