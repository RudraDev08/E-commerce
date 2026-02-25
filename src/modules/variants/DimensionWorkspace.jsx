/**
 * DimensionWorkspace — N-Dimensional Variant Builder Workspace  v3
 * ─────────────────────────────────────────────────────────────────
 *
 * Three-section layout:
 *   Section A: Base dimensions (Color, Size) — always visible
 *   Section B: Attribute dimension panels — dynamic, category-driven
 *   Section C: Variant grid — Cartesian product rows, editable inline
 *
 * Props:
 *   productGroupId  {string}   MongoDB ObjectId of the ProductGroup
 *   productSlug     {string}   Used for auto-SKU prefix
 *   categoryId      {string}   Product's category — scopes attribute fetch
 *   brand           {string}
 *   basePrice       {number}
 *   colors          {DimensionValue[]}
 *   sizes           {DimensionValue[]}
 *   onGenerate      {Function} async (apiPayload) => void
 *   generating      {boolean}
 *
 * Architecture:
 *   • Section B state lives HERE (not in the engine) so panels can be
 *     added/removed without engine re-registration side effects.
 *   • useCartesianEngine is still the single source of truth for
 *     generated rows — attribute panels plug in via registerDimension /
 *     removeDimension when their selection changes.
 *   • AddAttributeDropdown fetches /api/attribute-types/category/:id
 *   • AttributePanelCard renders identically to Color/Size panels.
 */

import React, {
    useState, useEffect, useCallback, useMemo, memo
} from 'react';
import {
    SparklesIcon, SwatchIcon, CubeIcon, TagIcon,
    ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon,
    CheckIcon, MagnifyingGlassIcon, ArrowPathIcon,
    TrashIcon, BoltIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import {
    useCartesianEngine,
    MAX_COMBINATIONS,
    toSlug,
} from './useCartesianEngine.js';

import AddAttributeDropdown from './AddAttributeDropdown.jsx';
import AttributePanelCard from './AttributePanelCard.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// EXPLOSION GUARD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ExplosionModal({ count, limit, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 z-[999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-5 animate-slide-up">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ExclamationTriangleIcon className="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-900 text-lg">Large Combination Set</h2>
                        <p className="text-sm text-slate-500 mt-0.5">This may take a moment to generate.</p>
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 font-medium">
                    You are about to generate{' '}
                    <span className="font-black text-amber-900">{count.toLocaleString()} combinations</span>.
                    {count > limit && (
                        <span className="block mt-1 text-red-600 font-bold">
                            ⚠ This exceeds the safe limit of {limit.toLocaleString()}. Reduce selections to continue.
                        </span>
                    )}
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Go Back
                    </button>
                    {count <= limit && (
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl font-bold text-white transition-colors"
                        >
                            Generate Anyway
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSION PANEL (Color / Size base panels) — collapsible checkbox group
// ─────────────────────────────────────────────────────────────────────────────
const DimensionPanel = memo(function DimensionPanel({
    dimensionKey, label, icon: IconComp, allValues,
    isSelected, toggleValue, selectAll, deselectAll, selectedCount,
    accent = 'indigo',
}) {
    const [open, setOpen] = useState(true);
    const [search, setSearch] = useState('');

    const filtered = allValues.filter(v =>
        !search || (v.label ?? v.value ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const allSel = selectedCount === allValues.length && allValues.length > 0;

    const accentMap = {
        indigo: { badge: 'bg-indigo-100 text-indigo-700', check: 'border-indigo-500 bg-indigo-500', sel: 'bg-indigo-50 border-indigo-200', label: 'text-indigo-700' },
        violet: { badge: 'bg-violet-100 text-violet-700', check: 'border-violet-500 bg-violet-500', sel: 'bg-violet-50 border-violet-200', label: 'text-violet-700' },
        cyan: { badge: 'bg-cyan-100 text-cyan-700', check: 'border-cyan-500 bg-cyan-500', sel: 'bg-cyan-50 border-cyan-200', label: 'text-cyan-700' },
        rose: { badge: 'bg-rose-100 text-rose-700', check: 'border-rose-500 bg-rose-500', sel: 'bg-rose-50 border-rose-200', label: 'text-rose-700' },
        amber: { badge: 'bg-amber-100 text-amber-700', check: 'border-amber-500 bg-amber-500', sel: 'bg-amber-50 border-amber-200', label: 'text-amber-700' },
        emerald: { badge: 'bg-emerald-100 text-emerald-700', check: 'border-emerald-500 bg-emerald-500', sel: 'bg-emerald-50 border-emerald-200', label: 'text-emerald-700' },
    };
    const a = accentMap[accent] ?? accentMap.indigo;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
            {/* Header */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.badge}`}>
                    <IconComp className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-none">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{allValues.length} values available</p>
                </div>
                {selectedCount > 0 && (
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${a.badge}`}>
                        {selectedCount} selected
                    </span>
                )}
                {open
                    ? <ChevronUpIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDownIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                }
            </button>

            {/* Body */}
            {open && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
                    {allValues.length > 5 && (
                        <div className="pt-3 flex gap-2">
                            <div className="relative flex-1">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search values..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
                                />
                            </div>
                            <button
                                onClick={() => allSel ? deselectAll(dimensionKey) : selectAll(dimensionKey)}
                                className="text-xs font-bold text-slate-500 hover:text-indigo-600 px-3 py-2 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors whitespace-nowrap"
                            >
                                {allSel ? 'None' : 'All'}
                            </button>
                        </div>
                    )}

                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {filtered.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-4 italic">No values match &ldquo;{search}&rdquo;</p>
                        )}
                        {filtered.map(val => {
                            const sel = isSelected(dimensionKey, val.id);
                            return (
                                <label
                                    key={val.id}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all group border
                                        ${sel ? `${a.sel}` : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                                >
                                    <span
                                        onClick={() => toggleValue(dimensionKey, val.id)}
                                        className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all
                                            ${sel ? `${a.check}` : 'border-slate-300 group-hover:border-slate-400'}`}
                                    >
                                        {sel && <CheckIcon className="w-3 h-3 text-white stroke-[3]" />}
                                    </span>
                                    {val.hex && (
                                        <span
                                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            style={{ background: val.hex }}
                                        />
                                    )}
                                    <span
                                        onClick={() => toggleValue(dimensionKey, val.id)}
                                        className={`flex-1 text-sm font-semibold leading-none ${sel ? a.label : 'text-slate-700'}`}
                                    >
                                        {val.label}
                                    </span>
                                    {val.sub && (
                                        <span className="text-[10px] text-slate-400 font-medium tabular-nums">{val.sub}</span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT ROW (single editable grid row)
// ─────────────────────────────────────────────────────────────────────────────
const VariantRow = memo(function VariantRow({ row, hasColor, hasSize, attributeKeys, onUpdate, onDelete }) {
    const inputCls = `w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-white transition`;

    return (
        <tr className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-100 last:border-0">
            {/* Identity / Key column */}
            <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-indigo-50/30 z-10">
                <div className="flex items-center gap-2.5 min-w-[180px]">
                    <div className="min-w-0">
                        <p className="font-mono text-[9px] text-slate-400 truncate max-w-[180px]">
                            {row.combinationKey}
                        </p>
                    </div>
                    {row.isNew && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" title="New row" />
                    )}
                </div>
            </td>

            {/* Base Dimension: Color */}
            {hasColor && (
                <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                        {row.selections.color?.hex && (
                            <span
                                className="w-4 h-4 rounded-full border border-slate-200 shadow-sm shrink-0"
                                style={{ background: row.selections.color.hex }}
                            />
                        )}
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                            {row.selections.color?.label || '—'}
                        </span>
                    </div>
                </td>
            )}

            {/* Base Dimension: Size */}
            {hasSize && (
                <td className="px-3 py-3 text-center">
                    <span className="text-xs font-black text-slate-700 bg-slate-100 rounded-lg px-2 py-1">
                        {row.selections.size?.label || '—'}
                    </span>
                </td>
            )}

            {/* Dynamic attribute columns */}
            {attributeKeys.map(k => (
                <td key={k} className="px-3 py-3 text-center">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 whitespace-nowrap">
                        {row.selections[k]?.label ?? '—'}
                    </span>
                </td>
            ))}

            {/* SKU */}
            <td className="px-3 py-3 min-w-[140px]">
                <input
                    type="text"
                    value={row.sku}
                    onChange={e => onUpdate(row.combinationKey, 'sku', e.target.value)}
                    className={`${inputCls} font-mono`}
                    placeholder="SKU"
                />
            </td>

            {/* Price */}
            <td className="px-3 py-3 min-w-[100px]">
                <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₹</span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.price}
                        onChange={e => onUpdate(row.combinationKey, 'price', e.target.value)}
                        className={`${inputCls} pl-6`}
                        placeholder="0.00"
                    />
                </div>
            </td>

            {/* Stock */}
            <td className="px-3 py-3 min-w-[80px]">
                <input
                    type="number"
                    min="0"
                    value={row.stock}
                    onChange={e => onUpdate(row.combinationKey, 'stock', parseInt(e.target.value) || 0)}
                    className={inputCls}
                    placeholder="0"
                />
            </td>

            {/* Barcode */}
            <td className="px-3 py-3 min-w-[120px]">
                <input
                    type="text"
                    value={row.barcode}
                    onChange={e => onUpdate(row.combinationKey, 'barcode', e.target.value)}
                    className={`${inputCls} font-mono`}
                    placeholder="Optional"
                />
            </td>

            {/* Delete */}
            <td className="px-3 py-3 text-right">
                <button
                    onClick={() => onDelete(row.combinationKey)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove row"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT GRID — paginated, searchable table
// ─────────────────────────────────────────────────────────────────────────────
function VariantGrid({ rows, dimensionOrder, updateRow, onDelete, search }) {
    const PAGE = 50;
    const [page, setPage] = useState(1);

    const filtered = search
        ? rows.filter(r =>
            r.combinationKey.includes(search.toLowerCase()) ||
            r.sku.toLowerCase().includes(search.toLowerCase())
        )
        : rows;

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE));
    const paginated = filtered.slice((page - 1) * PAGE, page * PAGE);

    // Column definitions
    const hasColor = dimensionOrder.includes('color');
    const hasSize = dimensionOrder.includes('size');
    const attrKeys = dimensionOrder.filter(k => k !== 'color' && k !== 'size');

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <CubeIcon className="w-12 h-12 opacity-30" />
                <p className="font-bold text-sm">No combinations generated yet.</p>
                <p className="text-xs">Select values in the dimension panels above, then click Generate.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100/95 backdrop-blur z-10 shadow-sm">
                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-4 py-3 sticky left-0 bg-slate-100/95 z-20 min-w-[200px]">Identity</th>
                            {hasColor && <th className="px-3 py-3 text-center">Color</th>}
                            {hasSize && <th className="px-3 py-3 text-center">Size</th>}
                            {attrKeys.map(k => (
                                <th key={k} className="px-3 py-3 text-center capitalize whitespace-nowrap">
                                    {k.replace(/^attr[-_]?/i, '')}
                                </th>
                            ))}
                            <th className="px-3 py-3 min-w-[140px]">SKU</th>
                            <th className="px-3 py-3 min-w-[100px]">Price</th>
                            <th className="px-3 py-3 min-w-[80px]">Stock</th>
                            <th className="px-3 py-3 min-w-[120px]">Barcode</th>
                            <th className="px-3 py-3 w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(row => (
                            <VariantRow
                                key={row.combinationKey}
                                row={row}
                                hasColor={hasColor}
                                hasSize={hasSize}
                                attributeKeys={attrKeys}
                                onUpdate={updateRow}
                                onDelete={onDelete}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex-shrink-0 border-t border-slate-200 px-5 py-3 flex items-center justify-between bg-white">
                <span className="text-xs font-bold text-slate-500">
                    {total === 0
                        ? '0 rows'
                        : `Showing ${(page - 1) * PAGE + 1}–${Math.min(page * PAGE, total)} of ${total}`
                    }
                </span>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >Prev</button>
                    <span className="text-xs font-bold text-slate-600 px-2">{page} / {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >Next</button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNT BADGE — inline equation bar chip
// ─────────────────────────────────────────────────────────────────────────────
function CountBadge({ count, willWarn, willExplode }) {
    if (count === 0) return null;
    const cls = willExplode
        ? 'bg-red-100 text-red-700 border border-red-200'
        : willWarn
            ? 'bg-amber-100 text-amber-700 border border-amber-200'
            : 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${cls}`}>
            <BoltIcon className="w-3.5 h-3.5" />
            {count.toLocaleString()} combinations
            {willExplode && ' — limit exceeded'}
            {willWarn && !willExplode && ' — large set'}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPLOSION GUARD INLINE BANNER (inside formula bar)
// ─────────────────────────────────────────────────────────────────────────────
function ExplosionBanner({ count, willWarn, willExplode }) {
    if (!willWarn && !willExplode) return null;
    if (willExplode) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                Limit exceeded — {count.toLocaleString()} combos exceeds {MAX_COMBINATIONS.toLocaleString()}. Reduce selections.
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            Large combination set — this will create {count.toLocaleString()} variants.
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION B EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function SectionBEmptyState() {
    return (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl py-10 px-6 flex flex-col items-center gap-3 text-slate-400">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <TagIcon className="w-6 h-6 opacity-50" />
            </div>
            <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-500">No attribute dimensions added.</p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                    Click <span className="font-bold text-indigo-600">+ Add Attribute</span> to include
                    processor, RAM, storage or any other spec for this category.
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Accent cycle for attribute panels (starts after indigo & violet used by A)
// ─────────────────────────────────────────────────────────────────────────────
const ATTR_ACCENT_CYCLE = ['cyan', 'emerald', 'rose', 'amber', 'violet', 'sky', 'pink', 'teal'];
const getAttrAccent = (i) => ATTR_ACCENT_CYCLE[i % ATTR_ACCENT_CYCLE.length];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: DimensionWorkspace
// ─────────────────────────────────────────────────────────────────────────────
export default function DimensionWorkspace({
    productGroupId,
    productSlug = 'VAR',
    categoryId = null,   // ← NEW: product's categoryId for Section B scoping
    brand = '',
    basePrice = 0,
    colors = [],     // [{ id, label, hex }]
    sizes = [],     // [{ id, label, sub }]
    onGenerate,              // async (apiPayload) => void
    generating = false,
}) {
    const engine = useCartesianEngine({ productSlug });
    const {
        dimensionDefs, dimensionOrder, generatedRows, previewCount,
        willExplode, willWarn,
        registerDimension, removeDimension, toggleValue, selectAll, deselectAll,
        updateRow, reset, isSelected, selectedCountFor, selectedIds, buildApiPayload,
    } = engine;

    // ── Section B: attribute panels state ────────────────────────────────────
    /**
     * attributePanels: AttributePanelState[]
     * [{
     *    attributeMasterId: string,
     *    attributeName:     string,
     *    availableValues:   { id, value, displayName, slug }[],
     *    selectedValues:    string[]   — kept in sync with engine selectedIds
     * }]
     */
    const [attributePanels, setAttributePanels] = useState([]);

    // ── Grid extras ──────────────────────────────────────────────────────────
    const [gridSearch, setGridSearch] = useState('');
    const [deletedKeys, setDeletedKeys] = useState(new Set());
    const [showExplosionModal, setShowExplosionModal] = useState(false);
    const [showWorkspace, setShowWorkspace] = useState(true);

    // ── Register base dimensions when master data arrives ────────────────────
    useEffect(() => {
        if (colors.length > 0)
            registerDimension(
                'color', 'Color',
                colors.map(c => ({ ...c, hex: c.hex ?? c.hexCode })),
                'color'
            );
    }, [colors, registerDimension]);

    useEffect(() => {
        if (sizes.length > 0)
            registerDimension(
                'size', 'Size',
                sizes.map(s => ({
                    id: s.id ?? s._id,
                    label: s.label ?? s.displayName ?? s.value,
                    sub: s.sub ?? s.category,
                })),
                'size'
            );
    }, [sizes, registerDimension]);

    // ── Register attribute panels into the engine ─────────────────────────────
    useEffect(() => {
        attributePanels.forEach(panel => {
            // Register all available values pool with the engine
            registerDimension(`attr:${panel.attributeMasterId}`, {
                type: 'ATTRIBUTE',
                attributeId: panel.attributeMasterId,
                attributeName: panel.attributeName,
                values: panel.availableValues.map(v => ({
                    id: v.id,
                    label: v.displayName || v.value,
                    slug: v.slug ?? (v.displayName || v.value ? toSlug(v.displayName || v.value) : '')
                }))
            });
        });
    }, [attributePanels, registerDimension]);

    // ── Add a new attribute panel ─────────────────────────────────────────────
    const handleAddPanel = useCallback((attrTypeObj) => {
        // Prevent duplicates
        setAttributePanels(prev => {
            if (prev.some(p => p.attributeMasterId === attrTypeObj.attributeMasterId)) {
                return prev;
            }
            return [...prev, attrTypeObj];
        });
    }, []);

    // ── Remove an attribute panel ─────────────────────────────────────────────
    const handleRemovePanel = useCallback((attributeMasterId) => {
        setAttributePanels(prev => prev.filter(p => p.attributeMasterId !== attributeMasterId));
        removeDimension(`attr:${attributeMasterId}`);
        // Purge deleted rows that referenced this dimension
        setDeletedKeys(new Set());
    }, [removeDimension]);

    // ── Visible rows = generated - user-deleted ──────────────────────────────
    const visibleRows = generatedRows.filter(r => !deletedKeys.has(r.combinationKey));

    // ── Delete one row locally ────────────────────────────────────────────────
    const handleDeleteRow = useCallback(combinationKey => {
        setDeletedKeys(prev => new Set([...prev, combinationKey]));
    }, []);

    // ── Generate/Confirm ─────────────────────────────────────────────────────
    const handleGenerateClick = useCallback(() => {

        if (
            (selectedIds.get('color')?.size ?? 0) === 0 &&
            (selectedIds.get('size')?.size ?? 0) === 0 &&
            [...selectedIds.keys()].filter(k => k.startsWith('attr:')).length === 0
        ) {
            return toast.error("Select at least one dimension.");
        }

        if (previewCount === 0) return;
        if (willExplode || willWarn) {
            setShowExplosionModal(true);
            return;
        }
        _doGenerate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewCount, willExplode, willWarn, selectedIds]);

    const _doGenerate = useCallback(async () => {
        setShowExplosionModal(false);
        if (!onGenerate) return;
        const apiPayload = buildApiPayload(productGroupId, brand, basePrice);

        // Step 6: Debug payload confirm

        await onGenerate(apiPayload, visibleRows);
    }, [buildApiPayload, onGenerate, productGroupId, brand, basePrice, visibleRows]);

    // ── Derived: IDs already in Section B (for dropdown deduplication) ───────
    const addedAttributeIds = useMemo(
        () => attributePanels.map(p => p.attributeMasterId),
        [attributePanels]
    );

    // ── Derived: panels that are present but have ZERO available values ────────
    // These cannot contribute to the Cartesian product but we want to surface
    // them as a clear warning so the user knows WHY generation is blocked/limited.
    const emptyPanels = useMemo(
        () => attributePanels.filter(p => !p.availableValues?.length),
        [attributePanels]
    );
    const hasEmptyPanels = emptyPanels.length > 0;

    // Separate: base dims vs attribute dims for layout
    const baseDimKeys = ['color', 'size'];
    const attrDimKeys = [...dimensionDefs.keys()].filter(k => !baseDimKeys.includes(k));

    // ── Equation bar: build the × expression ────────────────────────────────
    const equationParts = dimensionOrder
        .map(key => ({ key, count: selectedCountFor(key), def: dimensionDefs.get(key) }))
        .filter(({ count }) => count > 0);

    return (
        <div className="space-y-5">
            {/* ═══════════════════════════════════════════════════════════════
                MASTER HEADER
            ════════════════════════════════════════════════════════════════ */}
            <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowWorkspace(o => !o)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
                            Dimension Workspace
                        </h2>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            N-dimensional Cartesian engine — v3
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <CountBadge count={previewCount} willWarn={willWarn} willExplode={willExplode} />
                    {showWorkspace
                        ? <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                        : <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                    }
                </div>
            </div>

            {showWorkspace && (
                <>
                    {/* ═════════════════════════════════════════════════════════
                        SECTION A — BASE DIMENSIONS (Color + Size)
                    ══════════════════════════════════════════════════════════ */}
                    {(dimensionDefs.has('color') || dimensionDefs.has('size')) && (
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3 flex items-center gap-2">
                                <span className="w-4 h-px bg-slate-300 block" />
                                A — Base Dimensions
                                <span className="flex-1 h-px bg-slate-100 block" />
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {baseDimKeys.map((key, i) => {
                                    if (!dimensionDefs.has(key)) return null;
                                    const def = dimensionDefs.get(key);
                                    return (
                                        <DimensionPanel
                                            key={key}
                                            dimensionKey={key}
                                            label={def.label}
                                            icon={key === 'color' ? SwatchIcon : CubeIcon}
                                            allValues={def.allValues}
                                            isSelected={isSelected}
                                            toggleValue={toggleValue}
                                            selectAll={selectAll}
                                            deselectAll={deselectAll}
                                            selectedCount={selectedCountFor(key)}
                                            accent={i === 0 ? 'indigo' : 'violet'}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ═════════════════════════════════════════════════════════
                        SECTION B — ATTRIBUTE DIMENSIONS (Dynamic)
                    ══════════════════════════════════════════════════════════ */}
                    <div>
                        {/* Section B header */}
                        <div className="flex items-center justify-between px-1 mb-3 mt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-4 h-px bg-slate-300 block" />
                                B — Attribute Dimensions
                                {attributePanels.length > 0 && (
                                    <span className="text-indigo-500 font-black">
                                        ({attributePanels.length} {attributePanels.length === 1 ? 'axis' : 'axes'})
                                    </span>
                                )}
                                <span className="flex-1 h-px bg-slate-100 block" />
                            </p>

                            {/* + Add Attribute button */}
                            <div onClick={e => e.stopPropagation()}>
                                <AddAttributeDropdown
                                    categoryId={categoryId}
                                    alreadyAddedIds={addedAttributeIds}
                                    onAdd={handleAddPanel}
                                    disabled={false}
                                />
                            </div>
                        </div>

                        {/* Section B body */}
                        {attributePanels.length === 0 ? (
                            <SectionBEmptyState />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {attributePanels.map((panel, i) => (
                                    <AttributePanelCard
                                        key={panel.attributeMasterId}
                                        panelState={panel}
                                        isSelected={isSelected}
                                        toggleValue={toggleValue}
                                        selectAll={selectAll}
                                        deselectAll={deselectAll}
                                        selectedCount={selectedCountFor(`attr:${panel.attributeMasterId}`)}
                                        onRemove={() => handleRemovePanel(panel.attributeMasterId)}
                                        accent={getAttrAccent(i)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ═════════════════════════════════════════════════════════
                        EQUATION BAR + EXPLOSION GUARD + GENERATE BUTTON
                    ══════════════════════════════════════════════════════════ */}
                    <div className="space-y-2">

                        {/* Explosion guard banner */}
                        <ExplosionBanner
                            count={previewCount}
                            willWarn={willWarn}
                            willExplode={willExplode}
                        />

                        {/* Formula bar */}
                        <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
                            {/* Dimension equation */}
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 min-w-0 flex-1">
                                {equationParts.length === 0 && emptyPanels.length === 0 && (
                                    <span className="text-slate-400 italic font-medium">
                                        Select values to preview combinations
                                    </span>
                                )}
                                {equationParts.length === 0 && emptyPanels.length > 0 && (
                                    <span className="text-amber-600 font-semibold italic text-[11px]">
                                        No active selections yet
                                    </span>
                                )}
                                {equationParts.map(({ key, count, def }, i) => (
                                    <React.Fragment key={key}>
                                        {i > 0 && <span className="text-slate-300 text-sm font-bold">×</span>}
                                        <span className="bg-white border border-slate-200 shadow-sm rounded-lg px-2.5 py-1 whitespace-nowrap">
                                            {def?.label ?? key}
                                            <span className="text-indigo-600 ml-1.5 font-black">{count}</span>
                                        </span>
                                    </React.Fragment>
                                ))}
                                {previewCount > 0 && (
                                    <>
                                        <span className="text-slate-300 text-sm font-bold">=</span>
                                        <CountBadge count={previewCount} willWarn={willWarn} willExplode={willExplode} />
                                    </>
                                )}

                                {/* ── Empty panel warnings ─────────────────────────────────────────
                                     Shown for each attribute panel with 0 available values.
                                     Tells user exactly which dimension is non-functional and why. */}
                                {hasEmptyPanels && (
                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                        {emptyPanels.map(p => (
                                            <span
                                                key={p.attributeMasterId}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                                                           bg-amber-50 border border-amber-200
                                                           text-amber-700 text-[10px] font-bold whitespace-nowrap"
                                                title={`"${p.attributeName}" has no values — add values in Attribute Master first`}
                                            >
                                                <ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />
                                                {p.attributeName}: no values
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <button
                                    onClick={reset}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500
                                               border border-slate-200 rounded-xl hover:bg-white hover:text-red-500
                                               hover:border-red-200 transition-colors"
                                >
                                    <ArrowPathIcon className="w-3.5 h-3.5" />
                                    Reset
                                </button>

                                <button
                                    onClick={handleGenerateClick}
                                    disabled={previewCount === 0 || willExplode || generating}
                                    title={
                                        previewCount === 0 && hasEmptyPanels
                                            ? `${emptyPanels.map(p => `"${p.attributeName}"`).join(', ')} ${emptyPanels.length === 1 ? 'has' : 'have'} no values — add values in Attribute Master first`
                                            : previewCount === 0
                                                ? 'Select at least one value to generate combinations'
                                                : willExplode
                                                    ? `Too many combinations (${previewCount.toLocaleString()}). Reduce selections.`
                                                    : `Generate ${previewCount} variant combination${previewCount !== 1 ? 's' : ''}`
                                    }
                                    className={`
                                        flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm
                                        shadow-sm transition-all active:scale-95
                                        ${previewCount === 0 || willExplode
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200'
                                        }
                                    `}
                                    id="dimension-generate-btn"
                                >
                                    {generating
                                        ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Generating...</>
                                        : <><BoltIcon className="w-4 h-4" /> Generate {previewCount > 0 ? `${previewCount} Combo${previewCount > 1 ? 's' : ''}` : 'Preview'}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                SECTION C — VARIANT GRID
            ════════════════════════════════════════════════════════════════ */}
            {visibleRows.length > 0 && (
                <div
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                    style={{ height: '560px' }}
                >
                    {/* Grid header */}
                    <div className="flex-shrink-0 px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <CubeIcon className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-black text-slate-900 text-sm">Variant Grid</h3>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                {visibleRows.length} rows
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Grid search */}
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search combinations..."
                                    value={gridSearch}
                                    onChange={e => setGridSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white w-52"
                                />
                            </div>

                            {/* Clear grid */}
                            <button
                                onClick={() => setDeletedKeys(new Set(generatedRows.map(r => r.combinationKey)))}
                                className="text-xs font-bold text-slate-400 hover:text-red-500 px-3 py-2 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                            >
                                Clear Grid
                            </button>
                        </div>
                    </div>

                    {/* Scrollable grid */}
                    <VariantGrid
                        rows={visibleRows}
                        dimensionOrder={dimensionOrder}
                        updateRow={updateRow}
                        onDelete={handleDeleteRow}
                        search={gridSearch}
                    />
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                EXPLOSION MODAL
            ════════════════════════════════════════════════════════════════ */}
            {showExplosionModal && (
                <ExplosionModal
                    count={previewCount}
                    limit={MAX_COMBINATIONS}
                    onCancel={() => setShowExplosionModal(false)}
                    onConfirm={_doGenerate}
                />
            )}
        </div>
    );
}
