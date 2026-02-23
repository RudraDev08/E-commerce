import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    CloudArrowUpIcon,
    PhotoIcon,
    ExclamationTriangleIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { productAPI, colorAPI, sizeAPI, variantAPI, variantDimensionAPI, attributeTypeAPI, attributeValueAPI } from '../../Api/api';
import { uploadAPI } from '../../Api/uploadApi';

import ProductSelectDropdown from '../../components/Shared/Dropdowns/ProductSelectDropdown';
import SizeMultiSelectDropdown from '../../components/Shared/Dropdowns/SizeMultiSelectDropdown';
import ColorMultiSelectDropdown from '../../components/Shared/Dropdowns/ColorMultiSelectDropdown';
import DimensionWorkspace from './DimensionWorkspace.jsx';

// --- FORMATTER ---
const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// ============================================================================
// COMPONENT: Image Modal (Offloads DOM nodes from the main grid)
// ============================================================================
const ImageManagerModal = ({ variant, onClose, onUpload, onSetPrimary, onRemove, getImageUrl }) => {
    if (!variant) return null;
    const gallery = variant.imageGallery || variant.images || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Manage Media</h2>
                        <p className="text-sm text-slate-500 font-medium">SKU: {variant.sku || 'Unsaved Variant'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex flex-wrap gap-4 mb-6">
                        {gallery.map((img, idx) => (
                            <div key={idx} className={`relative group w-24 h-24 rounded-xl shadow-sm border-2 overflow-hidden ${img.isPrimary ? 'border-indigo-500' : 'border-slate-200'}`}>
                                <img src={getImageUrl(img)} alt="Variant Media" className="w-full h-full object-cover" />
                                {img.isPrimary && <div className="absolute top-0 left-0 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">PRIMARY</div>}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity z-20 backdrop-blur-[2px]">
                                    {!img.isPrimary && (
                                        <button onClick={() => onSetPrimary(variant._id, idx)} className="text-xs font-bold text-white bg-indigo-500/80 px-2 py-1 rounded hover:bg-indigo-600 transition-colors">Set Primary</button>
                                    )}
                                    <button onClick={() => onRemove(variant._id, idx)} className="text-xs font-bold text-white bg-red-500/80 px-2 py-1 rounded hover:bg-red-600 transition-colors">Remove</button>
                                </div>
                            </div>
                        ))}
                        {gallery.length === 0 && (
                            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                <PhotoIcon className="w-8 h-8 opacity-50" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <p className="text-xs font-semibold text-slate-500 text-left">Maximum 10 images allowed.</p>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                        <CloudArrowUpIcon className="w-5 h-5" />
                        Upload Images
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onUpload(variant._id, e.target.files)} />
                    </label>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT: VariantBuilder
// ============================================================================
const VariantBuilder = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    // Data State
    const [product, setProduct] = useState(null);
    const [allSizes, setAllSizes] = useState([]);
    const [allColors, setAllColors] = useState([]);
    const [allAttributes, setAllAttributes] = useState([]); // [{ type, values }]
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Generator State: { "COLOR": [ids], "SIZE:RAM": [ids], "ATTR:MATERIAL": [ids] }
    const [selectedDimensions, setSelectedDimensions] = useState({});
    const [isGenerating, setIsGenerating] = useState(true);
    const [colorwayName, setColorwayName] = useState('');
    const [colorwayPalette, setColorwayPalette] = useState([]);

    // UI & Grid State
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [partialCommitWarning, setPartialCommitWarning] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeImageModalVariant, setActiveImageModalVariant] = useState(null);
    const [generatingV2, setGeneratingV2] = useState(false);  // v2 API call in-flight

    const PAGE_SIZE = 50;

    useEffect(() => {
        fetchAllData();
    }, [productId]);

    const fetchAllData = async () => {
        if (!productId || String(productId).length !== 24) {
            toast.error('Invalid Product ID');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [prodRes, sizeRes, colorRes, varRes, attrTypeRes, attrValRes] = await Promise.all([
                productAPI.getById(productId),
                sizeAPI.getAll({ status: 'ACTIVE' }),
                colorAPI.getAll({ status: 'ACTIVE' }),
                // Admin panel needs ALL statuses (DRAFT, ACTIVE, OUT_OF_STOCK, etc.)
                variantAPI.getByProduct(productId),
                attributeTypeAPI.getAll({ status: 'ACTIVE' }),
                attributeValueAPI.getAll({ status: 'ACTIVE' })
            ]);

            const productData = prodRes.data.data || prodRes.data;
            setProduct(productData);

            const loadedSizes = sizeRes.data.data || [];
            const loadedColors = colorRes.data.data || [];
            const loadedTypes = attrTypeRes.data.data || [];
            const loadedVals = attrValRes.data.data || [];

            setAllSizes(loadedSizes);
            setAllColors(loadedColors);

            // Group values by type for the generator UI
            const groupedAttributes = loadedTypes.map(type => ({
                ...type,
                values: loadedVals.filter(v => v.typeId === type._id || v.type === type._id)
            }));
            setAllAttributes(groupedAttributes);

            const existingArgs = (varRes.data.data || []).map(v => {
                const isColorway = !!v.colorwayName || (v.colorParts && v.colorParts.length > 0);
                let displayColorName = 'N/A';
                let displayHex = null;
                let displayPalette = [];
                let colorId = null;

                if (isColorway) {
                    displayColorName = v.colorwayName || 'Custom Colorway';
                    if (v.colorParts && v.colorParts.length > 0) displayPalette = v.colorParts.map(cp => cp.hexCode || '#eee');
                } else {
                    const colorObj = v.color || v.colorId;
                    if (colorObj && typeof colorObj === 'object') {
                        displayColorName = colorObj.name || v.attributes?.color || 'N/A';
                        displayHex = colorObj.hexCode || '#eee';
                        colorId = colorObj._id;
                    } else {
                        const cId = colorObj || (typeof v.color === 'string' ? v.color : v.color?._id);
                        const matchedColor = loadedColors.find(c => c._id === cId);
                        displayColorName = v.attributes?.color || matchedColor?.name || 'N/A';
                        displayHex = matchedColor?.hexCode || '#eee';
                        colorId = cId;
                    }
                }

                let sizeCode = 'N/A';
                let sizeId = null;

                // Support Enterprise schema (v.sizes array) or legacy (v.sizeId / v.size)
                const enterpriseSize = v.sizes && v.sizes[0] ? v.sizes[0].sizeId : null;
                const sizeObj = enterpriseSize || v.sizeId || v.size;

                if (sizeObj && typeof sizeObj === 'object') {
                    sizeCode = sizeObj.code || sizeObj.name || sizeObj.displayName || 'N/A';
                    sizeId = sizeObj._id;
                } else {
                    const sId = sizeObj;
                    const matchedSize = loadedSizes.find(s => s._id === sId);
                    sizeCode = matchedSize?.code || matchedSize?.name || matchedSize?.displayName || v.attributes?.size || 'N/A';
                    sizeId = sId;
                }

                // ── Preserve & normalize attributeValueIds ──────────────────────
                // Normalize each entry: could be ObjectId string OR populated object
                const rawAttrIds = Array.isArray(v.attributeValueIds) ? v.attributeValueIds : [];
                const normalizedAttrValueIds = rawAttrIds.map(entry => {
                    if (!entry) return null;
                    // Populated object: { _id, name, ... }
                    if (typeof entry === 'object' && entry._id) return entry._id.toString();
                    // Plain ObjectId string
                    return entry.toString();
                }).filter(Boolean);

                // ── Normalize attributeDimensions from backend ────────────────────
                // This is the stable structured metadata the backend now returns.
                // Used for identity key reconstruction — no reverse-scan needed.
                // Format: [{ attributeId, attributeName, valueId }]
                const rawAttrDims = Array.isArray(v.attributeDimensions) ? v.attributeDimensions : [];
                const normalizedAttrDimensions = rawAttrDims
                    .map(dim => {
                        if (!dim || !dim.valueId) return null;
                        return {
                            attributeId: dim.attributeId ?? null,
                            attributeName: dim.attributeName ?? null,
                            valueId: typeof dim.valueId === 'object' ? dim.valueId.toString() : dim.valueId,
                        };
                    })
                    .filter(Boolean);

                return {
                    ...v,
                    isNew: false,
                    isEdited: false,
                    sizeCode,
                    size: typeof v.size === 'object' ? v.size : null,
                    sizeId,
                    colorId,
                    isColorway,
                    displayColorName,
                    displayHex,
                    displayPalette,
                    // ── Preserve attributeValueIds from DB (sorted for stable diffing) ──
                    attributeValueIds: [...normalizedAttrValueIds].sort(),
                    // ── Structured attribute metadata for deterministic identity keys ──
                    attributeDimensions: normalizedAttrDimensions,
                    // Preserve precise decimals
                    price: typeof v.price === 'object' && v.price.$numberDecimal ? v.price.$numberDecimal : v.price?.toString() || "0",
                    status: (v.status === true || v.status?.toLowerCase() === 'active') ? 'ACTIVE' : v.status,
                    // Explicitly preserve governance so OCC version is available at save time
                    governance: v.governance ?? null,
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

    // --- DYNAMIC CARTESIAN ENGINE ---
    const generateVariants = () => {
        // Collect active namespaces (namespaces with selections)
        const activeDimensions = Object.entries(selectedDimensions).filter(([_, ids]) => ids.length > 0);

        if (activeDimensions.length === 0) {
            return toast.error("Please select at least one dimension.");
        }

        // PERFORMANCE GUARD: Blast radius limit
        const projectedNodes = activeDimensions.reduce((acc, [_, ids]) => acc * ids.length, 1);
        if (projectedNodes > 300) {
            toast.error(`Cannot generate ${projectedNodes} variants at once. Limit is 300.`);
            return;
        }

        // Helper: Cartesian Product of any number of arrays
        // Each entry is [namespace, values[], attributeTypeId?]
        // attributeTypeId is propagated per item so identity keys need no lookup.
        const cartesianProduct = (entries) => {
            return entries.reduce((acc, [namespace, values, attributeTypeId]) => {
                const results = [];
                const dimensionData = values.map(v => ({ namespace, data: v, attributeTypeId }));

                if (acc.length === 0) return dimensionData.map(d => [d]);

                for (const combination of acc) {
                    for (const item of dimensionData) {
                        results.push([...combination, item]);
                    }
                }
                return results;
            }, []);
        };

        // Prepare data for cartesian
        // Each entry also carries attributeTypeId for stable identity key construction.
        const dimensionEntries = activeDimensions.map(([namespace, ids]) => {
            let values = [];
            let attributeTypeId = null;
            if (namespace === 'COLOR') {
                values = allColors.filter(c => ids.includes(c._id));
            } else if (namespace.startsWith('SIZE:')) {
                values = allSizes.filter(s => ids.includes(s._id));
            } else if (namespace.startsWith('ATTR:')) {
                const typeName = namespace.replace('ATTR:', '');
                const attrType = allAttributes.find(at => at.name === typeName);
                attributeTypeId = attrType?._id ?? null;
                values = attrType ? attrType.values.filter(v => ids.includes(v._id)) : [];
            }
            return [namespace, values, attributeTypeId];
        });

        const combinations = cartesianProduct(dimensionEntries);

        // ── DETERMINISTIC IDENTITY KEY ────────────────────────────────────────
        // Identity keys are built ONLY from stored variant fields.
        // NEVER depends on allAttributes reverse-scan.
        // Works even when attribute types have zero values.
        //
        // Key format (sorted for stability):
        //   COLOR:<colorId>|SIZE:<category>:<sizeId>|ATTR:<attributeId>:<valueId>
        const buildIdentityKeyFromVariant = (v) => {
            const parts = [];
            if (v.colorId) parts.push(`COLOR:${v.colorId}`);
            if (v.sizes?.length > 0) {
                v.sizes.forEach(s => {
                    const sid = typeof s.sizeId === 'object' ? s.sizeId._id ?? s.sizeId : s.sizeId;
                    parts.push(`SIZE:${s.category}:${sid}`);
                });
            }
            if (v.attributeDimensions?.length > 0) {
                v.attributeDimensions.forEach(dim => {
                    // Key = ATTR:<attributeTypeId>:<valueId> — stable even if attr type has 0 values
                    parts.push(`ATTR:${dim.attributeId ?? 'UNKNOWN'}:${dim.valueId}`);
                });
            }
            return parts.sort().join('|');
        };

        // Key builder for a fresh combo from Cartesian generation
        const buildIdentityKeyFromCombo = (combo) => {
            const parts = [];
            combo.forEach(dim => {
                if (dim.namespace === 'COLOR') {
                    parts.push(`COLOR:${dim.data._id}`);
                } else if (dim.namespace.startsWith('SIZE:')) {
                    const category = dim.namespace.replace('SIZE:', '');
                    parts.push(`SIZE:${category}:${dim.data._id}`);
                } else if (dim.namespace.startsWith('ATTR:')) {
                    // dim.attributeTypeId is set during combo construction below
                    parts.push(`ATTR:${dim.attributeTypeId ?? 'UNKNOWN'}:${dim.data._id}`);
                }
            });
            return parts.sort().join('|');
        };

        // Pre-index existing variants using structured fields — no allAttributes scan
        const currentIdentitySet = new Set(variants.map(v => buildIdentityKeyFromVariant(v)));

        const baseSku = (product.sku || product.slug || product.name.substring(0, 8)).replace(/[^a-z0-9]/gi, '').toUpperCase();
        const newVariants = [];
        let skipped = 0;

        combinations.forEach(combo => {
            const identityKey = buildIdentityKeyFromCombo(combo);
            if (currentIdentitySet.has(identityKey)) {
                skipped++;
                return;
            }

            // Build VariantMaster compatible object
            const variantObj = {
                _id: `temp-${Math.random().toString(36).substr(2, 9)}`,
                productId: product._id,
                isNew: true,
                isEdited: true,
                status: 'DRAFT',
                price: (product.basePrice || 0).toString(),
                imageGallery: [],
                sizes: [],
                attributeValueIds: [],
                // ── Structured attribute metadata for stable identity (no reverse-scan) ──
                attributeDimensions: [],
                colorId: null,
                // Display helpers
                displayColorName: '',
                displayHex: '',
                sizeCode: '',
                variantLabel: combo.map(c => c.data.code || c.data.name || c.data.displayName || c.data.value).join(' / ')
            };

            const skuParts = [baseSku];
            combo.forEach(dim => {
                const code = (dim.data.code || dim.data.value || dim.data.name || 'X').replace(/[^a-z0-9]/gi, '').toUpperCase();
                skuParts.push(code);

                if (dim.namespace === 'COLOR') {
                    variantObj.colorId = dim.data._id;
                    variantObj.displayColorName = dim.data.name;
                    variantObj.displayHex = dim.data.hexCode;
                } else if (dim.namespace.startsWith('SIZE:')) {
                    const category = dim.namespace.replace('SIZE:', '');
                    variantObj.sizes.push({ sizeId: dim.data._id, category });
                    variantObj.sizeCode = dim.data.code || dim.data.displayName;
                } else if (dim.namespace.startsWith('ATTR:')) {
                    // Flat ID list for backend compatibility
                    variantObj.attributeValueIds.push(dim.data._id);
                    // Structured metadata for frontend identity — uses typeId from combo item
                    variantObj.attributeDimensions.push({
                        attributeId: dim.attributeTypeId ?? null,
                        attributeName: dim.namespace.replace('ATTR:', ''),
                        valueId: dim.data._id,
                    });
                }
            });

            variantObj.sku = skuParts.join('-');
            newVariants.push(variantObj);
        });

        if (newVariants.length > 0) {
            setVariants(prev => [...prev, ...newVariants]);
            toast.success(`Generated ${newVariants.length} combinations.`);
            setSelectedDimensions({});
        } else if (skipped > 0) {
            toast.error(`${skipped} configurations already exist.`);
        }
    };

    // ── V2 GENERATE HANDLER ──────────────────────────────────────────────────
    // Called by DimensionWorkspace when user clicks the Generate button.
    // Hits POST /api/variants/v2/generate-dimensions and refreshes the grid.
    const handleV2Generate = useCallback(async (apiPayload) => {
        if (!product?._id && !apiPayload.productGroupId) {
            return toast.error('No product group selected.');
        }
        setGeneratingV2(true);
        const tid = toast.loading('Generating combinations...');
        try {
            const payload = {
                ...apiPayload,
                productGroupId: apiPayload.productGroupId || product._id,
                brand: apiPayload.brand || product.brand?.name || '',
                basePrice: apiPayload.basePrice || product.basePrice || 0,
            };
            const res = await variantDimensionAPI.generate(payload);
            const { totalGenerated, skipped } = res.data.data;
            toast.success(
                `Generated ${totalGenerated} variant${totalGenerated !== 1 ? 's' : ''}.` +
                (skipped > 0 ? ` (${skipped} already existed)` : ''),
                { id: tid, duration: 4000 }
            );
            // Refresh the existing variants grid to reflect newly-persisted rows
            await fetchAllData();
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || 'Generation failed.';
            toast.error(msg, { id: tid });
        } finally {
            setGeneratingV2(false);
        }
    }, [product, fetchAllData]);

    // --- GRID INTERACTIONS ---
    // Debounced UI update for performance
    const updateVariant = useCallback((id, field, value) => {
        setVariants(prev => prev.map(v => v._id === id ? { ...v, [field]: value, isEdited: true } : v));
    }, []);

    const deleteVariant = useCallback((id, isNew) => {
        if (isNew) {
            setVariants(prev => prev.filter(v => v._id !== id));
            toast.success('Removed');
        } else {
            if (!window.confirm('Delete variant? This is permanent.')) return;
            const previous = [...variants];
            setVariants(prev => prev.filter(v => v._id !== id));
            variantAPI.delete(id)
                .then(() => toast.success('Deleted'))
                .catch(err => {
                    toast.error('Failed to delete');
                    setVariants(previous);
                });
        }
    }, [variants]);

    const VALID_TRANSITIONS = {
        DRAFT: ['ACTIVE', 'ARCHIVED'],
        ACTIVE: ['OUT_OF_STOCK', 'ARCHIVED', 'LOCKED'],
        OUT_OF_STOCK: ['ACTIVE', 'ARCHIVED'],
        ARCHIVED: [],
        LOCKED: [],
    };

    const getAllowedStatuses = (status) => [status, ...(VALID_TRANSITIONS[status] || [])];

    // --- BULK TRANSACTION SAVE ---
    const saveChanges = async () => {
        const newItems = variants.filter(v => v.isNew);
        const editedItems = variants.filter(v => v.isEdited && !v.isNew);
        if (newItems.length === 0 && editedItems.length === 0) return toast('No changes to save.');

        // Price validation
        const priceRegex = /^\d+(\.\d{1,2})?$/;
        for (const v of [...newItems, ...editedItems]) {
            if (!priceRegex.test(v.price)) {
                return toast.error(`Invalid price format for SKU: ${v.sku}`);
            }
        }

        // OCC Guard — block save if any edited row is missing governance.version
        if (editedItems.some(v => v.governance?.version === undefined || v.governance?.version === null)) {
            return toast.error('Version missing. Refresh required before saving.');
        }

        setSaving(true);
        try {
            // ── CREATE new variants ──────────────────────────────────────────────
            if (newItems.length > 0) {
                const payload = {
                    productId: product._id,
                    productGroupId: product._id,
                    variants: newItems.map(v => {
                        const sizeMetadata = allSizes.find(s => s._id === v.sizeId);

                        // ── Build deterministic attributeValueIds ──────────────────
                        // Deduplicate + sort by string value so hash is stable
                        const rawAttrIds = Array.isArray(v.attributeValueIds) ? v.attributeValueIds : [];
                        const attrValueIds = [...new Set(
                            rawAttrIds
                                .filter(Boolean)
                                .map(id => (typeof id === 'object' && id._id ? id._id.toString() : id.toString()))
                        )].sort();

                        return {
                            attributes: { size: v.sizeCode, color: v.isColorway ? null : v.displayColorName },
                            sizes: v.sizeId
                                ? [{ sizeId: v.sizeId, category: sizeMetadata?.category || 'DIMENSION' }]
                                : (v.sizes || []),
                            sku: v.sku,
                            price: v.price.toString(),
                            status: v.status || 'DRAFT',
                            colorwayName: v.isColorway ? v.colorwayName : undefined,
                            colorParts: v.isColorway ? v.colorParts.map(c => c._id) : undefined,
                            colorId: !v.isColorway ? v.colorId : undefined,
                            imageGallery: v.imageGallery || [],
                            // ── REQUIRED: attributeValueIds for N-dimensional support ──
                            attributeValueIds: attrValueIds,
                        };
                    })
                };
                await variantAPI.create(payload);
                toast.success(`Created ${newItems.length} new variant${newItems.length > 1 ? 's' : ''}.`);
            }

            // ── UPDATE existing variants (concurrent, per-row OCC) ───────────────
            if (editedItems.length > 0) {
                const updates = editedItems.map(v => ({
                    id: v._id,
                    price: v.price.toString(),
                    sku: v.sku,
                    status: v.status,
                    governance: { version: v.governance.version }
                }));

                let hasConflicts = false;
                const validationErrors = [];

                await Promise.all(updates.map(update =>
                    variantAPI.update(update.id, update).catch(e => {
                        const status = e?.response?.status;
                        const code = e?.response?.data?.code;
                        if (status === 409 || code === 'OCC_CONFLICT') {
                            hasConflicts = true;
                        } else if (code === 'VALIDATION_ERROR') {
                            validationErrors.push(e?.response?.data?.message || 'Validation failed.');
                        } else {
                            throw e; // Re-throw unexpected errors to outer catch
                        }
                    })
                ));

                if (hasConflicts) {
                    // Section 6 — 409 handler: toast + auto-refetch
                    toast.error('Data changed by another session. Refreshing...', { duration: 4000 });
                    await fetchAllData(); // replaces state entirely, clears isEdited flags
                    setPartialCommitWarning(false);
                    return;
                }

                if (validationErrors.length > 0) {
                    toast.error(`Validation Error: ${validationErrors[0]}`);
                } else {
                    toast.success(`Updated ${editedItems.length} variant${editedItems.length > 1 ? 's' : ''}.`);
                }
            }

            // Always refetch to replace state entirely and clear all isEdited/isNew flags
            setPartialCommitWarning(false);
            await fetchAllData();

        } catch (error) {
            console.error('[saveChanges] Unexpected error:', error);
            toast.error(error?.response?.data?.message || 'Save interrupted. Please retry.');
            await fetchAllData(); // recover from partial commit drift
        } finally {
            setSaving(false);
        }
    };

    // --- PAGINATION & FILTERING ---
    const filteredVariants = useMemo(() => {
        return variants.filter(v => {
            if (filter === 'new' && !v.isNew) return false;
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return v.sku?.toLowerCase().includes(term) || v.displayColorName?.toLowerCase().includes(term) || v.sizeCode?.toLowerCase().includes(term);
        });
    }, [variants, filter, searchTerm]);

    const totalPages = Math.ceil(filteredVariants.length / PAGE_SIZE);
    const paginatedVariants = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredVariants.slice(start, start + PAGE_SIZE);
    }, [filteredVariants, currentPage]);

    const getImageUrl = (image) => {
        if (!image) return null;
        let path = typeof image === 'string' ? image : image.url;
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        let cleanPath = path.replace(/^\//, '');
        if (!cleanPath.includes('/')) cleanPath = `uploads/${cleanPath}`;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
        return `${baseUrl}/${cleanPath}`;
    };

    // --- IMAGES ---
    const handleImageUpload = useCallback(async (variantId, files) => {
        if (!files || files.length === 0) return;
        const currentVariant = variants.find(v => v._id === variantId);
        const currentGallery = currentVariant.imageGallery || [];
        if (currentGallery.length + files.length > 10) return toast.error(`Max 10 images allowed.`);

        const toastId = toast.loading('Uploading...');
        try {
            const res = await uploadAPI.uploadMultiple(files);
            const uploadedImages = res.data.data.map((img, i) => ({
                url: img.url,
                altText: img.filename || '',
                isPrimary: currentGallery.length === 0 && i === 0,
                sortOrder: currentGallery.length + i,
                type: 'DETAIL',
            }));
            updateVariant(variantId, 'imageGallery', [...currentGallery, ...uploadedImages]);

            // Sync open modal
            setActiveImageModalVariant(prev => prev && prev._id === variantId ? { ...prev, imageGallery: [...currentGallery, ...uploadedImages] } : prev);
            toast.success('Uploaded!', { id: toastId });
        } catch (error) {
            toast.error('Upload failed', { id: toastId });
        }
    }, [variants, updateVariant]);

    const handleSetPrimary = useCallback((variantId, targetIndex) => {
        const currentVariant = variants.find(v => v._id === variantId);
        const updated = (currentVariant.imageGallery || []).map((img, i) => ({ ...img, isPrimary: i === targetIndex }));
        updateVariant(variantId, 'imageGallery', updated);
        setActiveImageModalVariant(prev => prev && prev._id === variantId ? { ...prev, imageGallery: updated } : prev);
    }, [variants, updateVariant]);

    // --- UI HELPERS ---
    const availableDimensions = useMemo(() => {
        if (!product) return [];
        const dims = [];

        // 1. COLORS
        dims.push({
            id: 'COLOR',
            label: 'Global Colors',
            icon: SwatchIcon,
            options: allColors.map(c => ({ id: c._id, name: c.name, sub: c.hexCode, color: c.hexCode }))
        });

        // 2. SIZES grouped by category
        const categories = [...new Set(allSizes.map(s => s.category))];
        categories.forEach(cat => {
            dims.push({
                id: `SIZE:${cat}`,
                label: `Size: ${cat}`,
                icon: CubeIcon,
                options: allSizes.filter(s => s.category === cat).map(s => ({ id: s._id, name: s.displayName || s.value, sub: s.value }))
            });
        });

        // 3. ATTRIBUTES
        allAttributes.forEach(attr => {
            dims.push({
                id: `ATTR:${attr.name}`,
                label: `Attribute: ${attr.name}`,
                icon: TagIcon,
                options: attr.values.map(v => ({ id: v._id, name: v.value, sub: attr.name }))
            });
        });

        return dims;
    }, [product, allColors, allSizes, allAttributes]);

    const DimensionSelector = ({ dim }) => {
        const selected = selectedDimensions[dim.id] || [];
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="space-y-3 relative">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <dim.icon className="w-3 h-3" /> {dim.label}
                    </label>
                    {selected.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {selected.length} Selected
                        </span>
                    )}
                </div>

                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-slate-50 border-2 border-dashed rounded-xl p-3 min-h-[100px] cursor-pointer transition-all hover:bg-slate-100/50 ${isOpen ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200'}`}
                >
                    <div className="flex flex-wrap gap-2">
                        {selected.length === 0 ? (
                            <span className="text-xs font-bold text-slate-400 italic py-2 px-1">+ Add {dim.label}...</span>
                        ) : (
                            selected.map(id => {
                                const opt = dim.options.find(o => o.id === id);
                                return (
                                    <span key={id} onClick={(e) => { e.stopPropagation(); toggleDimensionSelection(dim.id, id); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 rounded-lg text-xs font-black shadow-sm border border-slate-200 hover:border-red-200 hover:text-red-600 transition-all">
                                        {opt?.name}
                                        <XMarkIcon className="w-3 h-3 opacity-50" />
                                    </span>
                                );
                            })
                        )}
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-h-64 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {dim.options.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => toggleDimensionSelection(dim.id, opt.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selected.includes(opt.id)
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg'
                                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-300'}`}
                            >
                                {opt.color && <div className="w-4 h-4 rounded-full mb-1 border border-white/20" style={{ background: opt.color }} />}
                                <span className="text-xs font-black truncate w-full text-center">{opt.name}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-tighter ${selected.includes(opt.id) ? 'text-indigo-200' : 'text-slate-400'}`}>{opt.sub}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const toggleDimensionSelection = (namespace, id) => {
        setSelectedDimensions(prev => {
            const current = prev[namespace] || [];
            const updated = current.includes(id)
                ? current.filter(existing => existing !== id)
                : [...current, id];

            return { ...prev, [namespace]: updated };
        });
    };


    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return <div className="p-10 text-center font-bold text-slate-500">Product Not Found</div>;

    const isColorwayMode = product.variantType === 'COLORWAY';

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {activeImageModalVariant && (
                <ImageManagerModal
                    variant={activeImageModalVariant}
                    onClose={() => setActiveImageModalVariant(null)}
                    onUpload={handleImageUpload}
                    onSetPrimary={handleSetPrimary}
                    onRemove={handleRemoveImage}
                    getImageUrl={getImageUrl}
                />
            )}

            {partialCommitWarning && (
                <div className="bg-amber-500 text-white px-6 py-4 font-semibold flex items-center justify-between shadow-md z-40 relative sticky top-0">
                    <span className="flex items-center gap-3"><ExclamationTriangleIcon className="w-6 h-6" /> Partial Commit Risk. OCC Validation Failed on Save. Check un-saved rows.</span>
                    <button onClick={() => setPartialCommitWarning(false)} className="text-white hover:text-amber-100 uppercase text-xs font-bold tracking-wide">Dismiss</button>
                </div>
            )}

            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/variant-mapping')} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-none">{product.name}</h1>
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1 block">{product.sku}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total</span>
                            <span className="font-black text-slate-900 text-2xl leading-none">{variants.length}</span>
                        </div>
                        <button onClick={saveChanges} disabled={saving || variants.filter(v => v.isNew || v.isEdited).length === 0} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-lg font-bold shadow-md transition-all">
                            {saving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-6 lg:px-8 py-8 space-y-6 max-w-[1600px] mx-auto">

                {/* ═══════════ DIMENSION WORKSPACE v2 ═══════════ */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <DimensionWorkspace
                        productGroupId={product._id}
                        productSlug={product.sku || product.slug || product.name?.substring(0, 8)}
                        categoryId={product.categoryId || product.category?._id || product.category || null}
                        brand={product.brand?.name || ''}
                        basePrice={product.basePrice || 0}
                        colors={allColors.map(c => ({
                            id: c._id,
                            label: c.displayName || c.name,
                            hex: c.hexCode,
                        }))}
                        sizes={allSizes.map(s => ({
                            id: s._id,
                            label: s.displayName || s.value,
                            sub: s.category,
                        }))}
                        onGenerate={handleV2Generate}
                        generating={generatingV2}
                    />
                </section>

                {/* STAGE 3: VIRTUALIZED/PAGINATED GRID */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                    <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>All</button>
                            <button onClick={() => setFilter('new')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filter === 'new' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>Drafts</button>
                        </div>
                        <input type="text" placeholder="Search SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border border-slate-200 px-4 py-2 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50/30">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur z-10 shadow-sm">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-3">Variant</th>
                                    <th className="px-4 py-3 w-40">SKU Ref</th>
                                    <th className="px-4 py-3 w-32">Price</th>
                                    <th className="px-4 py-3 w-32">Resolved</th>
                                    <th className="px-4 py-3 w-24">Media</th>
                                    <th className="px-4 py-3 w-36">Governance</th>
                                    <th className="px-4 py-3 w-12 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedVariants.map((v) => (
                                    <tr key={v._id} className={`hover:bg-white transition-colors ${v.isNew ? 'bg-indigo-50/20' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg shadow-sm border border-slate-200 overflow-hidden flex shrink-0 relative">
                                                    {v.isColorway ? (
                                                        v.displayPalette.map((h, i) => <div key={i} className="flex-1 h-full" style={{ background: h }}></div>)
                                                    ) : (
                                                        <div className="w-full h-full" style={{ background: v.displayHex }}></div>
                                                    )}
                                                    {v.isNew && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-indigo-500 shadow-sm border border-white"></span>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 leading-tight flex items-center gap-1">
                                                        {v.sizeCode} {!v.isNew && <LockClosedIcon className="w-3 h-3 text-slate-300" />}
                                                    </p>
                                                    <p className="text-xs font-semibold text-slate-500 truncate w-32">{v.displayColorName}</p>
                                                    {/* Attribute value count badge — quick audit view */}
                                                    {(v.attributeValueIds?.length > 0 || v.variantLabel) && (
                                                        <p className="text-[10px] font-bold text-indigo-500 mt-0.5 truncate w-40" title={v.variantLabel || ''}>
                                                            {v.variantLabel || `${v.attributeValueIds.length} attr${v.attributeValueIds.length !== 1 ? 's' : ''}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <input type="text" value={v.sku || ''} readOnly={v.status === 'LOCKED' || v.status?.toLowerCase() === 'active'} onChange={e => updateVariant(v._id, 'sku', e.target.value)} className="w-full font-mono text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:bg-white focus:border-indigo-500 outline-none read-only:bg-slate-100 read-only:text-slate-400" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="relative">
                                                <span className="absolute left-2 top-[7px] text-xs font-bold text-slate-400">₹</span>
                                                <input type="number" step="0.01" value={v.price || ''} readOnly={v.status === 'LOCKED' || v.status?.toLowerCase() === 'active'} onChange={e => updateVariant(v._id, 'price', e.target.value)} className={`w-full font-semibold text-sm pl-6 pr-2 py-1.5 border rounded outline-none ${v.status === 'LOCKED' || v.status?.toLowerCase() === 'active' ? 'bg-slate-100 border-transparent text-slate-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`} />
                                            </div>
                                        </td>
                                        {/* RESOLVED PRICE */}
                                        <td className="px-4 py-4 relative group">
                                            {v.resolvedPrice && !v.isNew ? (
                                                <div className="font-semibold text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5 inline-flex items-center gap-1 cursor-default">
                                                    <span>₹{parseFloat(v.resolvedPrice?.$numberDecimal || v.resolvedPrice || 0).toFixed(2)}</span>
                                                    {v.priceResolutionLog?.length > 0 && (
                                                        <div className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] cursor-help">i</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Preview</span>
                                            )}
                                            {/* TOOLTIP */}
                                            {v.priceResolutionLog?.length > 0 && !v.isNew && (
                                                <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 w-64 bg-slate-800 text-white p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                                    <div className="font-bold text-xs mb-2 text-slate-300 border-b border-slate-600 pb-1">Price Resolution Log</div>
                                                    <div className="space-y-1.5 text-xs">
                                                        {v.priceResolutionLog.map((log, i) => (
                                                            <div key={i} className="flex justify-between items-center">
                                                                <span className="text-slate-400 truncate w-32" title={log.source}>
                                                                    {log.source === 'BASE' ? 'Base Price' : log.modifierType || 'Modifier'}
                                                                </span>
                                                                <span className="text-emerald-400 font-mono">+₹{parseFloat(log.appliedAmount?.$numberDecimal || log.appliedAmount || 0).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <button onClick={() => setActiveImageModalVariant(v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                                                <PhotoIcon className="w-4 h-4 text-indigo-500" />
                                                {v.imageGallery?.length || 0} Sets
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            {v.status === 'LOCKED' || v.status === 'ARCHIVED' ? (
                                                <span className="px-2 py-1 font-bold text-[10px] uppercase tracking-wider rounded bg-slate-100 text-slate-500 border border-slate-200 inline-block">{v.status}</span>
                                            ) : (
                                                <select value={v.status || 'DRAFT'} onChange={e => updateVariant(v._id, 'status', e.target.value)} className="w-full text-xs font-bold uppercase py-1 border-0 bg-transparent text-slate-700 cursor-pointer focus:ring-0 appearance-none">
                                                    {getAllowedStatuses(v.status || 'DRAFT').map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button onClick={() => deleteVariant(v._id, v.isNew)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center text-xs font-bold text-slate-500 flex-shrink-0">
                        <span>Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filteredVariants.length)} of {filteredVariants.length}</span>
                        <div className="flex gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 border border-slate-200 rounded disabled:opacity-50 hover:bg-slate-50"><ChevronLeftIcon className="w-4 h-4" /></button>
                            <span className="px-3 py-1.5 bg-slate-100 rounded">Page {currentPage} of {Math.max(1, totalPages)}</span>
                            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 border border-slate-200 rounded disabled:opacity-50 hover:bg-slate-50"><ChevronRightIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default VariantBuilder;
