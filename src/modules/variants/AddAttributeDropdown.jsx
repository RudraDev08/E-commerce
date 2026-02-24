/**
 * AddAttributeDropdown — Category-scoped attribute picker
 * ─────────────────────────────────────────────────────────
 * Opens a floating dropdown listing all attribute masters scoped
 * to the current product's categoryId. Admin selects one → caller
 * receives the full attribute type object (including its values).
 *
 * Props:
 *   categoryId        {string}   Product's categoryId for scoped fetch
 *   alreadyAddedIds   {string[]} Attribute IDs already in Section B (hide them)
 *   onAdd             {Function} Called with (attributeType) when admin selects one
 *   disabled          {boolean}  Disable when max attributes reached
 */

import React, {
    useState, useEffect, useRef, useCallback
} from 'react';
import {
    PlusIcon,
    TagIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { attributeTypeAPI, attributeValueAPI } from '../../Api/api.js';

// ─── Accent colors cycling for visual variety ─────────────────────────────────
const ACCENT_COLORS = [
    { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: 'text-cyan-600' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600' },
    { bg: 'bg-rose-100', text: 'text-rose-700', icon: 'text-rose-600' },
    { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
    { bg: 'bg-violet-100', text: 'text-violet-700', icon: 'text-violet-600' },
    { bg: 'bg-sky-100', text: 'text-sky-700', icon: 'text-sky-600' },
    { bg: 'bg-pink-100', text: 'text-pink-700', icon: 'text-pink-600' },
    { bg: 'bg-teal-100', text: 'text-teal-700', icon: 'text-teal-600' },
];

export default function AddAttributeDropdown({
    categoryId,
    alreadyAddedIds = [],
    onAdd,
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attributes, setAttributes] = useState([]);   // full AttributeType[]
    const [valueMap, setValueMap] = useState({});   // { typeId: AttributeValue[] }
    const [isCategoryScoped, setIsCategoryScoped] = useState(true);
    const [isFallback, setIsFallback] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    // ── Close on outside click ────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Focus search when dropdown opens ─────────────────────────────────────
    useEffect(() => {
        if (open && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 80);
        }
    }, [open]);

    // ── Clear cache whenever the product's category changes ─────────────────
    useEffect(() => {
        setAttributes([]);
        setValueMap({});
        setIsCategoryScoped(true);
        setIsFallback(false);
        setError(null);
    }, [categoryId]);

    // ── Fetch category-scoped attribute types + their values ──────────────────
    const fetchAttributes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Step 1: Get attribute types — category-scoped (backend falls back to all if none linked)
            let typesRes;
            if (categoryId) {
                typesRes = await attributeTypeAPI.getByCategory(categoryId);
            } else {
                typesRes = await attributeTypeAPI.getAll({ status: 'active', limit: 100 });
            }

            const types = typesRes.data.data || typesRes.data || [];
            const scopedFlag = typesRes.data.isCategoryScoped ?? true;
            const fallbackFlag = typesRes.data.fallback ?? false;

            // Step 2: Fetch all active attribute values once (batch)
            const valRes = await attributeValueAPI.getAll({ status: 'active', limit: 1000 });
            const allVals = valRes.data.data || valRes.data || [];

            // Step 3: Group values by attribute type ID (defensive)
            const grouped = {};
            allVals.forEach(v => {
                let typeRef =
                    v.typeId ||
                    v.type ||
                    v.attributeTypeId ||
                    v.attributeType ||
                    v.attributeMasterId;

                if (!typeRef) {
                    console.warn("AttributeValue missing type reference:", v);
                    return;
                }

                const key =
                    typeof typeRef === 'object'
                        ? typeRef._id?.toString()
                        : typeRef.toString();

                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(v);
            });

            setAttributes(types);
            setValueMap(grouped);
            setIsCategoryScoped(scopedFlag);
            setIsFallback(fallbackFlag);
        } catch (err) {
            setError('Failed to load attributes. Check API.');
            console.error('[AddAttributeDropdown] fetch error', err);
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    // Fetch on first open only (cache for session)
    useEffect(() => {
        if (open && attributes.length === 0 && !loading) {
            fetchAttributes();
        }
    }, [open, attributes.length, loading, fetchAttributes]);

    // ── Filtered list = fetched types minus already-added ones ────────────────
    const available = attributes.filter(at => {
        const id = at._id?.toString() ?? at.id?.toString() ?? '';
        if (alreadyAddedIds.includes(id)) return false;
        if (!search) return true;
        const name = (at.name || at.displayName || '').toLowerCase();
        return name.includes(search.toLowerCase());
    });

    // ── Handle selection ──────────────────────────────────────────────────────
    const handleSelect = useCallback((attrType) => {
        const id = attrType._id?.toString() ?? attrType.id?.toString() ?? '';
        const values = (valueMap[id] || []).map(v => ({
            id: v._id?.toString() ?? v.id?.toString(),
            value: v.value || v.name,
            displayName: v.displayName || v.value || v.name,
            slug: v.slug,
        }));

        onAdd({
            attributeMasterId: id,
            attributeName: attrType.name || attrType.displayName,
            availableValues: values,
            selectedValues: [],
        });

        setOpen(false);
        setSearch('');
    }, [onAdd, valueMap]);

    return (
        <div ref={containerRef} className="relative inline-block">
            {/* ── Trigger Button ────────────────────────────────────────────── */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                    border-2 transition-all duration-150 active:scale-95 select-none
                    ${disabled
                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        : open
                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'border-indigo-200 bg-white text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm'
                    }
                `}
                aria-haspopup="listbox"
                aria-expanded={open}
                id="add-attribute-btn"
            >
                <PlusIcon className="w-4 h-4 flex-shrink-0" />
                + Add Attribute
                <ChevronDownIcon
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* ── Dropdown Panel ────────────────────────────────────────────── */}
            {open && (
                <div
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200
                               z-50 overflow-hidden animate-slide-down"
                    role="listbox"
                    aria-label="Available attribute dimensions"
                >
                    {/* Search header */}
                    <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {categoryId ? 'Category Attributes' : 'All Attributes'}
                        </p>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search attributes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl
                                           bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300
                                           focus:bg-white placeholder:text-slate-400 transition-all"
                            />
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="max-h-72 overflow-y-auto py-2 custom-scrollbar">
                        {/* Loading state */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                                <ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-400" />
                                <p className="text-xs font-semibold">Loading attribute masters…</p>
                            </div>
                        )}

                        {/* Error state */}
                        {!loading && error && (
                            <div className="flex flex-col items-center justify-center py-8 gap-2 px-4">
                                <ExclamationCircleIcon className="w-7 h-7 text-red-400" />
                                <p className="text-xs font-bold text-red-600 text-center">{error}</p>
                                <button
                                    onClick={fetchAttributes}
                                    className="text-xs font-bold text-indigo-600 hover:underline mt-1"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Empty filtered */}
                        {!loading && !error && available.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400 px-4">
                                <TagIcon className="w-8 h-8 opacity-30" />
                                <p className="text-xs font-bold text-center">
                                    {search
                                        ? `No attributes match "${search}"`
                                        : alreadyAddedIds.length > 0 && attributes.length > 0
                                            ? 'All available attributes already added.'
                                            : 'No attribute types found for this category.'
                                    }
                                </p>
                            </div>
                        )}

                        {/* Attribute list */}
                        {!loading && !error && available.map((at, i) => {
                            const id = at._id?.toString() ?? at.id?.toString() ?? '';
                            const name = at.name || at.displayName || 'Unknown';
                            const valCount = (valueMap[id] || []).length;
                            const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];

                            return (
                                <button
                                    key={id}
                                    role="option"
                                    aria-selected="false"
                                    onClick={() => handleSelect(at)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50
                                               transition-colors text-left group"
                                >
                                    {/* Icon badge */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                                                    ${accent.bg} group-hover:scale-105 transition-transform`}>
                                        <TagIcon className={`w-4 h-4 ${accent.icon}`} />
                                    </div>

                                    {/* Name + value count */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 leading-none truncate">
                                            {name}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                            {valCount > 0
                                                ? `${valCount} value${valCount !== 1 ? 's' : ''} available`
                                                : 'No values configured'
                                            }
                                        </p>
                                    </div>

                                    {/* Add cue */}
                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlusIcon className="w-4 h-4 text-indigo-500" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer hint */}
                    {!loading && !error && attributes.length > 0 && (
                        <div className={`px-4 py-2.5 border-t ${isFallback ? 'border-amber-100 bg-amber-50/60' : 'border-slate-100 bg-slate-50/80'}`}>
                            {isFallback ? (
                                <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                                    <span>⚠</span>
                                    Showing all attributes — none linked to this category yet.
                                    Link in Attribute Manager for scoped results.
                                </p>
                            ) : (
                                <p className="text-[10px] text-slate-400 font-semibold">
                                    {available.length} of {attributes.length} attribute{attributes.length !== 1 ? 's' : ''} available
                                    {isCategoryScoped && categoryId && ' · Category-scoped'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
