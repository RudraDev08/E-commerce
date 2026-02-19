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
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */
const CATEGORIES = ['CLOTHING', 'FOOTWEAR', 'ACCESSORIES', 'STORAGE', 'RAM', 'DISPLAY', 'DIMENSION'];
const GENDERS = ['UNISEX', 'MEN', 'WOMEN', 'BOYS', 'GIRLS', 'KIDS', 'INFANT'];
const REGIONS = ['GLOBAL', 'US', 'UK', 'EU', 'JP', 'AU', 'CN'];
const LIFECYCLE_STATES = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'];
const VALID_TRANSITIONS = {
    DRAFT: ['ACTIVE', 'ARCHIVED'],
    ACTIVE: ['DEPRECATED', 'ARCHIVED'],
    DEPRECATED: ['ACTIVE', 'ARCHIVED'],
    ARCHIVED: [],
};
const ENV = import.meta.env.VITE_ENV || 'PROD';
const DEFAULT_FORM = {
    displayName: '', value: '', category: 'CLOTHING',
    gender: 'UNISEX', primaryRegion: 'GLOBAL',
    lifecycleState: 'DRAFT', normalizedRank: 0,
};

/* ═══════════════════════════════════════════════════════════════════════════
   STYLE MAPS
   ═══════════════════════════════════════════════════════════════════════════ */
const CAT_CFG = {
    CLOTHING: { icon: TagIcon, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Clothing' },
    FOOTWEAR: { icon: ShoppingBagIcon, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Footwear' },
    ACCESSORIES: { icon: TagIcon, bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', label: 'Accessories' },
    STORAGE: { icon: ServerIcon, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Storage' },
    RAM: { icon: CpuChipIcon, bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'RAM' },
    DISPLAY: { icon: TvIcon, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Display' },
    DIMENSION: { icon: ScaleIcon, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Dimension' },
};
const getCfg = c => CAT_CFG[(c || '').toUpperCase()] || { icon: TagIcon, bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', label: 'Generic' };

const LC_CFG = {
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
    DRAFT: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
    DEPRECATED: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
    ARCHIVED: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
};
const getLc = s => LC_CFG[(s || '').toUpperCase()] || LC_CFG.ARCHIVED;

/* ═══════════════════════════════════════════════════════════════════════════
   MICRO COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */
const TypeBadge = ({ category }) => {
    const c = getCfg(category);
    const I = c.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase border ${c.bg} ${c.text} ${c.border}`}>
            <I className="w-3.5 h-3.5" />{c.label}
        </span>
    );
};

const LcPill = ({ state }) => {
    const s = getLc(state);
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${s.bg} ${s.text} ${s.border}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
            {state || '—'}
        </span>
    );
};

const LockBadge = () => (
    <span
        title="Locked by governance policy"
        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 border border-amber-300 text-amber-800 rounded-md text-xs font-semibold"
    >
        <LockClosedIcon className="w-3.5 h-3.5" />LOCKED
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

    if (!allowed.length) return <LcPill state={size.lifecycleState} />;

    return (
        <div ref={ref} className="relative inline-block">
            <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Change lifecycle state"
                className="inline-flex items-center gap-1.5 group/lcp focus:outline-none focus:ring-2 focus:ring-indigo-400/40 rounded-full transition-all"
            >
                <LcPill state={size.lifecycleState} />
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 group-hover/lcp:text-slate-600 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        role="listbox"
                        aria-label="Select lifecycle transition"
                        className="absolute top-full left-0 mt-2 z-50 min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transition to</p>
                        </div>
                        <ul className="py-3">
                            <li className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-400 bg-slate-50/60 cursor-default">
                                <span className="flex items-center gap-2.5">
                                    <span className={`w-2 h-2 rounded-full ${getLc(size.lifecycleState).dot}`} />
                                    {size.lifecycleState}
                                </span>
                                <CheckIcon className="w-4 h-4 text-slate-400" />
                            </li>
                            {allowed.map(st => {
                                const sc = getLc(st);
                                return (
                                    <li
                                        key={st}
                                        role="option"
                                        aria-selected={false}
                                        onClick={() => { onChange(size, st); setOpen(false); }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
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
const CB = ({ checked, indeterminate, onChange, label }) => {
    const r = useRef(null);
    useEffect(() => { if (r.current) r.current.indeterminate = !!indeterminate; }, [indeterminate]);
    return (
        <input
            ref={r} type="checkbox" checked={checked} onChange={onChange} aria-label={label}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600 focus:ring-2 focus:ring-indigo-400/40"
        />
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════════════ */
const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-slate-100">
        {Array.from({ length: 10 }).map((_, i) => (
            <td key={i} className="px-4 py-5">
                <div className="h-4 bg-slate-100 rounded w-full max-w-[120px]" />
            </td>
        ))}
    </tr>
);

/* ═══════════════════════════════════════════════════════════════════════════
   BULK ACTION BAR
   ═══════════════════════════════════════════════════════════════════════════ */
const BulkBar = ({ count, onLifecycle, onArchive, onDelete, onClear, loading }) => (
    <motion.div
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -48, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-indigo-600 text-white px-6 py-3 flex items-center gap-4 shadow-lg z-30"
    >
        <span className="text-sm font-bold tabular-nums">{count} selected</span>
        <div className="h-5 w-px bg-indigo-400" />
        <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
                <select
                    onChange={e => { if (e.target.value) { onLifecycle(e.target.value); e.target.value = ''; } }}
                    defaultValue="" disabled={loading}
                    className="pl-3 pr-7 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold appearance-none cursor-pointer hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                    <option value="" disabled>→ Change State…</option>
                    {LIFECYCLE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60 pointer-events-none" />
            </div>
            <button onClick={onArchive} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                <ArchiveBoxIcon className="w-4 h-4" />Archive
            </button>
            <button onClick={onDelete} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                <TrashIcon className="w-4 h-4" />Delete
            </button>
        </div>
        <button onClick={onClear} className="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors">
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
                        {[['Primary Region', 'primaryRegion', REGIONS], ['Lifecycle State', 'lifecycleState', LIFECYCLE_STATES]].map(([l, k, opts]) => (
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
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const SizeManagement = () => {

    const [sizes, setSizes] = useState([]);
    const [ordered, setOrdered] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    const [pg, setPg] = useState(1);
    const [total, setTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const [cursorStack, setCursorStack] = useState([]);
    const [hasNext, setHasNext] = useState(false);
    const LIMIT = 15;

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
    const activeFilters = [fState, fCat, fGender, fRegion, fLocked, dSearch].filter(Boolean).length;

    useEffect(() => {
        const t = setTimeout(() => { setDSearch(search); setPg(1); setCursorStack([]); setNextCursor(null); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { setOrdered(sizes); setRankDirty(new Set()); }, [sizes]);

    /* ── Load ───────────────────────────────────────────────────────────────── */
    const load = useCallback(async (cursor = null, page = pg) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        try {
            const p = { limit: LIMIT, sort: sortBy };
            if (cursor) p.cursor = cursor; else p.page = page;
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
            const nc2 = nc || pageInfo?.nextCursor;
            setNextCursor(nc2 || null);
            setHasNext(!!(nc2 || (pagination?.pages > page)));
            setSelected(new Set());
        } catch (err) {
            if (err.name === 'CanceledError' || err.name === 'AbortError') return;
            toast.error(err.response?.data?.message || 'Failed to load sizes');
            setSizes([]);
        } finally { setLoading(false); }
    }, [pg, fState, fCat, fGender, fRegion, fLocked, dSearch, sortBy]);

    useEffect(() => { load(); }, [load]);

    const gotoNext = () => { setCursorStack(s => [...s, nextCursor]); const p = pg + 1; setPg(p); load(nextCursor, p); };
    const gotoPrev = () => { const s = [...cursorStack]; s.pop(); setCursorStack(s); const p = pg - 1; setPg(p); load(s[s.length - 1] || null, p); };
    const clearFilters = () => { setSearch(''); setFState(''); setFCat(''); setFGender(''); setFRegion(''); setFLocked(''); setPg(1); setCursorStack([]); setNextCursor(null); };

    /* ── CRUD ───────────────────────────────────────────────────────────────── */
    const buildPayload = f => {
        const p = { displayName: f.displayName.trim(), value: f.value.trim().toUpperCase(), category: f.category, gender: f.gender, primaryRegion: f.primaryRegion, normalizedRank: parseInt(f.normalizedRank) || 0, lifecycleState: f.lifecycleState };
        if (!p.displayName) throw new Error('Display Name required');
        if (!p.value) throw new Error('Value / Code required');
        return p;
    };

    const handleSubmit = async form => {
        setSaving(true);
        try {
            const payload = buildPayload(form);
            if (modalMode === 'create') {
                const res = await sizeAPI.create(payload);
                setSizes(p => [res.data?.data || res.data, ...p]);
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
        if (!VALID_TRANSITIONS[size.lifecycleState]?.includes(newState)) { toast.error(`${size.lifecycleState} → ${newState} not permitted`); return; }
        setUpdatingId(size._id);
        setSizes(p => p.map(s => s._id === size._id ? { ...s, lifecycleState: newState } : s));
        try { await sizeAPI.toggleStatus(size._id); toast.success(`→ ${newState}`); }
        catch (err) { setSizes(p => p.map(s => s._id === size._id ? { ...s, lifecycleState: size.lifecycleState } : s)); toast.error(err.response?.data?.message || 'Failed'); }
        finally { setUpdatingId(null); }
    };

    const handleDelete = async size => {
        const isArch = size.lifecycleState === 'ARCHIVED';
        if (!window.confirm(isArch ? `Permanently delete "${size.displayName}"?` : `Archive "${size.displayName}"?`)) return;
        setDeletingId(size._id);
        setSizes(p => p.filter(s => s._id !== size._id));
        setTotal(p => Math.max(p - 1, 0));
        try { await sizeAPI.delete(size._id); toast.success(isArch ? 'Deleted' : 'Archived'); }
        catch (err) { setSizes(p => [size, ...p]); setTotal(p => p + 1); toast.error(err.response?.data?.message || 'Failed'); }
        finally { setDeletingId(null); }
    };

    /* ── Bulk ───────────────────────────────────────────────────────────────── */
    const allIds = ordered.map(s => s._id);
    const allChecked = allIds.length > 0 && allIds.every(id => selected.has(id));
    const someCk = allIds.some(id => selected.has(id)) && !allChecked;
    const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allIds));
    const toggleOne = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const bulkOp = async (fn, msg) => {
        setBulkLoading(true);
        try { await Promise.all([...selected].map(fn)); toast.success(msg); load(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setBulkLoading(false); setSelected(new Set()); }
    };
    const bulkLifecycle = st => bulkOp(id => sizeAPI.toggleStatus(id), `State updated for ${selected.size} sizes`);
    const bulkArchive = () => bulkOp(id => sizeAPI.update(id, { lifecycleState: 'ARCHIVED' }), `${selected.size} sizes archived`);
    const bulkDelete = () => { if (!window.confirm(`Delete ${selected.size} sizes?`)) return; bulkOp(id => sizeAPI.delete(id), `${selected.size} sizes deleted`); };

    /* ── Drag reorder ───────────────────────────────────────────────────────── */
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
    const cycleSortBy = () => { const i = SORT_OPTS.findIndex(([k]) => k === sortBy); setSortBy(SORT_OPTS[(i + 1) % SORT_OPTS.length][0]); };
    const sortLabel = SORT_OPTS.find(([k]) => k === sortBy)?.[1] || 'Sort';

    const initialData = editTarget ? {
        displayName: editTarget.displayName || '', value: editTarget.value || '',
        category: editTarget.category || 'CLOTHING', gender: editTarget.gender || 'UNISEX',
        primaryRegion: editTarget.primaryRegion || 'GLOBAL',
        lifecycleState: editTarget.lifecycleState || 'DRAFT', normalizedRank: editTarget.normalizedRank ?? 0,
    } : DEFAULT_FORM;

    const envBadge = ENV === 'PROD'
        ? <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">PROD</span>
        : <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">STAGING</span>;

    const from = (pg - 1) * LIMIT + 1;
    const to = Math.min(pg * LIMIT, total);

    /* ═══════════════════════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════════════════════ */
    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">

            {/* ── HEADER ───────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200 px-6 pt-5 pb-4 sticky top-0 z-20 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">

                <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-3" aria-label="Breadcrumb">
                    <span className="hover:text-slate-700 hover:underline underline-offset-2 cursor-pointer transition-colors">Dashboard</span>
                    <ChevronR className="w-3.5 h-3.5 text-slate-300" />
                    <span className="hover:text-slate-700 hover:underline underline-offset-2 cursor-pointer transition-colors">Catalogue</span>
                    <ChevronR className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-slate-800 font-semibold">Size Master</span>
                </nav>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Size Master</h1>
                            <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-sm">
                                Enterprise Governance
                            </span>
                            {envBadge}
                        </div>
                        <p className="text-sm text-slate-400 mt-1">Lifecycle-controlled · Schema-enforced · Immutable audit log</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {rankDirty.size > 0 && (
                            <button onClick={saveRank} disabled={savingRank}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-60 shadow-sm">
                                {savingRank ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                                Save Order ({rankDirty.size})
                            </button>
                        )}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sizes…"
                                aria-label="Search sizes"
                                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400/40 focus:bg-white transition-all w-56" />
                        </div>
                        <button onClick={() => { setEditTarget(null); setModalMode('create'); setShowModal(true); }}
                            aria-label="Add new size"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-600/20 transition-all">
                            <PlusIcon className="w-4 h-4" />Add Size
                        </button>
                    </div>
                </div>
            </div>

            {/* ── BULK BAR ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {selected.size > 0 && (
                    <BulkBar count={selected.size} onLifecycle={bulkLifecycle} onArchive={bulkArchive}
                        onDelete={bulkDelete} onClear={() => setSelected(new Set())} loading={bulkLoading} />
                )}
            </AnimatePresence>

            {/* ── FILTER TOOLBAR ────────────────────────────────────────────── */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3 flex-wrap sticky top-[92px] z-10">
                <div className="flex items-center gap-2 mr-1">
                    <FunnelIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter</span>
                    {activeFilters > 0 && (
                        <span className="w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center tabular-nums">
                            {activeFilters}
                        </span>
                    )}
                </div>

                <SearchableDropdown label="Lifecycle State" value={fState} options={LIFECYCLE_STATES}
                    onChange={v => { setFState(v); setPg(1); }} onClear={() => { setFState(''); setPg(1); }} />
                <SearchableDropdown label="Category" value={fCat} options={CATEGORIES} icon={TagIcon}
                    onChange={v => { setFCat(v); setPg(1); }} onClear={() => { setFCat(''); setPg(1); }} />
                <SearchableDropdown label="Gender" value={fGender} options={GENDERS} icon={UsersIcon}
                    onChange={v => { setFGender(v); setPg(1); }} onClear={() => { setFGender(''); setPg(1); }} />
                <SearchableDropdown label="Region" value={fRegion} options={REGIONS} icon={GlobeAltIcon}
                    onChange={v => { setFRegion(v); setPg(1); }} onClear={() => { setFRegion(''); setPg(1); }} />
                <SearchableDropdown label="Lock Status" value={fLocked}
                    options={[{ value: 'locked', label: '🔒 Locked' }, { value: 'unlocked', label: '🔓 Unlocked' }]}
                    icon={LockClosedIcon}
                    onChange={v => { setFLocked(v); setPg(1); }} onClear={() => { setFLocked(''); setPg(1); }} />

                <div className="ml-auto flex items-center gap-3">
                    <button onClick={cycleSortBy} aria-label="Cycle sort"
                        className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all">
                        <ArrowsUpDownIcon className="w-4 h-4 text-slate-400" />{sortLabel}
                    </button>
                    {activeFilters > 0 && (
                        <button onClick={clearFilters} aria-label="Reset all filters"
                            className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
                            Reset All
                        </button>
                    )}
                </div>
            </div>

            {/* ── TABLE ────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse" role="grid" aria-label="Size Master registry">
                    <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-[5] shadow-sm">
                        <tr>
                            <th className="pl-6 pr-3 py-3.5 w-10">
                                <CB checked={allChecked} indeterminate={someCk} onChange={toggleAll} label="Select all" />
                            </th>
                            <th className="w-8 py-3.5" aria-label="Drag handle" />
                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name · Category</th>
                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Region</th>
                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</th>
                            <th scope="col" className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lifecycle</th>
                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Governance</th>
                            <th scope="col" className="px-4 py-3.5 w-24" aria-label="Row actions" />
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200/60">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : ordered.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-24 text-center">
                                    <div className="inline-flex flex-col items-center gap-5">
                                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                            <TagIcon className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-800">
                                                {activeFilters > 0 ? 'No results match your filters' : 'Size registry is empty'}
                                            </h3>
                                            <p className="text-sm text-slate-400 mt-1.5">
                                                {activeFilters > 0 ? 'Adjust or reset filters to see entries.' : 'Register your first size to begin governance tracking.'}
                                            </p>
                                        </div>
                                        {activeFilters > 0
                                            ? <button onClick={clearFilters} className="px-5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">Reset Filters</button>
                                            : <button onClick={() => { setEditTarget(null); setModalMode('create'); setShowModal(true); }} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"><PlusIcon className="w-4 h-4" />Register First Size</button>
                                        }
                                    </div>
                                </td>
                            </tr>
                        ) : ordered.map((size, idx) => {
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
                                    onDragStart={() => onDragStart(idx)}
                                    onDragOver={e => onDragOver(e, idx)}
                                    onDrop={() => onDrop(idx)}
                                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                                    onKeyDown={e => {
                                        if (e.key === 'e' && !isLocked) { setEditTarget(size); setModalMode('edit'); setShowModal(true); }
                                        if (e.key === 'Delete' && !isLocked) handleDelete(size);
                                    }}
                                    className={`group transition-all duration-200 ease-in-out focus:outline-none
                                        ${isDeleting ? 'opacity-40' : ''}
                                        ${isSelected ? 'bg-indigo-50/70' : 'odd:bg-white even:bg-slate-50/30 hover:bg-slate-100'}
                                        ${dirty ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''}
                                        ${isDragOver ? 'border-t-2 border-t-indigo-500' : ''}
                                        focus:ring-2 focus:ring-inset focus:ring-indigo-400`}
                                >
                                    {/* Checkbox */}
                                    <td className="pl-6 pr-3 py-4" onClick={e => e.stopPropagation()}>
                                        <CB checked={isSelected} onChange={() => toggleOne(size._id)} label={`Select ${size.displayName}`} />
                                    </td>

                                    {/* Drag handle */}
                                    <td className="pr-2 py-4 w-8 cursor-grab active:cursor-grabbing text-center">
                                        <div className="opacity-0 group-hover:opacity-60 transition-opacity text-slate-400">
                                            <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                <circle cx="7" cy="4" r="1.3" /><circle cx="13" cy="4" r="1.3" />
                                                <circle cx="7" cy="10" r="1.3" /><circle cx="13" cy="10" r="1.3" />
                                                <circle cx="7" cy="16" r="1.3" /><circle cx="13" cy="16" r="1.3" />
                                            </svg>
                                        </div>
                                    </td>

                                    {/* Name + Category */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${cat.bg} ${cat.border}`}>
                                                <CatIcon className={`w-4 h-4 ${cat.text}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-base font-semibold text-slate-900 truncate leading-tight">{size.displayName || size.value || '—'}</span>
                                                    {isLocked && <LockBadge />}
                                                    {dirty && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Rank changed" />}
                                                </div>
                                                <div className="mt-1"><TypeBadge category={size.category} /></div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Code */}
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(size.value || ''); toast.success(`Copied: ${size.value}`, { duration: 1500, icon: '📋' }); }}
                                            aria-label={`Copy code ${size.value}`}
                                            className="group/cp inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 font-mono text-sm font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-all active:scale-95"
                                        >
                                            {size.value || '—'}
                                            <ClipboardDocumentIcon className="w-3.5 h-3.5 opacity-0 group-hover/cp:opacity-100 transition-opacity" />
                                        </button>
                                    </td>

                                    {/* Region */}
                                    <td className="px-4 py-4">
                                        <span className="text-sm font-semibold text-slate-600 uppercase">{size.primaryRegion || '—'}</span>
                                    </td>

                                    {/* Gender */}
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-slate-500 uppercase">{size.gender || '—'}</span>
                                    </td>

                                    {/* Rank */}
                                    <td className="px-4 py-4 text-right">
                                        <span className={`text-sm font-mono tabular-nums ${dirty ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                                            {size.normalizedRank ?? '—'}
                                        </span>
                                    </td>

                                    {/* Lifecycle */}
                                    <td className="px-4 py-4">
                                        {isUpdating
                                            ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 font-bold text-xs"><ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />…</span>
                                            : <LcPopover size={size} onChange={handleLcChange} loading={isUpdating} />
                                        }
                                    </td>

                                    {/* Governance */}
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-sm tabular-nums ${(size.usageCount ?? 0) > 0 ? 'font-semibold text-indigo-600' : 'font-medium text-slate-500'}`}>
                                                {(size.usageCount ?? 0) > 0 ? `${size.usageCount} uses` : 'Unused'}
                                            </span>
                                            {size.replacedBy && (
                                                <span title="Has a replacement size" className="inline-flex items-center gap-1 text-amber-600 font-semibold text-xs">
                                                    <LinkIcon className="w-3.5 h-3.5" />Replaced
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200"
                                            role="group" aria-label={`Actions for ${size.displayName}`}>
                                            <button
                                                onClick={() => { if (!isLocked) { setEditTarget(size); setModalMode('edit'); setShowModal(true); } }}
                                                disabled={isLocked} title={isLocked ? 'Locked' : 'Edit (E)'} aria-label="Edit"
                                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => !isLocked && handleDelete(size)} disabled={isLocked || isDeleting}
                                                title={isLocked ? 'Locked' : 'Delete (Del)'} aria-label="Delete"
                                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                                            >
                                                {isDeleting ? <ArrowPathIcon className="w-4 h-4 animate-spin text-red-400" /> : <TrashIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── PAGINATION ───────────────────────────────────────────────── */}
            {!loading && ordered.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                    className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between"
                    role="navigation" aria-label="Pagination">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span aria-live="polite">
                            Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of <span className="font-semibold text-slate-700">{total}</span>
                        </span>
                        {nextCursor && (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-md border border-indigo-200">
                                Cursor Mode
                            </span>
                        )}
                        {rankDirty.size > 0 && (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-200">
                                {rankDirty.size} rank changes pending
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={gotoPrev} disabled={pg <= 1} aria-label="Previous page"
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg tabular-nums min-w-[42px] text-center">
                            {pg}
                        </span>
                        <button onClick={gotoNext} disabled={!hasNext} aria-label="Next page"
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* ── FORM MODAL ───────────────────────────────────────────────── */}
            <AnimatePresence>
                {showModal && (
                    <SizeFormModal mode={modalMode} initialData={initialData}
                        onClose={() => !saving && setShowModal(false)}
                        onSubmit={handleSubmit} saving={saving} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SizeManagement;
