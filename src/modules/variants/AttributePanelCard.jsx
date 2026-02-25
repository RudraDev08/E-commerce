/**
 * AttributePanelCard — Single dynamic attribute dimension panel
 * ──────────────────────────────────────────────────────────────
 * Mirrors DimensionPanel (Color/Size) in layout, typography and spacing.
 * Represents one attribute master (e.g. Storage, RAM, Processor) in Section B.
 *
 * Props:
 *   panelState         {AttributePanelState}  The attribute panel state object
 *   isSelected         {Function}  (dimKey, valueId) => boolean
 *   toggleValue        {Function}  (dimKey, valueId) => void
 *   selectAll          {Function}  (dimKey) => void
 *   deselectAll        {Function}  (dimKey) => void
 *   selectedCount      {number}    How many values currently selected
 *   onRemove           {Function}  () => void — removes this panel entirely
 *   accent             {string}    accent color key
 */

import React, { useState, memo } from 'react';
import {
    TagIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

// ── Accent colour map (kept in sync with DimensionWorkspace accentCycle) ─────
const ACCENT_MAP = {
    cyan: { badge: 'bg-cyan-100 text-cyan-700', check: 'border-cyan-500 bg-cyan-500', ring: 'ring-cyan-200', sel: 'bg-cyan-50 border-cyan-200', label: 'text-cyan-700' },
    emerald: { badge: 'bg-emerald-100 text-emerald-700', check: 'border-emerald-500 bg-emerald-500', ring: 'ring-emerald-200', sel: 'bg-emerald-50 border-emerald-200', label: 'text-emerald-700' },
    rose: { badge: 'bg-rose-100 text-rose-700', check: 'border-rose-500 bg-rose-500', ring: 'ring-rose-200', sel: 'bg-rose-50 border-rose-200', label: 'text-rose-700' },
    amber: { badge: 'bg-amber-100 text-amber-700', check: 'border-amber-500 bg-amber-500', ring: 'ring-amber-200', sel: 'bg-amber-50 border-amber-200', label: 'text-amber-700' },
    violet: { badge: 'bg-violet-100 text-violet-700', check: 'border-violet-500 bg-violet-500', ring: 'ring-violet-200', sel: 'bg-violet-50 border-violet-200', label: 'text-violet-700' },
    indigo: { badge: 'bg-indigo-100 text-indigo-700', check: 'border-indigo-500 bg-indigo-500', ring: 'ring-indigo-200', sel: 'bg-indigo-50 border-indigo-200', label: 'text-indigo-700' },
    sky: { badge: 'bg-sky-100 text-sky-700', check: 'border-sky-500 bg-sky-500', ring: 'ring-sky-200', sel: 'bg-sky-50 border-sky-200', label: 'text-sky-700' },
    pink: { badge: 'bg-pink-100 text-pink-700', check: 'border-pink-500 bg-pink-500', ring: 'ring-pink-200', sel: 'bg-pink-50 border-pink-200', label: 'text-pink-700' },
    teal: { badge: 'bg-teal-100 text-teal-700', check: 'border-teal-500 bg-teal-500', ring: 'ring-teal-200', sel: 'bg-teal-50 border-teal-200', label: 'text-teal-700' },
};

const AttributePanelCard = memo(function AttributePanelCard({
    panelState,
    isSelected,
    toggleValue,
    selectAll,
    deselectAll,
    selectedCount,
    onRemove,
    accent = 'cyan',
}) {
    const [open, setOpen] = useState(true);
    const [search, setSearch] = useState('');

    const {
        attributeMasterId,
        attributeName,
        availableValues = [],
    } = panelState;

    // Alias: use attributeMasterId as dimensionKey for the engine
    const dimKey = `attr:${attributeMasterId}`;

    const a = ACCENT_MAP[accent] ?? ACCENT_MAP.cyan;

    const filtered = availableValues.filter(v => {
        if (!search) return true;
        return (v.displayName || v.value || '').toLowerCase().includes(search.toLowerCase());
    });

    const allSelected = selectedCount === availableValues.length && availableValues.length > 0;

    const empty = availableValues.length === 0;

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm
                       hover:shadow-md transition-shadow duration-200"
            role="region"
            aria-label={`${attributeName} dimension panel`}
        >
            {/* ── Card Header ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-4">
                {/* Collapsible toggle area (most of the header) */}
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                    aria-expanded={open}
                >
                    {/* Icon badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.badge}`}>
                        <TagIcon className="w-4 h-4" />
                    </div>

                    {/* Title block */}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-none truncate">
                            {attributeName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            {empty
                                ? 'No values configured'
                                : `${availableValues.length} value${availableValues.length !== 1 ? 's' : ''} available`
                            }
                        </p>
                    </div>

                    {/* Selected badge */}
                    {selectedCount > 0 && (
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0 ${a.badge}`}>
                            {selectedCount} selected
                        </span>
                    )}

                    {/* Chevron */}
                    {open
                        ? <ChevronUpIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        : <ChevronDownIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    }
                </button>

                {/* Remove button — always visible, to the right of chevron */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                               text-slate-300 hover:text-red-500 hover:bg-red-50
                               transition-colors duration-150 ml-1"
                    title={`Remove ${attributeName} dimension`}
                    aria-label={`Remove ${attributeName}`}
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>

            {/* ── Card Body ────────────────────────────────────────────────── */}
            {open && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
                    {empty ? (
                        /* Empty values state */
                        <div className="py-6 flex flex-col items-center gap-2 text-slate-400">
                            <TagIcon className="w-7 h-7 opacity-30" />
                            <p className="text-xs font-bold text-center">
                                No values found for <span className="text-slate-600">{attributeName}</span>.
                            </p>
                            <p className="text-[11px] text-center">
                                Add values in the Attribute Master panel first.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Search + "All" button (shown when > 5 values) */}
                            {availableValues.length > 5 && (
                                <div className="pt-3 flex gap-2">
                                    <div className="relative flex-1">
                                        <MagnifyingGlassIcon
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                                                       text-slate-400 pointer-events-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search values..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg
                                                       focus:outline-none focus:ring-2 focus:ring-indigo-300
                                                       bg-slate-50 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={() => allSelected ? deselectAll(dimKey) : selectAll(dimKey)}
                                        className="text-xs font-bold text-slate-500 hover:text-indigo-600
                                                   px-3 py-2 border border-slate-200 rounded-lg
                                                   hover:border-indigo-300 transition-colors whitespace-nowrap"
                                        title={allSelected ? 'Deselect all' : 'Select all'}
                                    >
                                        {allSelected ? 'None' : 'All'}
                                    </button>
                                </div>
                            )}

                            {/* Compact "All" button for ≤ 5 values */}
                            {availableValues.length <= 5 && availableValues.length > 0 && (
                                <div className="pt-3 flex justify-end">
                                    <button
                                        onClick={() => allSelected ? deselectAll(dimKey) : selectAll(dimKey)}
                                        className="text-xs font-bold text-slate-500 hover:text-indigo-600
                                                   px-3 py-1.5 border border-slate-200 rounded-lg
                                                   hover:border-indigo-300 transition-colors whitespace-nowrap"
                                    >
                                        {allSelected ? 'None' : 'All'}
                                    </button>
                                </div>
                            )}

                            {/* Values list */}
                            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                                {filtered.length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-4 italic">
                                        No values match &ldquo;{search}&rdquo;
                                    </p>
                                )}

                                {filtered.map(val => {
                                    const sel = isSelected(dimKey, val.id);
                                    return (
                                        <label
                                            key={val.id}
                                            className={`
                                                flex items-center gap-3 p-2.5 rounded-xl cursor-pointer
                                                transition-all group border
                                                ${sel
                                                    ? `${a.sel}`
                                                    : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                                                }
                                            `}
                                        >
                                            {/* Custom checkbox */}
                                            <span
                                                onClick={() => toggleValue(dimKey, val.id)}
                                                className={`
                                                    w-4 h-4 rounded flex items-center justify-center
                                                    border-2 flex-shrink-0 transition-all
                                                    ${sel
                                                        ? `${a.check}`
                                                        : 'border-slate-300 group-hover:border-slate-400'
                                                    }
                                                `}
                                            >
                                                {sel && (
                                                    <CheckIcon className="w-3 h-3 text-white stroke-[3]" />
                                                )}
                                            </span>

                                            {/* Label */}
                                            <span
                                                onClick={() => toggleValue(dimKey, val.id)}
                                                className={`flex-1 text-sm font-semibold leading-none ${sel ? a.label : 'text-slate-700'}`}
                                            >
                                                {val.displayName || val.value}
                                            </span>

                                            {/* Sub-label (e.g. raw value / slug) */}
                                            {val.value && val.displayName && val.value !== val.displayName && (
                                                <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                                                    {val.value}
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

export default AttributePanelCard;
