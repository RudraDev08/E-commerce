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
    ChevronRightIcon,
    Square3Stack3DIcon,
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

const safeFix = (val, decimals = 2) => {
    if (val === null || val === undefined) return "0.00";
    // Handle $numberDecimal if present
    const raw = typeof val === 'object' && val.$numberDecimal ? val.$numberDecimal : val;
    const n = parseFloat(raw);
    return isNaN(n) ? "0.00" : n.toFixed(decimals);
};

// ============================================================================
// CONSTANTS — Column contract (single source of truth)
// ============================================================================
const VARIANT_COLUMNS = [
    { key: 'select', label: '', width: 52 },
    { key: 'color', label: 'Color', width: 160 },
    { key: 'size', label: 'Size', width: 130 },
    { key: 'attributes', label: 'Attributes', width: 220 },
    { key: 'sku', label: 'SKU Ref', width: 160 },
    { key: 'price', label: 'Price', width: 120 },
    { key: 'resolved', label: 'Resolved', width: 140 },
    { key: 'media', label: 'Media', width: 110 },
    { key: 'status', label: 'Status', width: 150 },
    { key: 'actions', label: '', width: 80 },
];

// ============================================================================
// HELPERS — Badge rendering
// ============================================================================
const MAX_VISIBLE_BADGES = 4;

function BadgeList({ items, colorClass = 'bg-blue-50 border-blue-200 text-blue-700' }) {
    if (!items || items.length === 0) return <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">—</span>;
    const visible = items.slice(0, MAX_VISIBLE_BADGES);
    const overflow = items.length - MAX_VISIBLE_BADGES;
    return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
            {visible.map((label, i) => (
                <span key={i} className={`px-2 py-0.5 border rounded text-[10px] font-bold truncate max-w-[110px] ${colorClass}`} title={label}>
                    {label}
                </span>
            ))}
            {overflow > 0 && (
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[10px] font-bold">+{overflow} more</span>
            )}
        </div>
    );
}

// ============================================================================
// HELPERS — Price normalization
// ============================================================================
function normalizePrice(raw) {
    const n = parseFloat(raw);
    if (isNaN(n) || n < 0) return '';
    return n.toFixed(2);
}

// ============================================================================
// COMPONENT — Image Modal (Offloads DOM nodes from the main grid)
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
// COMPONENT — VariantRow (memoized for 300+ variant performance)
// ============================================================================
const VariantRow = React.memo(function VariantRow({
    v,
    selected,
    onToggleSelect,
    onUpdateVariant,
    onCloneVariant,
    onDeleteVariant,
    onOpenMediaModal,
    getAllowedStatuses,
    safeFix,
}) {
    const isLocked = v.status === 'LOCKED' || v.governance?.isLocked;
    const isArchived = v.status === 'ARCHIVED';
    const isActive = v.status === 'ACTIVE';
    const skuReadonly = isLocked || isArchived || isActive;
    const priceReadonly = isLocked || isActive;

    // ── Size badges
    const sizeLabels = Array.isArray(v.sizes) && v.sizes.length > 0
        ? v.sizes.map(s => s.sizeId?.displayName || s.sizeId?.value || s.sizeId?.name).filter(Boolean)
        : (v.sizeCode && v.sizeCode !== 'Fixed' ? [v.sizeCode] : []);

    // ── Attribute badges (prefer populated objects, fallback to variantLabel)
    const attrLabels = (() => {
        const attrObjs = Array.isArray(v.attributeValueIds)
            ? v.attributeValueIds.filter(a => a && typeof a === 'object' && a._id)
            : [];
        if (attrObjs.length > 0) return attrObjs.map(a => a.displayName || a.name || a.code);
        if (v.variantLabel) return v.variantLabel.split(' / ');
        return [];
    })();

    const rowBg = v.isNew
        ? 'bg-indigo-50/20'
        : selected
            ? 'bg-indigo-50/40'
            : 'even:bg-slate-50/40 hover:bg-white';

    return (
        <tr className={`transition-colors border-b border-slate-100/80 ${rowBg}`}>
            {/* SELECT */}
            <td className="px-4 py-4 w-[52px]">
                <input type="checkbox" checked={selected} onChange={onToggleSelect}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            </td>

            {/* COLOR */}
            <td className="px-3 py-4 w-[160px]">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="w-7 h-7 rounded-md border border-slate-200 shadow-sm shrink-0"
                        style={{ background: v.displayHex || v.rawColorId?.hexCode || (v.isColorway ? 'linear-gradient(135deg,#f00,#00f)' : '#e2e8f0') }}
                        title={v.displayColorName}
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700 truncate max-w-[100px]">
                            {v.displayColorName || v.rawColorId?.displayName || v.rawColorId?.name
                                || (v.isColorway ? v.colorwayName : null)
                                || <span className="text-slate-400 italic">No Color</span>}
                        </p>
                        {(v.rawColorId?.hexCode || v.displayHex) && (
                            <p className="text-[10px] font-mono text-slate-400">{v.rawColorId?.hexCode || v.displayHex}</p>
                        )}
                    </div>
                    {!v.isNew && <LockClosedIcon className="w-3 h-3 text-slate-300 shrink-0" />}
                </div>
            </td>

            {/* SIZE */}
            <td className="px-3 py-4 w-[130px]">
                {sizeLabels.length > 0
                    ? <BadgeList items={sizeLabels} colorClass="bg-blue-50 border-blue-200 text-blue-700" />
                    : <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fixed</span>}
            </td>

            {/* ATTRIBUTES */}
            <td className="px-3 py-4 w-[220px]">
                {attrLabels.length > 0
                    ? <BadgeList items={attrLabels} colorClass="bg-indigo-50 border-indigo-200 text-indigo-700" />
                    : <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">—</span>}
            </td>

            {/* SKU */}
            <td className="px-4 py-4 w-[160px]">
                <input type="text" value={v.sku || ''} readOnly={skuReadonly}
                    onChange={e => onUpdateVariant(v._id, 'sku', e.target.value)}
                    title={skuReadonly ? `SKU locked (${v.status})` : 'Edit SKU'}
                    className="w-full font-mono text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:bg-white focus:border-indigo-500 outline-none read-only:bg-slate-100 read-only:text-slate-400 read-only:cursor-not-allowed"
                />
            </td>

            {/* PRICE */}
            <td className="px-4 py-4 w-[120px]">
                <div className="relative">
                    <span className="absolute left-2 top-[7px] text-xs font-bold text-slate-400">₹</span>
                    <input type="number" step="0.01" min="0"
                        value={v.price || ''}
                        readOnly={priceReadonly}
                        onChange={e => onUpdateVariant(v._id, 'price', e.target.value)}
                        onBlur={e => {
                            const norm = normalizePrice(e.target.value);
                            if (norm !== '' && norm !== v.price?.toString()) onUpdateVariant(v._id, 'price', norm);
                        }}
                        className={`w-full font-semibold text-sm pl-6 pr-2 py-1.5 border rounded outline-none ${priceReadonly ? 'bg-slate-100 border-transparent text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200 focus:border-indigo-500'}`}
                    />
                </div>
            </td>

            {/* RESOLVED PRICE */}
            <td className="px-4 py-4 w-[140px] relative group">
                {v.resolvedPrice && !v.isNew ? (
                    <div className="font-semibold text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5 inline-flex items-center gap-1 cursor-default">
                        <span>₹{safeFix(v.resolvedPrice)}</span>
                        {v.priceResolutionLog?.length > 0 && (
                            <div className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] cursor-help">i</div>
                        )}
                    </div>
                ) : (
                    <span className="text-[10px] uppercase font-bold text-slate-400">Preview</span>
                )}
                {v.priceResolutionLog?.length > 0 && !v.isNew && (
                    <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 w-64 bg-slate-800 text-white p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                        <div className="font-bold text-xs mb-2 text-slate-300 border-b border-slate-600 pb-1">Price Resolution Log</div>
                        <div className="space-y-1.5 text-xs">
                            {v.priceResolutionLog.map((log, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="text-slate-400 truncate w-32" title={log.source}>
                                        {log.source === 'BASE' ? 'Base Price' : log.modifierType || 'Modifier'}
                                    </span>
                                    <span className="text-emerald-400 font-mono">+₹{safeFix(log.appliedAmount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </td>

            {/* MEDIA */}
            <td className="px-4 py-4 w-[110px]">
                <button onClick={() => onOpenMediaModal(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors hover:bg-slate-50">
                    <PhotoIcon className="w-4 h-4 text-indigo-500" />
                    {v.imageGallery?.length || 0}
                </button>
            </td>

            {/* STATUS */}
            <td className="px-4 py-4 w-[150px]">
                {isLocked || isArchived ? (
                    <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full inline-block ${isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : v.status === 'DRAFT' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : v.status === 'OUT_OF_STOCK' ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>{v.status?.replace('_', ' ')}</span>
                        {v.governance?.isLocked && <LockClosedIcon className="w-3 h-3 text-slate-400" title="Governance Locked" />}
                    </div>
                ) : (
                    <select
                        value={v.status || 'DRAFT'}
                        onChange={e => onUpdateVariant(v._id, 'status', e.target.value)}
                        disabled={isLocked}
                        className="w-full text-[11px] font-bold uppercase tracking-wide py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-slate-300 transition-colors"
                    >
                        {getAllowedStatuses(v.status || 'DRAFT').map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                    </select>
                )}
            </td>

            {/* ACTIONS */}
            <td className="px-4 py-4 w-[80px] text-right">
                <div className="flex items-center justify-end gap-1">
                    {!v.isNew && (
                        <button onClick={() => onCloneVariant(v._id)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Clone to Draft">
                            <Square3Stack3DIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => onDeleteVariant(v._id, v.isNew)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

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
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusConfirmModal, setStatusConfirmModal] = useState(null); // { id, newStatus, currentStock }
    const [selectedVariantIds, setSelectedVariantIds] = useState([]); // For Bulk Actions
    const [genericConfirm, setGenericConfirm] = useState(null); // { title, message, onConfirm, confirmText, type }

    const PAGE_SIZE = 50;

    const fetchAllData = useCallback(async () => {
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

                let sizeCode = 'Fixed'; // Default for attribute-only variants (no Size axis)
                let sizeId = null;

                // Support Enterprise schema (v.sizes array) or legacy (v.sizeId / v.size)
                let enterpriseSize = null;

                if (Array.isArray(v.sizes) && v.sizes.length > 0) {
                    const firstSize = v.sizes[0];

                    if (firstSize.sizeId) {
                        enterpriseSize = firstSize.sizeId;
                    } else if (typeof firstSize === 'string') {
                        enterpriseSize = firstSize;
                    } else if (firstSize._id) {
                        enterpriseSize = firstSize._id;
                    }
                }
                const sizeObj = enterpriseSize || v.sizeId || v.size;

                if (sizeObj && typeof sizeObj === 'object') {
                    sizeCode = sizeObj.code || sizeObj.name || sizeObj.displayName || 'Fixed';
                    sizeId = sizeObj._id;
                } else if (sizeObj) {
                    const sId = sizeObj;
                    const matchedSize = loadedSizes.find(s => s._id === sId || s._id?.toString() === sId?.toString());
                    sizeCode = matchedSize?.code || matchedSize?.name || matchedSize?.displayName || v.attributes?.size || 'Fixed';
                    sizeId = sId;
                }

                // ── Preserve & normalize attributeValueIds ──────────────────────
                // Normalize each entry: could be ObjectId string OR populated object
                const rawAttrIds =
                    Array.isArray(v.attributeValueIds)
                        ? v.attributeValueIds
                        : Array.isArray(v.attributeValues)
                            ? v.attributeValues
                            : [];
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

                // Build a nice label for the table from attributes
                // FIX: was incorrectly referencing `loadedAttrTypes` — use `loadedTypes`
                const labels = normalizedAttrDimensions.map(d => {
                    const attrType = loadedTypes.find(t =>
                        t._id === d.attributeId ||
                        t._id?.toString() === d.attributeId?.toString() ||
                        t.name === d.attributeName
                    );

                    // Resolution Priority: Type-Specific Values > Global Attribute Values > Colors > Sizes
                    const attrVal = (attrType?.values || loadedVals).find(val =>
                        val._id === d.valueId ||
                        val._id?.toString() === d.valueId?.toString()
                    ) || (d.attributeName?.toLowerCase() === 'color' ? loadedColors.find(c => c._id === d.valueId || c._id?.toString() === d.valueId?.toString()) : null)
                        || (d.attributeName?.toLowerCase() === 'size' ? loadedSizes.find(s => s._id === d.valueId || s._id?.toString() === d.valueId?.toString()) : null);

                    return attrVal?.name || attrVal?.displayName || attrVal?.value || d.attributeName || d.valueId;
                });
                const variantLabel = labels.filter(Boolean).join(' / ');

                return {
                    ...v,
                    isNew: false,
                    isEdited: false,
                    sizeCode,
                    size: typeof v.size === 'object' ? v.size : null,
                    sizeId,
                    // colorId: string ID used for OCC / save payloads
                    colorId,
                    // rawColorId: full populated color object — used for Color column display
                    // (the spread `...v` sets colorId to the populated obj, then we override
                    //  colorId with just the string ID above, so we preserve the obj separately)
                    rawColorId: (typeof v.colorId === 'object' && v.colorId?._id) ? v.colorId : null,
                    isColorway,
                    displayColorName,
                    displayHex,
                    displayPalette,
                    variantLabel,
                    // ── Preserve attributeValueIds from DB — keep populated objects for Attributes column ──
                    // normalizedAttrValueIds contains string IDs for diffing; raw v.attributeValueIds
                    // may contain populated objects which we need for the Attributes column display.
                    attributeValueIds: Array.isArray(v.attributeValueIds) ? v.attributeValueIds : [],
                    attributeValueIdsSorted: [...normalizedAttrValueIds].sort(), // for hash diffing
                    // ── Structured attribute metadata for deterministic identity keys ──
                    attributeDimensions: normalizedAttrDimensions,
                    // Preserve precise decimals
                    price: typeof v.price === 'object' && v.price.$numberDecimal ? v.price.$numberDecimal : v.price?.toString() || '0',
                    status: (v.status === true || v.status?.toLowerCase() === 'active') ? 'ACTIVE' : v.status,
                    // Explicitly preserve governance so OCC version is available at save time
                    governance: v.governance ?? null,
                };
            });

            setVariants(existingArgs);
        } catch (error) {
            toast.error('Failed to load product data');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const toggleDimensionSelection = useCallback((namespace, id) => {
        setSelectedDimensions(prev => {
            const current = prev[namespace] || [];
            const updated = current.includes(id)
                ? current.filter(existing => existing !== id)
                : [...current, id];

            return { ...prev, [namespace]: updated };
        });
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [productId, fetchAllData]);

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
                v.attributeDimensions.forEach((dim, idx) => {
                    // Key = ATTR:<attributeTypeId>:<valueId> — stable even if attr type has 0 values
                    const attrId = dim.attributeId || dim.attributeTypeId || dim.attributeName || `ATTR-${idx}`;
                    parts.push(`ATTR:${attrId}:${dim.valueId}`);
                });
            }
            return parts.sort().join('|') || `V-${v._id || Math.random().toString(36).slice(2, 9)}`;
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
                    const attrId = dim.attributeTypeId || dim.namespace.replace('ATTR:', '') || 'UNKNOWN';
                    parts.push(`ATTR:${attrId}:${dim.data._id}`);
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

    // --- SEARCH DEBOUNCE ---
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- GRID INTERACTIONS ---
    // Debounced UI update for performance
    const _doUpdateVariant = useCallback(async (id, field, value) => {
        setVariants(prev => prev.map(v => v._id === id ? { ...v, [field]: value, isEdited: true } : v));
    }, []);

    const updateVariant = useCallback(async (id, field, value) => {
        const variant = variants.find(v => v._id === id);
        if (!variant) return;

        // --- Production Guard: Archiving check ---
        if (value === 'ARCHIVED') {
            setGenericConfirm({
                title: 'Archive Variant?',
                message: 'Archiving a variant will remove it from the customer website immediately. You can restore it later from the archive filter.',
                confirmText: 'Archive Now',
                type: 'danger',
                onConfirm: () => _doUpdateVariant(id, field, value)
            });
            return;
        }

        // Validation: Stock check for deactivation
        if (field === 'status' && (value === 'ARCHIVED' || value === 'LOCKED' || value === 'OUT_OF_STOCK')) {
            const hasStock = (variant.inventory?.quantityOnHand || variant.stock || 0) > 0;
            if (hasStock) {
                setGenericConfirm({
                    title: 'Confirm Deactivation',
                    message: `This variant currently has ${hasStock} units in stock. Deactivating it will make it unavailable on the website. Are you sure?`,
                    confirmText: 'Deactivate',
                    type: 'danger',
                    onConfirm: () => _doUpdateVariant(id, field, value)
                });
                return;
            }
        }

        await _doUpdateVariant(id, field, value);
    }, [variants, _doUpdateVariant]);

    const confirmStatusChange = () => {
        if (!statusConfirmModal) return;
        const { id, newStatus } = statusConfirmModal;
        setVariants(prev => prev.map(v => v._id === id ? { ...v, status: newStatus, isEdited: true } : v));
        setStatusConfirmModal(null);
    };

    const deleteVariant = async (id, isNew) => {
        if (isNew) {
            setVariants(prev => prev.filter(v => v._id !== id));
            setSelectedVariantIds(prev => prev.filter(vid => vid !== id));
            toast.success('Removed');
            return;
        }

        setGenericConfirm({
            title: 'Delete Variant?',
            message: 'This action is permanent and cannot be undone. All history and data for this variant will be lost.',
            confirmText: 'Delete Permanently',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await variantAPI.delete(id);
                    toast.success('Variant deleted');
                    setSelectedVariantIds(prev => prev.filter(vid => vid !== id));
                    fetchAllData();
                } catch (error) {
                    toast.error('Failed to delete variant');
                }
            }
        });
    };

    const cloneVariant = useCallback(async (id) => {
        const tid = toast.loading('Cloning variant...');
        try {
            const res = await variantAPI.clone(id, { copyInventory: true });
            toast.success('Variant Cloned as DRAFT', { id: tid });
            await fetchAllData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Clone failed', { id: tid });
        }
    }, [fetchAllData]);

    const handleBulkStatusUpdate = async (newStatus) => {
        if (!newStatus || selectedVariantIds.length === 0) return;

        setGenericConfirm({
            title: `Bulk Update ${selectedVariantIds.length} Variants`,
            message: `Are you sure you want to change the status of ${selectedVariantIds.length} selected variants to ${newStatus}?`,
            confirmText: `Update to ${newStatus}`,
            type: newStatus === 'ARCHIVED' ? 'danger' : 'primary',
            onConfirm: async () => {
                const toastId = toast.loading(`Updating ${selectedVariantIds.length} variants...`);
                try {
                    const updates = selectedVariantIds.map(id => ({
                        id,
                        status: newStatus,
                        // governance.version is handled by backend or we fetch it if we had it
                    }));

                    // Assuming a bulk update endpoint exists or creating one
                    // For now, simulating with Promise.all and individual updates
                    await Promise.all(selectedVariantIds.map(id => {
                        const v = variants.find(item => item._id === id);
                        if (v.isNew) return Promise.resolve(); // Skip new variants for API update
                        return variantAPI.update(id, { status: newStatus, governance: { version: v.governance?.version } });
                    }));

                    toast.success('Bulk status update successful', { id: toastId });
                    setSelectedVariantIds([]);
                    await fetchAllData();
                } catch (error) {
                    toast.error(error?.response?.data?.message || 'Bulk update failed. Some variants may have conflicts.', { id: toastId });
                    await fetchAllData();
                }
            }
        });
    };

    const VALID_TRANSITIONS = {
        DRAFT: ['ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK'],
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
                    imageGallery: v.imageGallery || [],
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
                        } else if (code === 'VALIDATION_ERROR' || code === 'API_ERROR' || status === 400) {
                            // Surface validation/business-rule errors to the user instead of re-throwing
                            validationErrors.push(e?.response?.data?.message || 'Validation failed.');
                        } else {
                            throw e; // Re-throw only truly unexpected errors (5xx without known code)
                        }
                    })
                ));

                if (hasConflicts) {
                    // 409 OCC handler: snapshot in-flight edits, refetch fresh data,
                    // then re-apply the edits so users don't lose their work.
                    const pendingEdits = editedItems.map(v => ({ // capture what user changed
                        _id: v._id,
                        price: v.price,
                        sku: v.sku,
                        status: v.status,
                        imageGallery: v.imageGallery,
                    }));

                    const tid = toast.loading('Version conflict detected. Refreshing data...', { duration: 3000 });
                    await fetchAllData(); // loads fresh variants with up-to-date governance.version

                    // Re-apply the user's pending edits on top of the refreshed state
                    if (pendingEdits.length > 0) {
                        setVariants(prev => prev.map(v => {
                            const edit = pendingEdits.find(e => e._id === v._id);
                            if (!edit) return v;
                            return {
                                ...v,
                                price: edit.price,
                                sku: edit.sku,
                                status: edit.status,
                                imageGallery: edit.imageGallery,
                                isEdited: true, // mark as needing save again
                            };
                        }));
                        toast.success('Data refreshed. Your edits were preserved — click "Save All Changes" again.', { id: tid, duration: 5000 });
                    } else {
                        toast.dismiss(tid);
                    }
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
            if (!debouncedSearchTerm) return true;
            const term = debouncedSearchTerm.toLowerCase();
            return v.sku?.toLowerCase().includes(term) || v.displayColorName?.toLowerCase().includes(term) || v.sizeCode?.toLowerCase().includes(term);
        });
    }, [variants, filter, debouncedSearchTerm]);

    const totalPages = Math.ceil(filteredVariants.length / PAGE_SIZE);
    const paginatedVariants = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredVariants.slice(start, start + PAGE_SIZE);
    }, [filteredVariants, currentPage]);

    // Pagination guard: reset page if totalPages shrinks below current
    useEffect(() => {
        if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

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
            const merged = [...currentGallery];
            const uploadedImages = res.data.data.map((img, i) => ({
                url: img.url,
                altText: img.filename || '',
                isPrimary: currentGallery.length === 0 && i === 0,
                sortOrder: merged.length + i,  // Always unique: based on full merged length
                type: 'DETAIL',
            }));
            const newGallery = [...currentGallery, ...uploadedImages];
            updateVariant(variantId, 'imageGallery', newGallery);

            // Sync open modal
            setActiveImageModalVariant(prev => prev && prev._id === variantId ? { ...prev, imageGallery: newGallery } : prev);
            toast.success('Uploaded!', { id: toastId });
        } catch (error) {
            toast.error('Upload failed', { id: toastId });
        }
    }, [variants, updateVariant]);

    const handleRemoveImage = useCallback((variantId, index) => {
        const currentVariant = variants.find(v => v._id === variantId);
        if (!currentVariant) return;
        const gallery = currentVariant.imageGallery || [];
        const updated = gallery.filter((_, i) => i !== index);
        updateVariant(variantId, 'imageGallery', updated);
        setActiveImageModalVariant(prev => prev && prev._id === variantId ? { ...prev, imageGallery: updated } : prev);
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


    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return <div className="p-10 text-center font-bold text-slate-500">Product Not Found</div>;

    const isColorwayMode = product.variantType === 'COLORWAY';

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* STATUS CONFIRMATION MODAL */}
            {statusConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <ExclamationTriangleIcon className="w-8 h-8" />
                            <h3 className="text-lg font-bold">Dangerous Action Detected</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">
                            You are changing status to <span className="font-bold text-slate-900">{statusConfirmModal.newStatus}</span>, but this variant still has
                            <span className="font-bold text-indigo-600 mx-1">{statusConfirmModal.currentStock} units</span> in stock.
                            Active stock should be transferred or cleared before deactivating.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setStatusConfirmModal(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={confirmStatusChange} className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-md">Proceed Anyway</button>
                        </div>
                    </div>
                </div>
            )}

            {/* GENERIC CONFIRMATION MODAL */}
            {genericConfirm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 scale-in-center">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${genericConfirm.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {genericConfirm.type === 'danger' ? <TrashIcon className="w-8 h-8" /> : <ExclamationTriangleIcon className="w-8 h-8" />}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{genericConfirm.title || 'Are you sure?'}</h3>
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
                                className={`px-6 py-2.5 text-sm text-white rounded-xl shadow-lg active:scale-95 transition-all ${genericConfirm.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                            >
                                {genericConfirm.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>All</button>
                                <button onClick={() => setFilter('new')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filter === 'new' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>Drafts</button>
                            </div>

                            {selectedVariantIds.length > 0 && (
                                <div className="flex items-center gap-2 border-l border-slate-200 pl-4 animate-in fade-in slide-in-from-left-2 transition-all">
                                    <span className="text-xs font-bold text-slate-500">{selectedVariantIds.length} Selected</span>
                                    <select
                                        onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                                        className="text-[11px] font-bold uppercase tracking-wide py-1.5 pl-3 pr-8 border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none shadow-sm hover:border-slate-300 transition-colors"
                                    >
                                        <option value="">Bulk Action: Update Status</option>
                                        <option value="ACTIVE">Set Active</option>
                                        <option value="OUT_OF_STOCK">Set OOS</option>
                                        <option value="ARCHIVED">Set Archived</option>
                                    </select>
                                    <button onClick={() => setSelectedVariantIds([])} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase px-2">Cancel</button>
                                </div>
                            )}
                        </div>
                        <input type="text" placeholder="Search SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border border-slate-200 px-4 py-2 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50/30">
                        {filteredVariants.length === 0 ? (
                            /* ── EMPTY STATE ─────────────────────────────────── */
                            <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center">
                                <CubeIcon className="w-12 h-12 text-slate-300" />
                                <p className="text-lg font-bold text-slate-400">No Variants Generated Yet</p>
                                <p className="text-sm text-slate-400 max-w-xs">
                                    Use the Dimension Workspace above to select colors, sizes, and attributes, then click Generate.
                                </p>
                                <button
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="mt-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                                >
                                    ↑ Go to Generator
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm border-collapse min-w-max">
                                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur z-10 shadow-sm">
                                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {/* Select-all */}
                                        <th className="px-4 py-3 w-[52px]">
                                            <input
                                                type="checkbox"
                                                checked={selectedVariantIds.length === paginatedVariants.length && paginatedVariants.length > 0}
                                                onChange={e => {
                                                    if (e.target.checked) setSelectedVariantIds(paginatedVariants.map(v => v._id));
                                                    else setSelectedVariantIds([]);
                                                }}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </th>
                                        {/* Column headers from contract */}
                                        {VARIANT_COLUMNS.filter(c => c.key !== 'select').map(col => (
                                            <th key={col.key} className="px-3 py-3" style={{ minWidth: col.width }}>
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedVariants.map(v => (
                                        <VariantRow
                                            key={v._id}
                                            v={v}
                                            selected={selectedVariantIds.includes(v._id)}
                                            onToggleSelect={() =>
                                                setSelectedVariantIds(prev =>
                                                    prev.includes(v._id) ? prev.filter(id => id !== v._id) : [...prev, v._id]
                                                )
                                            }
                                            onUpdateVariant={updateVariant}
                                            onCloneVariant={cloneVariant}
                                            onDeleteVariant={deleteVariant}
                                            onOpenMediaModal={setActiveImageModalVariant}
                                            getAllowedStatuses={getAllowedStatuses}
                                            safeFix={safeFix}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center text-xs font-bold text-slate-500 flex-shrink-0">
                        {filteredVariants.length > 0 ? (
                            <span>
                                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredVariants.length)}
                                {' '}to {Math.min(currentPage * PAGE_SIZE, filteredVariants.length)}
                                {' '}of {filteredVariants.length}
                            </span>
                        ) : (
                            <span>0 variants</span>
                        )}
                        <div className="flex gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 border border-slate-200 rounded disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronLeftIcon className="w-4 h-4" /></button>
                            <span className="px-3 py-1.5 bg-slate-100 rounded">Page {currentPage} of {Math.max(1, totalPages)}</span>
                            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 border border-slate-200 rounded disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
                        </div>
                    </div>

                </section>
            </main>
        </div>
    );
};

export default VariantBuilder;

