import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon,
    ArrowsUpDownIcon, ServerIcon, TagIcon, ClipboardDocumentIcon,
    ChevronLeftIcon, ChevronRightIcon, LockClosedIcon, XMarkIcon,
    ArrowPathIcon, ShoppingBagIcon, CpuChipIcon, TvIcon, ScaleIcon,
    FunnelIcon, LinkIcon, ChevronDownIcon, CheckIcon, ArchiveBoxIcon,
    ChevronRightIcon as ChevronR, GlobeAltIcon, UsersIcon,
} from '@heroicons/react/24/outline';
import SearchableDropdown from '../../components/ui/SearchableDropdown';
import { sizeAPI } from '../../Api/api';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL STYLES — shimmer animation injected once at module level
   ═══════════════════════════════════════════════════════════════════════════ */
const SHIMMER_STYLE = `
@keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
.skeleton-shimmer {
    background: linear-gradient(90deg, #E2E8F0 0%, #F1F5F9 50%, #E2E8F0 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
}
`;
if (typeof document !== 'undefined') {
    const styleId = 'size-master-shimmer';
    if (!document.getElementById(styleId)) {
        const s = document.createElement('style'); s.id = styleId; s.textContent = SHIMMER_STYLE;
        document.head.appendChild(s);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */
const CATEGORIES = ['CLOTHING', 'FOOTWEAR', 'ACCESSORIES', 'STORAGE', 'RAM', 'DISPLAY', 'DIMENSION'];
const GENDERS = ['UNISEX', 'MEN', 'WOMEN', 'BOYS', 'GIRLS', 'KIDS', 'INFANT'];
const REGIONS = ['GLOBAL', 'US', 'UK', 'EU', 'JP', 'AU', 'CN'];
const LIFECYCLE_STATES = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'];
const VALID_TRANSITIONS = {
    DRAFT: ['ACTIVE', 'ARCHIVED'],
    ACTIVE: ['DEPRECATED', 'ARCHIVED', 'DRAFT'],
    DEPRECATED: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
    ARCHIVED: ['DRAFT', 'ACTIVE'],
};
const ENV = import.meta.env.VITE_ENV;
const DEFAULT_FORM = {
    displayName: '', value: '', category: 'CLOTHING',
    gender: 'UNISEX', primaryRegion: 'GLOBAL',
    lifecycleState: 'DRAFT', normalizedRank: 0,
};

/* ═══════════════════════════════════════════════════════════════════════════
   STYLE MAPS
   ═══════════════════════════════════════════════════════════════════════════ */
// ── Category icon + colour map ──────────────────────────────────────────────
const CAT_CFG = {
    CLOTHING: { icon: TagIcon, bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', label: 'Clothing' },
    FOOTWEAR: { icon: ShoppingBagIcon, bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74', label: 'Footwear' },
    // Using clothing style as fallback for others but can be customized further
    ACCESSORIES: { icon: TagIcon, bg: '#FDF2F8', text: '#9D174D', border: '#FBCFE8', label: 'Accessories' },
    STORAGE: { icon: ServerIcon, bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'Storage' },
    RAM: { icon: CpuChipIcon, bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC', label: 'RAM' },
    DISPLAY: { icon: TvIcon, bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', label: 'Display' },
    DIMENSION: { icon: ScaleIcon, bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4', label: 'Dimension' },
};
const getCfg = c => CAT_CFG[(c || '').toUpperCase()] || { icon: TagIcon, bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB', label: 'Generic' };

// ── Lifecycle colour map ────────────────────────────────────────────────────
const LC_CFG = {
    ACTIVE: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
    DRAFT: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
    DEPRECATED: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
    ARCHIVED: { bg: '#E5E7EB', text: '#374151', dot: '#9CA3AF' },
};
const getLc = s => LC_CFG[(s || '').toUpperCase()] || LC_CFG.ARCHIVED;

/* ═══════════════════════════════════════════════════════════════════════════
   MICRO COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */
const TypeBadge = ({ category }) => {
    const c = getCfg(category);
    const I = c.icon;
    return (
        <span style={{ background: c.bg, color: c.text, borderColor: c.border }}
            className="inline-flex items-center gap-1.5 px-[10px] py-[4px] rounded-full text-[11px] font-semibold uppercase border">
            <I className="w-3 h-3 flex-shrink-0" />{c.label}
        </span>
    );
};

const LcPill = ({ state }) => {
    const s = getLc(state);
    return (
        <span style={{ background: s.bg, color: s.text }}
            className="inline-flex items-center gap-[7px] h-7 px-[14px] rounded-full text-[12px] font-semibold uppercase tracking-wide">
            <span style={{ background: s.dot }} className="w-[7px] h-[7px] rounded-full flex-shrink-0" />
            {state || '—'}
        </span>
    );
};

const LockBadge = () => (
    <span title="Locked by governance policy"
        className="inline-flex items-center gap-1 px-[8px] py-[3px] rounded-full text-[10px] font-bold uppercase tracking-wide"
        style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
        <LockClosedIcon className="w-3 h-3" />Locked
    </span>
);

/* ═══════════════════════════════════════════════════════════════════════════
   LIFECYCLE POPOVER
   ═══════════════════════════════════════════════════════════════════════════ */
const LcPopover = ({ size, onChange, loading }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const allowed = VALID_TRANSITIONS[size.lifecycleState] || [];

    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    if (!allowed.length || size.isLocked) return <LcPill state={size.lifecycleState} />;

    return (
        <div ref={ref} className="relative inline-block">
            <button
                type="button" disabled={loading}
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox" aria-expanded={open}
                aria-label="Change lifecycle state"
                className="inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 rounded-full transition-all"
                style={{ '--tw-ring-color': '#4F46E540' }}
            >
                <LcPill state={size.lifecycleState} />
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} style={{ color: '#94A3B8' }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        role="listbox" aria-label="Select lifecycle transition"
                        className="absolute top-full left-0 mt-2 z-50 min-w-[210px] bg-white rounded-xl overflow-hidden"
                        style={{ border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,0.10)' }}
                    >
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                            <p className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: '#94A3B8' }}>Transition to</p>
                        </div>
                        <ul className="py-2">
                            <li className="flex items-center justify-between px-4 py-2.5 cursor-default"
                                style={{ background: '#FAFBFF' }}>
                                <span className="flex items-center gap-2 text-[13px]" style={{ color: '#94A3B8' }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: getLc(size.lifecycleState).dot, display: 'inline-block' }} />
                                    {size.lifecycleState}
                                </span>
                                <CheckIcon className="w-3.5 h-3.5" style={{ color: '#CBD5E1' }} />
                            </li>
                            {allowed.map(st => {
                                const sc = getLc(st);
                                return (
                                    <li key={st} role="option" aria-selected={false}
                                        onClick={() => { onChange(size, st); setOpen(false); }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors duration-100"
                                        style={{ color: '#0F172A' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#4338CA'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#0F172A'; }}
                                    >
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, flexShrink: 0, display: 'inline-block' }} />
                                        {st}
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CHECKBOX
   ═══════════════════════════════════════════════════════════════════════════ */
const CB = ({ checked, indeterminate, onChange, label, disabled }) => {
    const r = useRef(null);
    useEffect(() => { if (r.current) r.current.indeterminate = !!indeterminate; }, [indeterminate]);
    return (
        <input
            ref={r} type="checkbox" checked={checked} onChange={onChange} aria-label={label} disabled={disabled}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600 focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-40 disabled:cursor-not-allowed"
        />
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETON — uses shimmer class from global style injection
   ═══════════════════════════════════════════════════════════════════════════ */
const SkeletonRow = () => (
    <tr className="animate-pulse" style={{ borderBottom: '1px solid #EDF2F7', height: 64 }}>
        <td className="pl-5 pr-3"><div className="skeleton-shimmer h-4 w-4 rounded" /></td>
        <td className="pr-2 w-8"><div className="skeleton-shimmer h-4 w-4 rounded mx-auto" /></td>
        <td className="px-5">
            <div className="flex items-center gap-3">
                <div className="skeleton-shimmer w-9 h-9 rounded-[10px] flex-shrink-0" />
                <div className="space-y-2">
                    <div className="skeleton-shimmer h-[14px] rounded w-36" />
                    <div className="skeleton-shimmer h-[11px] rounded-full w-20" />
                </div>
            </div>
        </td>
        <td className="px-5"><div className="skeleton-shimmer h-7 rounded-lg w-16" /></td>
        <td className="px-5"><div className="skeleton-shimmer h-[14px] rounded w-12" /></td>
        <td className="px-5"><div className="skeleton-shimmer h-[14px] rounded w-16" /></td>
        <td className="px-5 text-right"><div className="skeleton-shimmer h-[14px] rounded w-8 ml-auto" /></td>
        <td className="px-5"><div className="skeleton-shimmer h-7 rounded-full w-24" /></td>
        <td className="px-5"><div className="skeleton-shimmer h-[14px] rounded w-14" /></td>
        <td className="px-5"><div className="skeleton-shimmer h-8 rounded-[10px] w-16 ml-auto" /></td>
    </tr>
);

/* ═══════════════════════════════════════════════════════════════════════════
   GOVERNANCE CELL — usage count with hover tooltip
   ═══════════════════════════════════════════════════════════════════════════ */
const GovernanceCell = ({ size }) => {
    const [tip, setTip] = useState(false);
    const ref = useRef(null);
    const count = size.usageCount ?? 0;
    const hasUsage = count > 0;

    return (
        <div className="relative inline-block" ref={ref}
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
        >
            <div className="flex flex-col gap-[3px] cursor-default">
                <span className="tabular-nums"
                    style={{
                        fontSize: 13,
                        color: hasUsage ? '#6366F1' : '#9CA3AF',
                        fontWeight: hasUsage ? 600 : 400,
                    }}
                >
                    {hasUsage ? `↑${count} ${count === 1 ? 'use' : 'uses'}` : 'Unused'}
                </span>
                {size.replacedBy && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold"
                        style={{ color: '#B45309' }}>
                        <LinkIcon className="w-3 h-3" />Replaced
                    </span>
                )}
            </div>

            {/* Tooltip */}
            <AnimatePresence>
                {tip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute bottom-full left-0 mb-2 z-50 w-[220px] rounded-xl"
                        style={{ background: '#0F172A', padding: '12px 14px', boxShadow: '0 8px 24px rgba(15,23,42,0.24)' }}
                    >
                        <p className="text-[12px] font-semibold" style={{ color: '#F8FAFC' }}>
                            {hasUsage ? `Used by ${count} product variant${count !== 1 ? 's' : ''}` : 'Not referenced by any variant'}
                        </p>
                        {hasUsage && (
                            <p className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>Cannot delete until unused</p>
                        )}
                        {!hasUsage && size.lifecycleState !== 'ARCHIVED' && (
                            <p className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>Archive first, then delete</p>
                        )}
                        {!hasUsage && size.lifecycleState === 'ARCHIVED' && (
                            <p className="text-[11px] mt-1" style={{ color: '#4ADE80' }}>Safe to permanently delete</p>
                        )}
                        {/* Caret */}
                        <div style={{ position: 'absolute', bottom: -5, left: 16, width: 10, height: 10, background: '#0F172A', transform: 'rotate(45deg)' }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE RANK EDITOR — click rank to edit inline, Enter saves, Esc cancels
   ═══════════════════════════════════════════════════════════════════════════ */
const InlineRankCell = ({ size, dirty, onSaveRank }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(size.normalizedRank ?? 0);
    const inputRef = useRef(null);

    useEffect(() => { setVal(size.normalizedRank ?? 0); }, [size.normalizedRank]);
    useEffect(() => { if (editing && inputRef.current) inputRef.current.select(); }, [editing]);

    const commit = () => {
        const next = parseInt(val, 10);
        if (!isNaN(next) && next !== size.normalizedRank) onSaveRank(size._id, next);
        setEditing(false);
    };
    const cancel = () => { setVal(size.normalizedRank ?? 0); setEditing(false); };

    if (editing) {
        return (
            <td className="px-5 text-right">
                <input
                    ref={inputRef}
                    type="number" min={0} value={val}
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
                    onBlur={commit}
                    className="w-16 text-right font-mono tabular-nums rounded-[6px] px-2 py-1 text-[13px] focus:outline-none"
                    style={{ border: '1px solid #4F46E5', color: '#4F46E5', background: '#EEF2FF', fontWeight: 700 }}
                />
            </td>
        );
    }

    return (
        <td className="px-5 text-right">
            <button
                onClick={() => setEditing(true)}
                title="Click to edit rank"
                className="font-mono tabular-nums rounded-[6px] px-2 py-1 transition-colors"
                style={{
                    fontSize: 13,
                    color: dirty ? '#D97706' : '#94A3B8',
                    fontWeight: dirty ? 700 : 400,
                    background: 'transparent',
                    border: '1px solid transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = dirty ? '#D97706' : '#94A3B8'; }}
            >
                {size.normalizedRank ?? '—'}
            </button>
        </td>
    );
};


/* ═══════════════════════════════════════════════════════════════════════════
   BULK ACTION BAR
   ═══════════════════════════════════════════════════════════════════════════ */
const BulkDropdown = ({ options, onSelect, loading }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => !loading && setOpen(!open)}
                disabled={loading}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50 active:scale-95"
            >
                <span>Change State…</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''} text-white/70`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute bottom-full left-0 mb-2 z-50 min-w-[170px] bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden py-1.5"
                    >
                        <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target State</div>
                        {options.map(opt => {
                            const lc = getLc(opt);
                            return (
                                <button
                                    key={opt}
                                    onClick={() => { onSelect(opt); setOpen(false); }}
                                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                                >
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: lc.dot }} />
                                    <span className="text-[13px] font-medium text-slate-700">{opt}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const BulkBar = ({ count, onLifecycle, onArchive, onDelete, onClear, loading }) => (
    <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 rounded-full shadow-2xl z-50 ring-1 ring-white/20"
        style={{
            background: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)',
        }}
    >
        <div className="flex items-center gap-3">
            <span className="text-sm font-bold tabular-nums text-white pl-1">{count} selected</span>
            <div className="h-5 w-px bg-white/20" />
        </div>

        <div className="flex items-center gap-2">
            <BulkDropdown
                options={LIFECYCLE_STATES.filter(s => s !== 'ARCHIVED')}
                onSelect={onLifecycle}
                loading={loading}
            />
            <button onClick={onArchive} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50">
                <ArchiveBoxIcon className="w-3.5 h-3.5" />Archive
            </button>
            <button onClick={onDelete} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50">
                <TrashIcon className="w-3.5 h-3.5" />Delete
            </button>
        </div>
        <button onClick={onClear} className="ml-1 p-1 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors">
            <XMarkIcon className="w-5 h-5" />
        </button>
    </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   SIZE FORM MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
const SizeFormModal = ({ mode, initialData, onClose, onSubmit, saving }) => {
    const [form, setForm] = useState(initialData || DEFAULT_FORM);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const iCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all";
    const sCls = `${iCls} appearance-none cursor-pointer`;
    const lCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{mode === 'create' ? 'Register New Size' : 'Edit Size Record'}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">SizeMaster · Enterprise Schema</p>
                    </div>
                    <button onClick={onClose} disabled={saving} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-40">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4 max-h-[76vh] overflow-y-auto">
                    <div>
                        <label className={lCls}>Display Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="e.g. Extra Large, 128 GB" required autoFocus className={iCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={lCls}>Value / Code <span className="text-red-500">*</span></label>
                            <input type="text" value={form.value} onChange={e => set('value', e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, ''))} placeholder="XL, 128GB" required className={`${iCls} font-mono`} />
                        </div>
                        <div>
                            <label className={lCls}>Normalized Rank</label>
                            <input type="number" min={0} value={form.normalizedRank} onChange={e => set('normalizedRank', parseInt(e.target.value) || 0)} className={iCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[['Category', 'category', CATEGORIES], ['Gender', 'gender', GENDERS]].map(([l, k, opts]) => (
                            <div key={k}>
                                <label className={lCls}>{l}</label>
                                <div className="relative">
                                    <select value={form[k]} onChange={e => set(k, e.target.value)} className={sCls}>
                                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div key="primaryRegion">
                            <label className={lCls}>Primary Region</label>
                            <div className="relative">
                                <select value={form.primaryRegion} onChange={e => set('primaryRegion', e.target.value)} className={sCls}>
                                    {REGIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div key="lifecycleState" className={mode === 'edit' ? 'opacity-60 grayscale-[0.5]' : ''}>
                            <label className={lCls}>Lifecycle State {mode === 'edit' && ' (Read Only)'}</label>
                            <div className="relative">
                                <select
                                    value={form.lifecycleState}
                                    onChange={e => set('lifecycleState', e.target.value)}
                                    className={`${sCls} ${mode === 'edit' ? 'cursor-not-allowed bg-slate-100' : ''}`}
                                    disabled={mode === 'edit'}
                                >
                                    {LIFECYCLE_STATES.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button type="button" onClick={onClose} disabled={saving} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-600/20 disabled:opacity-60">
                            {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                            {saving ? 'Saving…' : mode === 'create' ? 'Create Size' : 'Update Size'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MODULAR COMPONENTS 
   ═══════════════════════════════════════════════════════════════════════════ */

const PageLayout = ({ children }) => (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans text-slate-900">
        {children}
    </div>
);

const PageHeader = ({ title, breadcrumbs, onSearch, searchVal, onNew, savingRank, saveRank, rankDirty }) => (
    <div className="px-6 py-6 flex-shrink-0 bg-white border-b border-gray-200">
        <nav className="flex items-center gap-2 text-sm font-medium mb-3">
            {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-2">
                    {i > 0 && <ChevronR className="w-3.5 h-3.5 text-gray-300" />}
                    <span className={`${i === breadcrumbs.length - 1 ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"}`}>{b}</span>
                </span>
            ))}
        </nav>

        <div className="flex items-end justify-between">
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{title}</h1>

            <div className="flex items-center gap-4">
                {rankDirty > 0 && (
                    <button onClick={saveRank} disabled={savingRank}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-semibold transition-all shadow-sm">
                        {savingRank ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                        Save Order ({rankDirty})
                    </button>
                )}

                <div className="relative group">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        value={searchVal}
                        onChange={onSearch}
                        placeholder="Search... (/)"
                        className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-sm transition-all w-64 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none placeholder:text-gray-400 font-medium"
                    />
                </div>

                <button
                    onClick={onNew}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold rounded-[10px] text-sm transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)]"
                >
                    <PlusIcon className="w-4 h-4 stroke-[2.5px]" />
                    New Size
                </button>
            </div>
        </div>
    </div>
);

const FilterSection = ({ filters, activeCount, onReset, sortLabel, onCycleSort }) => (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
                <FunnelIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-[0.06em] text-gray-400">Filter</span>
                {activeCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-indigo-500 text-white tabular-nums">
                        {activeCount}
                    </span>
                )}
            </div>
            {filters}
        </div>

        <div className="flex items-center gap-4">
            <button onClick={onCycleSort}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />
                {sortLabel}
            </button>
            {activeCount > 0 && (
                <button onClick={onReset} className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                    Reset All
                </button>
            )}
        </div>
    </div>
);

const DataTable = ({ header, rows, emptyState, loading, footer }) => (
    <div className="flex-1 px-6 py-6 min-h-0">
        <div className="h-full flex flex-col bg-white rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="flex-1 overflow-auto relative">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F9FAFB] border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>{header}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            Array.from({ length: 9 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : rows}
                        {!loading && rows.length === 0 && emptyState}
                    </tbody>
                </table>
            </div>
            {footer}
        </div>
    </div>
);

const PaginationFooter = ({ from, to, total, pg, hasNext, onPrev, onNext, slot }) => (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Showing <span className="font-semibold text-gray-900">{from}–{to}</span> of <span className="font-semibold text-gray-900">{total}</span></span>
            {slot}
        </div>

        <div className="flex items-center gap-2">
            <button onClick={onPrev} disabled={pg <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <div className={`w-8 h-8 flex items-center justify-center rounded-[10px] font-semibold text-sm bg-indigo-500 text-white shadow-sm`}>
                {pg}
            </div>
            <button onClick={onNext} disabled={!hasNext}
                className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRightIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const SizeManagement = () => {

    const [sizes, setSizes] = useState([]);
    const [ordered, setOrdered] = useState([]);
    const [loading, setLoading] = useState(true); // true on mount to show skeleton immediately
    const isFirstLoad = useRef(true);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    const [pg, setPg] = useState(1);
    const [total, setTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const [cursorStack, setCursorStack] = useState([]);
    const [hasNext, setHasNext] = useState(false);
    const LIMIT = 10;

    const [search, setSearch] = useState('');
    const [dSearch, setDSearch] = useState('');
    const [fState, setFState] = useState('');
    const [fCat, setFCat] = useState('');
    const [fGender, setFGender] = useState('');
    const [fRegion, setFRegion] = useState('');
    const [fLocked, setFLocked] = useState('');
    const [sortBy, setSortBy] = useState('normalizedRank');

    const [selected, setSelected] = useState(new Set());

    const [dragIdx, setDragIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);
    const [rankDirty, setRankDirty] = useState(new Set());
    const [savingRank, setSavingRank] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editTarget, setEditTarget] = useState(null);

    const abortRef = useRef(null);
    const searchRef = useRef(null);  // for '/' keyboard shortcut
    const activeFilters = [fState, fCat, fGender, fRegion, fLocked, dSearch].filter(Boolean).length;

    // '/' global shortcut — focus search input (no modal, no conflict with typing)
    useEffect(() => {
        const handler = (e) => {
            if (e.key !== '/') return;
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            e.preventDefault();
            searchRef.current?.focus();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => { setDSearch(search); setPg(1); setCursorStack([]); setNextCursor(null); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { setOrdered(sizes); setRankDirty(new Set()); }, [sizes]);

    /* ── Load ───────────────────────────────────────────────────────────────── */
    // Fix #11: pg removed from useCallback deps.
    // load() always receives the target page as an explicit arg (page param).
    // This prevents the effect from double-firing when pg state changes.
    const load = useCallback(async (cursor = null, page = 1, preserveSelection = false) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);

        try {
            const p = { limit: LIMIT, sort: sortBy };
            if (cursor) p.cursor = cursor;
            else p.page = page;

            if (fState) p.lifecycleState = fState;
            if (fCat) p.category = fCat;
            if (fGender) p.gender = fGender;
            if (fRegion) p.region = fRegion;
            if (fLocked) p.isLocked = fLocked === 'locked';
            if (dSearch) p.search = dSearch;

            const res = await sizeAPI.getAll(p);
            const { data, pagination, pageInfo, nextCursor: nc } = res.data;

            setSizes(data || []);
            setTotal(pagination?.total ?? pageInfo?.total ?? 0);

            const nc2 = nc || pageInfo?.nextCursor || null;
            setNextCursor(nc2);
            setHasNext(!!nc2);

            // Only clear selection if not explicitly preserved
            if (!preserveSelection) {
                setSelected(new Set());
            }

        } catch (err) {
            if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                toast.error(err.response?.data?.message || 'Load failed');
            }
        } finally {
            setLoading(false);
        }
    }, [fState, fCat, fGender, fRegion, fLocked, dSearch, sortBy]);

    // When filters/search/sort change, reset to page 1
    useEffect(() => { load(null, 1); }, [load]);

    const gotoNext = async () => {
        if (!hasNext || loading) return;

        const newPage = pg + 1;
        const newStack = [...cursorStack, nextCursor];

        setCursorStack(newStack);
        setPg(newPage);

        await load(nextCursor, newPage);
    };

    const gotoPrev = async () => {
        if (pg <= 1 || loading) return;

        const newStack = [...cursorStack];
        newStack.pop();

        const prevCursor = newStack[newStack.length - 1] || null;
        const newPage = pg - 1;

        setCursorStack(newStack);
        setPg(newPage);

        await load(prevCursor, newPage);
    };
    const clearFilters = () => {
        setSearch('');
        setFState(''); setFCat(''); setFGender(''); setFRegion(''); setFLocked('');
        setPg(1); setCursorStack([]); setNextCursor(null);
    };

    /* ── CRUD ───────────────────────────────────────────────────────────────── */
    const buildPayload = (f, mode = 'create') => {
        const p = {
            displayName: f.displayName.trim(),
            value: f.value.trim().toUpperCase(),
            category: f.category,
            gender: f.gender,
            primaryRegion: f.primaryRegion,
            normalizedRank: parseInt(f.normalizedRank) || 0
        };

        // lifecycleState only allowed on creation; updates must use /toggle-status
        if (mode === 'create') {
            p.lifecycleState = f.lifecycleState;
        }

        if (!p.displayName) throw new Error('Display Name required');
        if (!p.value) throw new Error('Value / Code required');
        return p;
    };

    const handleSubmit = async form => {
        setSaving(true);
        try {
            const payload = buildPayload(form, modalMode);
            if (modalMode === 'create') {
                const res = await sizeAPI.create(payload);
                const newSize = res.data?.data || res.data;
                setSizes(p => [newSize, ...p]);
                setTotal(p => p + 1);
                toast.success('Size created');
            } else {
                const res = await sizeAPI.update(editTarget._id, payload);
                setSizes(p => p.map(s => s._id === editTarget._id ? { ...s, ...(res.data?.data || res.data) } : s));
                toast.success('Size updated');
            }
            setShowModal(false);
        } catch (err) {
            if (err.message?.includes('required')) { toast.error(err.message); return; }
            if (err.response?.status === 409) { toast.error(err.response?.data?.message || 'Duplicate entry'); return; }
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const handleLcChange = async (size, newState) => {
        if (!VALID_TRANSITIONS[size.lifecycleState]?.includes(newState)) {
            toast.error(`${size.lifecycleState} → ${newState} not permitted`);
            return;
        }
        const prevState = size.lifecycleState; // snapshot for rollback
        setUpdatingId(size._id);
        // Optimistic update
        setSizes(p => p.map(s => s._id === size._id ? { ...s, lifecycleState: newState } : s));
        try {
            await sizeAPI.toggleStatus(size._id, { targetState: newState });
            toast.success(`→ ${newState}`);
        } catch (err) {
            // Rollback on failure
            setSizes(p => p.map(s => s._id === size._id ? { ...s, lifecycleState: prevState } : s));
            toast.error(err.response?.data?.message || 'Lifecycle change failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = size => {
        if (size.isLocked) { toast.error('Cannot delete a locked size'); return; }

        const isArch = size.lifecycleState === 'ARCHIVED';

        if (!isArch) {
            // Non-archived: archive first instead of attempting hard delete
            toast(
                t => (
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium">
                            Archive &ldquo;{size.displayName}&rdquo; before it can be deleted?
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { toast.dismiss(t.id); handleLcChange(size, 'ARCHIVED'); }}
                                className="px-3 py-1 bg-amber-600 text-white rounded-md text-xs font-semibold hover:bg-amber-700 transition-colors"
                            >
                                Archive
                            </button>
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ),
                { duration: 7000 }
            );
            return;
        }

        // ARCHIVED — permanent delete allowed
        const performDelete = async () => {
            setDeletingId(size._id);
            setSizes(p => p.filter(s => s._id !== size._id));
            setTotal(p => Math.max(p - 1, 0));
            try {
                await sizeAPI.delete(size._id);
                toast.success('Size permanently deleted');
            } catch (err) {
                setSizes(p => [size, ...p]);
                setTotal(p => p + 1);
                toast.error(err.response?.data?.message || 'Delete failed');
            } finally {
                setDeletingId(null);
            }
        };

        toast(
            t => (
                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">
                        Permanently delete &ldquo;{size.displayName}&rdquo;?
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { toast.dismiss(t.id); performDelete(); }}
                            className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-semibold hover:bg-red-700 transition-colors"
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            { duration: 6000 }
        );
    };

    /* ── Bulk Operations ────────────────────────────────────────────────────── */

    // Safety: limits concurrent promises to avoid server overload
    const batchProcess = async (items, batchSize, fn) => {
        const results = { success: [], failed: [] };
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.all(batch.map(async (item) => {
                try {
                    await fn(item);
                    results.success.push(item);
                } catch (err) {
                    results.failed.push({ item, err });
                }
            }));
        }
        return results;
    };

    const allIds = ordered.map(s => s._id);
    const allLocked = ordered.filter(s => s.isLocked).map(s => s._id);
    const availableIds = allIds.filter(id => !allLocked.includes(id)); // Selectable only? No, UX usually allows selecting locked but actions disabled.

    const allChecked = allIds.length > 0 && allIds.every(id => selected.has(id));
    const someCk = allIds.some(id => selected.has(id)) && !allChecked;
    const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allIds)); // Selects visually all
    const toggleOne = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const bulkLifecycle = async (targetState) => {
        const selectedItems = sizes.filter(s => selected.has(s._id));

        const unlocked = selectedItems.filter(s => !s.isLocked);
        const locked = selectedItems.filter(s => s.isLocked);

        if (locked.length > 0) {
            toast.error(`Skipped ${locked.length} locked items`);
        }

        const valid = unlocked.filter(s =>
            VALID_TRANSITIONS[(s.lifecycleState || '').toUpperCase()]?.includes(targetState)
        );

        if (valid.length === 0) {
            toast.error(`No selected items can transition to ${targetState}`);
            return;
        }

        // Deep snapshot for rollback
        const snapshot = sizes.map(s => ({ ...s }));

        setBulkLoading(true);

        // Optimistic update
        setSizes(prev =>
            prev.map(s =>
                valid.find(v => v._id === s._id)
                    ? { ...s, lifecycleState: targetState }
                    : s
            )
        );

        const { success, failed } = await batchProcess(valid, 5, async (item) => {
            await sizeAPI.toggleStatus(item._id, { targetState });
        });

        if (failed.length > 0) {
            // Partial Rollback: only revert items that actually failed
            setSizes(prev => prev.map(s => {
                const fail = failed.find(f => f.item._id === s._id);
                return fail ? fail.item : s;
            }));
            setSelected(new Set(failed.map(f => f.item._id)));
            toast.error(`${failed.length} failed. ${success.length} updated.`);
        } else {
            toast.success(`Updated ${success.length} sizes`);
            setSelected(new Set());
        }

        setBulkLoading(false);
    };

    const bulkArchive = () => bulkLifecycle('ARCHIVED');

    const bulkDelete = () => {
        const targets = ordered.filter(s => selected.has(s._id));
        const locked = targets.filter(s => s.isLocked);
        // Fix: Case-insensitive classification
        const active = targets.filter(s => (s.lifecycleState || '').toUpperCase() !== 'ARCHIVED' && !s.isLocked);
        const deletable = targets.filter(s => (s.lifecycleState || '').toUpperCase() === 'ARCHIVED' && !s.isLocked);

        if (locked.length > 0) {
            toast.error(`Skipping ${locked.length} locked items.`);
        }
        if (active.length > 0) {
            toast.error(`Cannot delete ${active.length} active items. Archive them first.`);
        }
        if (deletable.length === 0) {
            if (active.length === 0 && locked.length === 0) toast.error("No items selected");
            return;
        }

        toast(
            t => (
                <div className="flex flex-col gap-3">
                    <div className="text-sm font-medium">
                        Permanently delete {deletable.length} archived items?
                        <div className="text-xs text-slate-500 font-normal mt-1">
                            This action cannot be undone.
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                performBulkDelete(deletable);
                            }}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-semibold hover:bg-red-700 transition-colors"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            ),
            { duration: 8000 }
        );
    };

    const performBulkDelete = async (targets) => {
        const snapshot = sizes.map(s => ({ ...s }));
        const prevTotal = total;
        const targetIds = new Set(targets.map(s => s._id));

        setBulkLoading(true);

        // Optimistic remove
        setSizes(prev => prev.filter(s => !targetIds.has(s._id)));
        setTotal(prev => Math.max(prev - targets.length, 0));

        const { success, failed } = await batchProcess(targets, 5, async (item) => {
            await sizeAPI.delete(item._id);
        });

        if (failed.length > 0) {
            // Partial Rollback: Restore only failed items and adjust total
            setSizes(prev => {
                const restored = failed.map(f => f.item);
                return [...prev, ...restored].sort((a, b) => a.normalizedRank - b.normalizedRank);
            });
            setTotal(prevTotal - success.length);
            setSelected(new Set(failed.map(f => f.item._id)));
            toast.error(`${failed.length} failed. ${success.length} deleted.`);
        } else {
            toast.success(`Deleted ${success.length} sizes`);
            setSelected(new Set());
        }

        setBulkLoading(false);
    };

    // Inline rank save — used by InlineRankCell
    const inlineSaveRank = async (id, newRank) => {
        const prev = [...ordered];
        setOrdered(arr => arr.map(s => s._id === id ? { ...s, normalizedRank: newRank } : s));
        setRankDirty(d => new Set([...d, id]));
        try {
            await sizeAPI.update(id, { normalizedRank: newRank });
            setSizes(arr => arr.map(s => s._id === id ? { ...s, normalizedRank: newRank } : s));
            setRankDirty(d => { const n = new Set(d); n.delete(id); return n; });
            toast.success('Rank updated');
        } catch {
            setOrdered(prev);
            setRankDirty(d => { const n = new Set(d); n.delete(id); return n; });
            toast.error('Failed to update rank');
        }
    };

    const onDragStart = i => setDragIdx(i);
    const onDragOver = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
    const onDrop = i => {
        if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
        const arr = [...ordered]; const [moved] = arr.splice(dragIdx, 1); arr.splice(i, 0, moved);
        setOrdered(arr);
        setRankDirty(new Set(arr.filter((s, idx) => s.normalizedRank !== idx * 10).map(s => s._id)));
        setDragIdx(null); setDragOverIdx(null);
    };

    const saveRank = async () => {
        setSavingRank(true);
        try {
            await Promise.all(ordered.filter(s => rankDirty.has(s._id)).map((s, i) => sizeAPI.update(s._id, { normalizedRank: i * 10 })));
            setSizes(ordered.map((s, i) => ({ ...s, normalizedRank: i * 10 })));
            setRankDirty(new Set());
            toast.success('Rank order saved');
        } catch { toast.error('Failed to save rank'); }
        finally { setSavingRank(false); }
    };

    /* ── Sort ───────────────────────────────────────────────────────────────── */
    const SORT_OPTS = [['normalizedRank', 'By Rank'], ['displayName', 'Name A→Z'], ['-createdAt', 'Newest']];
    // Fix: Reset pagination state (pg, stack) when sorting changes to prevent data desync
    const cycleSortBy = () => {
        const i = SORT_OPTS.findIndex(([k]) => k === sortBy);
        setSortBy(SORT_OPTS[(i + 1) % SORT_OPTS.length][0]);
        setPg(1);
        setCursorStack([]);
    };
    const sortLabel = SORT_OPTS.find(([k]) => k === sortBy)?.[1] || 'Sort';

    const initialData = editTarget ? {
        displayName: editTarget.displayName || '', value: editTarget.value || '',
        category: editTarget.category || 'CLOTHING', gender: editTarget.gender || 'UNISEX',
        primaryRegion: editTarget.primaryRegion || 'GLOBAL',
        lifecycleState: editTarget.lifecycleState || 'DRAFT', normalizedRank: editTarget.normalizedRank ?? 0,
    } : DEFAULT_FORM;

    // envBadge removed per redesign


    const from = (pg - 1) * LIMIT + 1;
    const to = Math.min(pg * LIMIT, total);

    /* ═══════════════════════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════════════════════ */
    return (
        <PageLayout>
            <PageHeader
                title="Size Master"
                breadcrumbs={['Dashboard', 'Size Master']}
                searchVal={search}
                onSearch={e => setSearch(e.target.value)}
                onNew={() => { setEditTarget(null); setModalMode('create'); setShowModal(true); }}
                savingRank={savingRank}
                saveRank={saveRank}
                rankDirty={rankDirty.size}
            />

            <FilterSection
                activeCount={activeFilters}
                onReset={clearFilters}
                sortLabel={sortLabel}
                onCycleSort={cycleSortBy}
                filters={
                    <>
                        <SearchableDropdown label="Lifecycle State" value={fState} options={LIFECYCLE_STATES}
                            onChange={v => { setFState(v); setPg(1); setCursorStack([]); }} onClear={() => { setFState(''); setPg(1); setCursorStack([]); }} />
                        <SearchableDropdown label="Category" value={fCat} options={CATEGORIES} icon={TagIcon}
                            onChange={v => { setFCat(v); setPg(1); setCursorStack([]); }} onClear={() => { setFCat(''); setPg(1); setCursorStack([]); }} />
                        <SearchableDropdown label="Gender" value={fGender} options={GENDERS} icon={UsersIcon}
                            onChange={v => { setFGender(v); setPg(1); setCursorStack([]); }} onClear={() => { setFGender(''); setPg(1); setCursorStack([]); }} />
                        <SearchableDropdown label="Region" value={fRegion} options={REGIONS} icon={GlobeAltIcon}
                            onChange={v => { setFRegion(v); setPg(1); setCursorStack([]); }} onClear={() => { setFRegion(''); setPg(1); setCursorStack([]); }} />
                        <SearchableDropdown label="Lock Status" value={fLocked}
                            options={[{ value: 'locked', label: '🔒 Locked' }, { value: 'unlocked', label: '🔓 Unlocked' }]}
                            icon={LockClosedIcon}
                            onChange={v => { setFLocked(v); setPg(1); setCursorStack([]); }} onClear={() => { setFLocked(''); setPg(1); setCursorStack([]); }} />
                    </>
                }
            />

            <DataTable
                loading={loading}
                footer={
                    !loading && ordered.length > 0 ? (
                        <PaginationFooter
                            from={from} to={to} total={total} pg={pg}
                            hasNext={hasNext} onPrev={gotoPrev} onNext={gotoNext}
                            slot={rankDirty.size > 0 && <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{rankDirty.size} pending</span>}
                        />
                    ) : null
                }
                header={
                    <>
                        <th className="pl-6 pr-3 py-3 w-[48px] bg-[#F9FAFB] border-b border-gray-200">
                            <CB checked={allChecked} indeterminate={someCk} onChange={toggleAll} label="Select all" />
                        </th>
                        <th className="w-8 py-3 bg-[#F9FAFB] border-b border-gray-200" aria-label="Drag handle" />
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] bg-[#F9FAFB] border-b border-gray-200">Name · Category</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] bg-[#F9FAFB] border-b border-gray-200">Value</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] bg-[#F9FAFB] border-b border-gray-200">Region</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] bg-[#F9FAFB] border-b border-gray-200">Gender</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] bg-[#F9FAFB] border-b border-gray-200">Rank</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] bg-[#F9FAFB] border-b border-gray-200">Lifecycle</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] bg-[#F9FAFB] border-b border-gray-200">Governance</th>
                        <th className="px-5 py-3 w-[100px] bg-[#F9FAFB] border-b border-gray-200" />
                    </>
                }
                emptyState={
                    <tr>
                        <td colSpan={10} className="py-24 text-center">
                            <div className="inline-flex flex-col items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-200">
                                    <TagIcon className="w-10 h-10 text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-semibold text-slate-900">
                                        {activeFilters > 0 ? 'No results match your filters' : 'Size registry is empty'}
                                    </h3>
                                    <p className="text-[13px] mt-1.5 text-slate-400">
                                        {activeFilters > 0 ? 'Adjust or reset filters to see entries.' : 'Register your first size to begin governance tracking.'}
                                    </p>
                                </div>
                                {activeFilters > 0
                                    ? <button onClick={clearFilters} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">Reset Filters</button>
                                    : <button onClick={() => { setEditTarget(null); setModalMode('create'); setShowModal(true); }} className="flex items-center gap-2 px-5 py-2 rounded-[10px] text-[13px] font-bold transition-all bg-indigo-600 text-white hover:bg-indigo-700"><PlusIcon className="w-4 h-4" />Register First Size</button>
                                }
                            </div>
                        </td>
                    </tr>
                }
                rows={ordered.map((size, idx) => {
                    const cat = getCfg(size.category);
                    const CatIcon = cat.icon;
                    const isLocked = size.isLocked === true;
                    const isDeleting = deletingId === size._id;
                    const isUpdating = updatingId === size._id;
                    const isSelected = selected.has(size._id);
                    const dirty = rankDirty.has(size._id);
                    const isDragOver = dragOverIdx === idx;

                    return (
                        <tr
                            key={size._id} role="row" tabIndex={0} aria-selected={isSelected}
                            draggable
                            onKeyDown={e => {
                                if (e.key === 'e' && !isLocked) { setEditTarget(size); setModalMode('edit'); setShowModal(true); }
                                if (e.key === 'Delete' && !isLocked && size.lifecycleState === 'ARCHIVED') handleDelete(size);
                            }}
                            onDragStart={() => onDragStart(idx)}
                            onDragOver={e => onDragOver(e, idx)}
                            onDrop={() => onDrop(idx)}
                            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                            className="group focus:outline-none transition-colors"
                            style={{
                                height: 64,
                                borderBottom: isDragOver ? '1px solid #6366F1' : '1px solid #F1F5F9',
                                borderLeft: isSelected ? '3px solid #6366F1' : dirty ? '3px solid #F59E0B' : '3px solid transparent',
                                background: isDeleting ? 'rgba(248,250,252,0.5)'
                                    : isSelected ? '#EEF2FF'
                                        : dirty ? '#FFFBEB'
                                            : idx % 2 === 0 ? '#FFFFFF' : '#FAFBFF',
                                opacity: isDeleting ? 0.45 : (size.lifecycleState === 'ARCHIVED' ? 0.65 : 1),
                                transition: 'background 120ms ease, border-color 120ms ease, opacity 120ms ease',
                                cursor: 'default',
                            }}
                            onMouseEnter={e => { if (!isSelected && !dirty) e.currentTarget.style.background = '#F5F7FF'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#EEF2FF' : dirty ? '#FFFBEB' : idx % 2 === 0 ? '#FFFFFF' : '#FAFBFF'; }}
                        >
                            <td className="pl-6 pr-3" onClick={e => e.stopPropagation()}>
                                <CB checked={isSelected} onChange={() => toggleOne(size._id)} label={`Select ${size.displayName}`} disabled={isLocked} />
                            </td>
                            <td className="pr-2 w-8 cursor-grab active:cursor-grabbing text-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-500">
                                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20"><circle cx="7" cy="4" r="1.3" /><circle cx="13" cy="4" r="1.3" /><circle cx="7" cy="10" r="1.3" /><circle cx="13" cy="10" r="1.3" /><circle cx="7" cy="16" r="1.3" /><circle cx="13" cy="16" r="1.3" /></svg>
                                </div>
                            </td>
                            <td className="px-5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                                        <CatIcon className="w-[18px] h-[18px]" style={{ color: cat.text }} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold truncate leading-tight text-slate-900" style={{ fontSize: 13 }}>
                                                {size.displayName || size.value || '—'}
                                            </span>
                                            {isLocked && <LockBadge />}
                                            {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block flex-shrink-0" title="Rank changed" />}
                                        </div>
                                        <div className="mt-[3px]"><TypeBadge category={size.category} /></div>
                                    </div>
                                </div>
                            </td>
                            {/* Code / Value pill */}
                            <td className="px-5">
                                <button
                                    onClick={() => { navigator.clipboard.writeText(size.value || ''); toast.success(`Copied: ${size.value}`, { duration: 1500, icon: '📋' }); }}
                                    className="group/cp inline-flex items-center gap-1.5 transition-all active:scale-95 px-3 py-1.5 rounded-[6px] text-[13px] font-mono font-semibold"
                                    style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#374151' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#4F46E5'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
                                >
                                    {size.value || '—'}
                                    <ClipboardDocumentIcon className="w-3 h-3 opacity-0 group-hover/cp:opacity-100 transition-opacity" />
                                </button>
                            </td>
                            <td className="px-5">
                                <span className="font-semibold uppercase text-xs text-slate-600">{size.primaryRegion || '—'}</span>
                            </td>
                            <td className="px-5">
                                <span className="uppercase text-xs text-slate-400">{size.gender || '—'}</span>
                            </td>
                            <InlineRankCell size={size} dirty={dirty} onSaveRank={inlineSaveRank} />
                            <td className="px-5">
                                {isUpdating ? (
                                    <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full text-[12px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500">
                                        <ArrowPathIcon className="w-3 h-3 animate-spin" />
                                        {size.lifecycleState}
                                    </span>
                                ) : (
                                    <LcPopover size={size} onChange={handleLcChange} loading={isUpdating} />
                                )}
                            </td>
                            <td className="px-5">
                                <GovernanceCell size={size} />
                            </td>
                            <td className="px-5">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    <button onClick={() => { if (!isLocked) { setEditTarget(size); setModalMode('edit'); setShowModal(true); } }} disabled={isLocked}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => !isLocked && handleDelete(size)} disabled={isLocked || isDeleting}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30">
                                        {isDeleting ? <ArrowPathIcon className="w-4 h-4 animate-spin text-red-500" /> : <TrashIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            />

            {/* Floating Bulk Bar */}
            <AnimatePresence>
                {selected.size > 0 && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40 pointer-events-none"
                        />
                        <BulkBar count={selected.size} onLifecycle={bulkLifecycle} onArchive={bulkArchive}
                            onDelete={bulkDelete} onClear={() => setSelected(new Set())} loading={bulkLoading} />
                    </>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <SizeFormModal mode={modalMode} initialData={initialData}
                        onClose={() => !saving && setShowModal(false)}
                        onSubmit={handleSubmit} saving={saving} />
                )}
            </AnimatePresence>
        </PageLayout>
    );
};

export default SizeManagement;
