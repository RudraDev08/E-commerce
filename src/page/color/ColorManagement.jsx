import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    ArchiveBoxIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    SwatchIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    CheckIcon,
    LockClosedIcon,
    ClipboardIcon,
    ArrowRightIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowUturnLeftIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { colorAPI } from '../../Api/api';
import toast from 'react-hot-toast';

const ICON_MAP = {
    'bg-red-600 hover:bg-red-700': { icon: '🗑️', label: 'Destructive action' },
    'bg-amber-600 hover:bg-amber-700': { icon: '📦', label: 'Archive action' },
    'bg-indigo-600 hover:bg-indigo-700': { icon: '↩️', label: 'Restore action' },
    'bg-slate-800 hover:bg-slate-900': { icon: '🔒', label: 'Lock action' },
};

const customConfirm = (message, onConfirm, confirmText = 'Confirm', confirmColor = 'bg-indigo-600 hover:bg-indigo-700') => {
    const meta = ICON_MAP[confirmColor] || { icon: '⚡', label: 'Action' };
    toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '240px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>{meta.icon}</span>
                <span style={{
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#F1F5F9',
                    lineHeight: '1.4',
                    flex: 1,
                }}>
                    {message}
                </span>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 -2px' }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#94A3B8',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.11)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                >
                    Cancel
                </button>
                <button
                    onClick={() => { toast.dismiss(t.id); onConfirm(); }}
                    style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#fff',
                        background: confirmColor.includes('red') ? '#DC2626'
                            : confirmColor.includes('amber') ? '#D97706'
                                : confirmColor.includes('slate') ? '#1E293B'
                                    : '#4F46E5',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.opacity = '0.85'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    ), {
        duration: Infinity,
        style: {
            background: '#0F172A',
            color: '#F1F5F9',
            borderRadius: '16px',
            padding: '16px 18px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)',
            maxWidth: '380px',
            border: 'none',
            borderLeft: '3px solid ' + (
                confirmColor.includes('red') ? '#F87171'
                    : confirmColor.includes('amber') ? '#FBBF24'
                        : confirmColor.includes('slate') ? '#64748B'
                            : '#818CF8'
            ),
        },
    });
};

// ─── HEX UTILITIES ────────────────────────────────────────────────────────────

const normalizeHex = (raw = '') => {
    const hex = raw.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex.toUpperCase();
    if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
        const [, r, g, b] = hex.split('');
        return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return hex.toUpperCase();
};

const isSafeHex = (hex) => /^#[0-9A-F]{6}$/i.test(hex);

// ─── WCAG CONTRAST UTILITY ────────────────────────────────────────────────────

const getWcagWarning = (hex) => {
    if (!isSafeHex(hex)) return null;
    const h = hex.replace('#', '');
    const toLinear = (v) => { const n = parseInt(v, 16) / 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * toLinear(h.slice(0, 2)) + 0.7152 * toLinear(h.slice(2, 4)) + 0.0722 * toLinear(h.slice(4, 6));
    const vsWhite = parseFloat(((1.05) / (L + 0.05)).toFixed(2));
    const vsBlack = parseFloat(((L + 0.05) / (0.05)).toFixed(2));
    if (vsWhite < 4.5 && vsBlack < 4.5) return { level: 'error', msg: `Fails WCAG AA on both White (${vsWhite}:1) & Black (${vsBlack}:1) text` };
    if (vsWhite < 4.5) return { level: 'warn', msg: `Low contrast on White text (${vsWhite}:1) — use Black text overlay.` };
    if (vsBlack < 4.5) return { level: 'warn', msg: `Low contrast on Black text (${vsBlack}:1) — use White text overlay.` };
    return null;
};

// ─── MODAL DROPDOWN (portal-safe — renders at fixed coords, no overflow clipping) ────

const ModalDropdown = ({ label, value, options, onChange, required }) => {
    const [open, setOpen] = useState(false);
    const btnRef = useRef(null);
    const listRef = useRef(null);
    const [pos, setPos] = useState(null);
    const selected = options.find(o => o.value === value) ?? options[0];

    const updatePosition = useCallback(() => {
        if (!btnRef.current) return;
        const r = btnRef.current.getBoundingClientRect();

        // Auto-close if the input scrolls completely out of view
        if (r.bottom < 0 || r.top > window.innerHeight) {
            setOpen(false);
            return;
        }

        const estimatedH = Math.min(options.length * 40 + 8, 240); // 240px is our max-height
        const spaceBelow = window.innerHeight - r.bottom;

        // Flip upwards if no space below
        if (spaceBelow >= estimatedH || spaceBelow > r.top) {
            setPos({ top: r.bottom + 4, bottom: null, left: r.left, width: r.width });
        } else {
            setPos({ top: null, bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width });
        }
    }, [options.length]);

    useEffect(() => {
        if (!open) {
            setPos(null);
            return;
        }

        updatePosition();

        const close = (e) => {
            if (!listRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
        };
        const onScrollOrResize = () => requestAnimationFrame(updatePosition);

        document.addEventListener('mousedown', close);
        window.addEventListener('resize', onScrollOrResize, { passive: true });
        // Use capturing phase so internal modal scrolling recalculates dropdown position instantly
        window.addEventListener('scroll', onScrollOrResize, true);

        return () => {
            document.removeEventListener('mousedown', close);
            window.removeEventListener('resize', onScrollOrResize, { passive: true });
            window.removeEventListener('scroll', onScrollOrResize, true);
        };
    }, [open, updatePosition]);

    return (
        <div>
            {label && (
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
            )}
            <button ref={btnRef} type="button" onClick={() => setOpen(p => !p)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ${open ? 'border-indigo-400 text-indigo-900 bg-indigo-50/30' : 'border-slate-200 text-slate-900 hover:border-slate-300'}`}>
                <span>{selected?.label ?? 'Select…'}</span>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {open && pos && (
                        <motion.ul ref={listRef}
                            initial={{ opacity: 0, y: pos.bottom ? 4 : -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: pos.bottom ? 4 : -4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            style={{
                                position: 'fixed',
                                ...(pos.bottom != null ? { bottom: pos.bottom } : { top: pos.top }),
                                left: pos.left,
                                width: pos.width,
                                zIndex: 999999
                            }}
                            // IMPORTANT: Scroll bounds so the user doesn't get clipped
                            className="bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 py-1 overflow-x-hidden overflow-y-auto max-h-[240px] custom-scrollbar">
                            {options.map(opt => (
                                <li key={opt.value}>
                                    <button type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold transition-colors ${value === opt.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                        {opt.label}
                                        {value === opt.value && <CheckIcon className="w-3.5 h-3.5 text-indigo-500" />}
                                    </button>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

// ─── BULK ACTION BAR ──────────────────────────────────────────────────────────

const BulkActionBar = ({ selectedIds, onClear, onBulkArchive, onBulkLock }) => (
    <AnimatePresence>
        {selectedIds.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.18, ease: 'easeOut' }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl ring-1 ring-slate-700">
                <CheckCircleIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-300">
                    <span className="text-white">{selectedIds.length}</span> selected
                </span>
                <div className="w-px h-5 bg-slate-700" />
                <button onClick={onBulkLock}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors">
                    <LockClosedIcon className="w-3.5 h-3.5" /> Lock All
                </button>
                <button onClick={onBulkArchive}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition-colors">
                    <ArchiveBoxIcon className="w-3.5 h-3.5" /> Archive All
                </button>
                <button onClick={onClear}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
);

// ─── MODULE-LEVEL CONSTANTS (avoid per-render allocations) ────────────────────


const EMPTY_FORM = {
    name: '', displayName: '', code: '', hexCode: '#3B82F6',
    colorFamily: '', visualCategory: 'SOLID', lifecycleState: 'DRAFT',
    priority: 0, description: ''
};

// ─── LIFECYCLE STATE MACHINE ──────────────────────────────────────────────────

const LIFECYCLE = {
    DRAFT: {
        label: 'Draft',
        description: 'Internal only. Not visible to customers.',
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        transitions: ['ACTIVE', 'ARCHIVED'],
    },
    ACTIVE: {
        label: 'Active',
        description: 'Live and visible to customers.',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        transitions: ['DEPRECATED', 'LOCKED', 'ARCHIVED'],
    },
    DEPRECATED: {
        label: 'Deprecated',
        description: 'Phasing out. No new assignments.',
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        transitions: ['ACTIVE', 'ARCHIVED'],
    },
    LOCKED: {
        label: 'Locked',
        description: 'Governance lock. Cannot be edited.',
        dot: 'bg-red-500',
        badge: 'bg-red-50 text-red-700 border-red-200',
        transitions: ['ACTIVE'],
    },
    ARCHIVED: {
        label: 'Archived',
        description: 'Logically deleted. Restore to reactivate.',
        dot: 'bg-slate-300',
        badge: 'bg-slate-50 text-slate-400 border-slate-200',
        transitions: ['DRAFT'],
    },
};

const getAllowedTransitions = (state) => LIFECYCLE[state]?.transitions ?? [];

// ─── LIFECYCLE BADGE ──────────────────────────────────────────────────────────

const LifecycleBadge = ({ state }) => {
    const [tip, setTip] = useState(false);
    const cfg = LIFECYCLE[state] ?? LIFECYCLE.DRAFT;
    return (
        <div className="relative inline-flex" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border tracking-wide cursor-default select-none shadow-sm ${cfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                {cfg.label}
            </span>
            <AnimatePresence>
                {tip && (
                    <motion.div
                        initial={{ opacity: 0, y: 2, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.11 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-[99999] w-52 bg-slate-900 text-white text-[11px] font-medium rounded-xl px-3 py-2.5 text-center shadow-2xl pointer-events-none"
                    >
                        <div className="font-bold mb-0.5">{cfg.label}</div>
                        <div className="text-slate-300 font-normal leading-relaxed">{cfg.description}</div>
                        <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-slate-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── LIFECYCLE TRANSITION PANEL (fixed-position — zero layout impact) ─────────

const LifecycleTransitionPanel = ({ color, onTransition }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [panelPos, setPanelPos] = useState(null); // null = not yet positioned
    const btnRef = useRef(null);
    const panelRef = useRef(null);

    const allowed = getAllowedTransitions(color.lifecycleState);
    const currentCfg = LIFECYCLE[color.lifecycleState] ?? LIFECYCLE.DRAFT;
    const PANEL_WIDTH = 224;

    // Compute fixed viewport coordinates so the panel never affects layout
    const updatePosition = useCallback(() => {
        if (!btnRef.current) return;
        const r = btnRef.current.getBoundingClientRect();

        // Closes automatically if scrolled completely out of viewport bounds
        if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) {
            setIsOpen(false);
            return;
        }

        const estimatedH = allowed.length * 68 + 72;
        const spaceBelow = window.innerHeight - r.bottom;

        // Default anchor left, clamp to viewport edges
        let left = r.left;
        if (left + PANEL_WIDTH > window.innerWidth - 8) left = window.innerWidth - PANEL_WIDTH - 8;
        if (left < 8) left = 8;

        // Collision logic: flip upwards if absolutely no room below
        if (spaceBelow >= estimatedH || spaceBelow > r.top) {
            setPanelPos({ top: r.bottom + 6, left, bottom: null });
        } else {
            setPanelPos({ bottom: window.innerHeight - r.top + 6, left, top: null });
        }
    }, [allowed.length]);

    useEffect(() => {
        if (!isOpen) {
            setPanelPos(null); // Reset position gracefully when closed
            return;
        }

        updatePosition(); // Initial calculation

        const close = () => setIsOpen(false);
        const onOutside = (e) => {
            // Check if click was entirely outside both the triggering button AND the portal panel
            if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
                close();
            }
        };

        const onScrollOrResize = () => requestAnimationFrame(updatePosition);

        document.addEventListener('mousedown', onOutside);
        // Use capturing phase (true) for scroll so it triggers on any internal overflow container scroll
        window.addEventListener('resize', onScrollOrResize, { passive: true });
        window.addEventListener('scroll', onScrollOrResize, true);

        return () => {
            document.removeEventListener('mousedown', onOutside);
            window.removeEventListener('resize', onScrollOrResize, { passive: true });
            window.removeEventListener('scroll', onScrollOrResize, true);
        };
    }, [isOpen, updatePosition]);

    const handleTransition = async (newState) => {
        if (transitioning) return;
        setIsOpen(false);
        setTransitioning(true);
        try {
            await onTransition(color._id, newState);
        } finally {
            setTransitioning(false);
        }
    };

    // LOCKED: inline unlock only
    if (color.lifecycleState === 'LOCKED') {
        return (
            <div className="flex flex-col items-center gap-1.5">
                <LifecycleBadge state="LOCKED" />
                <button
                    onClick={() => handleTransition('ACTIVE')}
                    disabled={transitioning}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
                >
                    <LockClosedIcon className="w-3 h-3" />
                    {transitioning ? 'Unlocking…' : 'Unlock'}
                </button>
            </div>
        );
    }

    if (allowed.length === 0) return <LifecycleBadge state={color.lifecycleState} />;

    return (
        <div className="flex flex-col items-center gap-1.5">
            <LifecycleBadge state={color.lifecycleState} />

            {/* Trigger */}
            <button
                ref={btnRef}
                onClick={() => setIsOpen(p => !p)}
                disabled={transitioning}
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-150 disabled:opacity-40 ${isOpen
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50'
                    }`}
            >
                {transitioning ? (
                    <>
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Updating…
                    </>
                ) : (
                    <>
                        <Cog6ToothIcon className="w-3 h-3" />
                        Change
                        <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {/* Floating panel — rendered via Portal to completely escape table overflow-x-hidden container */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && panelPos && (
                        <motion.div
                            ref={panelRef}
                            initial={{ opacity: 0, scale: 0.95, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -6 }}
                            transition={{ duration: 0.14, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                zIndex: 999999,
                                width: PANEL_WIDTH,
                                ...(panelPos.bottom != null ? { bottom: panelPos.bottom } : { top: panelPos.top }),
                                left: panelPos.left
                            }}
                            className="bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-3.5 pt-3 pb-2.5 border-b border-slate-100 bg-slate-50/80">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] mb-1.5">Allowed Transitions</p>
                                <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentCfg.badge}`}>
                                        <span className={`w-1 h-1 rounded-full ${currentCfg.dot}`} />
                                        {currentCfg.label}
                                    </span>
                                    <ArrowRightIcon className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                    <span className="text-[10px] text-slate-400 font-medium">next state</span>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="py-1.5 px-1.5 space-y-0.5">
                                {allowed.map((ts) => {
                                    const tCfg = LIFECYCLE[ts];
                                    return (
                                        <button
                                            key={ts}
                                            onClick={() => handleTransition(ts)}
                                            className="w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors group text-left"
                                        >
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-[3px] ${tCfg.dot}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-700 group-hover:text-slate-900 leading-snug">{tCfg.label}</div>
                                                <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{tCfg.description}</div>
                                            </div>
                                            <ArrowRightIcon className="w-3 h-3 text-slate-200 group-hover:text-slate-400 flex-shrink-0 mt-[3px] transition-colors" />
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

// ─── TOOLBAR DROPDOWN ─────────────────────────────────────────────────────────

const CustomDropdown = ({ label, value, options, onChange, icon: Icon, color = 'indigo' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    const selected = options.find(o => o.value === value) || options[0];
    const cls = { purple: 'text-purple-500', pink: 'text-pink-500', indigo: 'text-indigo-500' }[color] || 'text-indigo-500';

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div className="flex flex-col h-full justify-center" ref={ref}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{label}</label>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-2.5 pl-3.5 pr-9 py-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
                >
                    {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${cls}`} />}
                    <span className="truncate">{selected.label}</span>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: 5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.98 }}
                            transition={{ duration: 0.13 }}
                            className="absolute z-30 w-full mt-1.5 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 py-1 origin-top"
                        >
                            {options.map((opt) => (
                                <li key={opt.value}>
                                    <button
                                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-bold transition-colors ${value === opt.value ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                                    >
                                        <span>{opt.label}</span>
                                        {value === opt.value && <CheckIcon className={`w-3.5 h-3.5 ${cls}`} />}
                                    </button>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const ColorManagement = () => {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 8;

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedColor, setSelectedColor] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    // Multi-select bulk state
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleRowSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const clearSelection = () => setSelectedIds([]);

    // Ref for synchronous snapshot capture across async lifecycle transitions
    const snapshotRef = useRef(null);

    // ── DATA FETCHING (Architecturally Hardened) ──
    const loadColors = useCallback(async (signal) => {
        setLoading(true);
        try {
            const params = { page: currentPage, limit: itemsPerPage, sort: sortOrder };
            if (filterStatus !== 'all') params.lifecycleState = filterStatus;
            if (debouncedSearch) params.search = debouncedSearch;

            const res = await colorAPI.getAll({ ...params, signal });
            const rd = res?.data || res || {};
            const arr = Array.isArray(rd.data) ? rd.data : (Array.isArray(rd) ? rd : []);

            setColors(arr);
            setTotalPages(rd.pagination?.pages || 1);
            setTotalItems(rd.pagination?.total || arr.length);
        } catch (err) {
            if (err.name === 'CanceledError' || err.name === 'AbortError') return;
            toast.error(err.response?.data?.message || 'Failed to load colors');
            setColors([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterStatus, sortOrder, debouncedSearch]);

    // Single source of truth for loading: watch state changes
    useEffect(() => {
        const controller = new AbortController();
        loadColors(controller.signal);
        return () => controller.abort();
    }, [loadColors]);

    // Track filter/search changes to reset page to 1 (Deterministic)
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchTerm); }, 450);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (currentPage !== 1) setCurrentPage(1);
    }, [filterStatus, debouncedSearch, sortOrder]);

    // Optimistic lifecycle transition — concurrency-safe via snapshotRef
    const handleLifecycleTransition = useCallback(async (id, newState) => {
        setColors(curr => {
            snapshotRef.current = curr.map(c => ({ ...c })); // Capture synchronously in setter
            return curr.map(c => c._id === id
                ? { ...c, lifecycleState: newState, isActive: newState === 'ACTIVE' }
                : c);
        });

        const snapshot = snapshotRef.current;
        const color = snapshot?.find(c => c._id === id);

        try {
            if (color?.lifecycleState === 'ARCHIVED' && newState === 'DRAFT') {
                await colorAPI.restore(id);
            } else {
                await colorAPI.update(id, { lifecycleState: newState });
            }
            toast.success(`Moved to ${LIFECYCLE[newState]?.label ?? newState}`);
        } catch (err) {
            if (snapshot) setColors(snapshot); // Guarded revert
            toast.error(err.response?.data?.message || 'Transition failed — reverted.');
        }
    }, []); // Empty deps: functional update + ref = no stale closures

    const handleCopyHex = (hex) => {
        navigator.clipboard.writeText(hex);
        toast.success(`Copied ${hex}`, { icon: '📋' });
    };

    const handleBulkArchive = () => {
        customConfirm(`Archive ${selectedIds.length} colors?`, async () => {
            await Promise.allSettled(selectedIds.map(id => colorAPI.update(id, { lifecycleState: 'ARCHIVED' })));
            toast.success(`Archived ${selectedIds.length} colors`);
            clearSelection();
            loadColors(new AbortController().signal);
        }, 'Archive', 'bg-amber-600 hover:bg-amber-700');
    };

    const handleBulkLock = () => {
        customConfirm(`Lock ${selectedIds.length} colors?`, async () => {
            await Promise.allSettled(selectedIds.map(id => colorAPI.update(id, { lifecycleState: 'LOCKED' })));
            toast.success(`Locked ${selectedIds.length} colors`);
            clearSelection();
            loadColors(new AbortController().signal);
        }, 'Lock', 'bg-slate-800 hover:bg-slate-900');
    };

    const handleCreate = () => { setFormData(EMPTY_FORM); setSelectedColor(null); setModalMode('create'); setShowModal(true); };

    const handleEdit = (color) => {
        if (color.lifecycleState === 'LOCKED') {
            toast.error('LOCKED — unlock first.', { icon: '🔒' });
            return;
        }
        setFormData({
            name: color.name,
            displayName: color.displayName || color.name,
            code: color.code || '',
            hexCode: normalizeHex(color.hexCode),
            colorFamily: color.colorFamily || '',
            visualCategory: color.visualCategory || 'SOLID',
            lifecycleState: color.lifecycleState || 'DRAFT',
            priority: color.priority || 0,
            description: color.description || ''
        });
        setSelectedColor(color);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; // Prevent double-submit
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                hexCode: normalizeHex(formData.hexCode),
                code: formData.code?.trim().toUpperCase()
            };

            if (modalMode === 'create') {
                await colorAPI.create(payload);
                toast.success('Color created');
            } else {
                await colorAPI.update(selectedColor._id, payload);
                toast.success('Color updated');
            }
            setShowModal(false);
            loadColors(new AbortController().signal); // Fresh signal — no cancellation needed
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id, isArchived) => {
        const msg = isArchived ? 'Permanently delete this color? This cannot be undone.' : 'Archive this color?';
        const configBtn = isArchived ? 'Delete' : 'Archive';
        const configColor = isArchived ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700';

        customConfirm(msg, async () => {
            try {
                await colorAPI.delete(id);
                toast.success(isArchived ? 'Permanently Deleted' : 'Archived');
                loadColors(new AbortController().signal);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed');
            }
        }, configBtn, configColor);
    };

    const handleRestore = (id) => {
        customConfirm('Restore this color back to DRAFT state?', async () => {
            try {
                await colorAPI.restore(id);
                toast.success('Color Restored');
                loadColors(new AbortController().signal);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to restore');
            }
        }, 'Restore', 'bg-indigo-600 hover:bg-indigo-700');
    };

    const statusOptions = [
        { value: 'all', label: 'All States' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'DEPRECATED', label: 'Deprecated' },
        { value: 'LOCKED', label: 'Locked' },
        { value: 'ARCHIVED', label: 'Archived' },
    ];
    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'name', label: 'Name A–Z' },
        { value: 'priority', label: 'By Priority' },
    ];

    const renderPaginationNumbers = () => {
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
            {/* Bulk action floating bar */}
            <BulkActionBar
                selectedIds={selectedIds}
                onClear={clearSelection}
                onBulkArchive={handleBulkArchive}
                onBulkLock={handleBulkLock}
            />
            {/* Header */}
            <div className="px-8 py-7">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Color Master</h1>
                <p className="text-slate-400 text-sm mt-0.5 font-medium">Enterprise color registry with lifecycle governance</p>
            </div>

            <div className="px-8 space-y-5">
                {/* Toolbar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Total Colors</p>
                            <p className="text-3xl font-black text-slate-900">{totalItems}</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                            <SwatchIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <CustomDropdown label="Filter State" value={filterStatus} options={statusOptions} onChange={setFilterStatus} icon={FunnelIcon} color="purple" />
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <CustomDropdown label="Sort Order" value={sortOrder} options={sortOptions} onChange={setSortOrder} icon={ArrowsUpDownIcon} color="pink" />
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Actions</p>
                        <button onClick={handleCreate} className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-fuchsia-500/20">
                            <PlusIcon className="w-4 h-4" /> Add Color
                        </button>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Table top bar */}
                    <div className="px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-black text-slate-900">Color Registry</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">{totalItems} records</p>
                        </div>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search name, hex, SKU…"
                                className="pl-10 pr-4 py-2.5 w-64 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
                                <tr className="border-b border-slate-100">
                                    <th className="px-4 py-3.5 w-10">
                                        <input type="checkbox"
                                            checked={selectedIds.length === colors.length && colors.length > 0}
                                            onChange={() => selectedIds.length === colors.length ? clearSelection() : setSelectedIds(colors.map(c => c._id))}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 cursor-pointer" />
                                    </th>
                                    <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Identity</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Hex Code</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Family</th>
                                    <th className="px-6 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Lifecycle</th>
                                    <th className="px-6 py-3.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: itemsPerPage }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-50 animate-pulse">
                                            <td className="px-4 py-5"><div className="w-4 h-4 bg-slate-100 rounded" /></td>
                                            <td className="px-4 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" /><div className="space-y-2"><div className="h-3 bg-slate-100 rounded w-28" /><div className="h-2.5 bg-slate-100 rounded w-16" /></div></div></td>
                                            <td className="px-6 py-5"><div className="h-8 bg-slate-100 rounded-lg w-28" /></td>
                                            <td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded w-16" /></td>
                                            <td className="px-6 py-5"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto" /></td>
                                            <td className="px-6 py-5" />
                                        </tr>
                                    ))
                                ) : colors.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-24 text-center">
                                            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                                                <SwatchIcon className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600">No colors found</p>
                                            <p className="text-xs text-slate-400 mt-1">Add a color to begin building your palette.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    colors.map((color) => {
                                        const isLocked = color.lifecycleState === 'LOCKED';
                                        const isArchived = color.lifecycleState === 'ARCHIVED';
                                        const isDeprecated = color.lifecycleState === 'DEPRECATED';
                                        const safeHex = isSafeHex(color.hexCode) ? color.hexCode : '#94A3B8';
                                        const canDelete = ['DRAFT', 'ARCHIVED'].includes(color.lifecycleState);

                                        return (
                                            <tr
                                                key={color._id}
                                                className={`group border-b border-slate-50 last:border-0 transition-colors ${isArchived ? 'opacity-40 bg-slate-50/50' : isDeprecated ? 'bg-amber-50/20 hover:bg-amber-50/30' : selectedIds.includes(color._id) ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}
                                            >
                                                {/* Select */}
                                                <td className="px-4 py-4">
                                                    <input type="checkbox"
                                                        checked={selectedIds.includes(color._id)}
                                                        onChange={() => toggleRowSelect(color._id)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 cursor-pointer" />
                                                </td>
                                                {/* Identity */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="relative w-10 h-10 rounded-xl flex-shrink-0 shadow-sm ring-1 ring-slate-200/80 overflow-hidden" style={{ backgroundColor: safeHex }}>
                                                            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-black/10 pointer-events-none" />
                                                            {isLocked && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                    <LockClosedIcon className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-slate-900 leading-snug truncate">{color.name}</div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                {color.code && <span className="text-[10px] font-mono font-bold text-slate-400">{color.code}</span>}
                                                                {color.code && <span className="text-slate-300">·</span>}
                                                                <span className="text-[10px] text-slate-400 font-semibold">P{color.priority ?? 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Hex */}
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleCopyHex(color.hexCode)}
                                                        className="group/hex inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="w-3 h-3 rounded-full ring-1 ring-black/10 flex-shrink-0" style={{ backgroundColor: safeHex }} />
                                                        <span className="text-xs font-mono font-bold text-slate-600 tracking-wider">{color.hexCode?.toUpperCase()}</span>
                                                        <ClipboardIcon className="w-3.5 h-3.5 text-slate-300 group-hover/hex:text-slate-500 transition-colors" />
                                                    </button>
                                                </td>

                                                {/* Family */}
                                                <td className="px-6 py-4">
                                                    {color.colorFamily && <div className="text-xs font-bold text-slate-600">{color.colorFamily}</div>}
                                                    {color.visualCategory && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{color.visualCategory}</div>}
                                                </td>

                                                {/* Lifecycle — transition panel is fixed-position, won't scroll */}
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <LifecycleTransitionPanel color={color} onTransition={handleLifecycleTransition} />
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isArchived ? (
                                                            <>
                                                                <button onClick={() => handleRestore(color._id)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Restore to Draft">
                                                                    <ArrowUturnLeftIcon className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(color._id, true)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Permanently Delete">
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {isLocked ? (
                                                                    <div className="p-2 rounded-lg text-red-200 cursor-not-allowed" title="Locked">
                                                                        <LockClosedIcon className="w-4 h-4" />
                                                                    </div>
                                                                ) : (
                                                                    <button onClick={() => handleEdit(color)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                                                                        <PencilIcon className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {canDelete ? (
                                                                    <>
                                                                        <button onClick={() => handleDelete(color._id, false)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Move to Archive">
                                                                            <ArchiveBoxIcon className="w-4 h-4" />
                                                                        </button>
                                                                        <button onClick={() => handleDelete(color._id, true)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Permanently Delete">
                                                                            <TrashIcon className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="p-2 text-slate-200 cursor-not-allowed" title="Use lifecycle panel to archive">
                                                                            <ArchiveBoxIcon className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="p-2 text-slate-200 cursor-not-allowed" title="Unlock color to delete">
                                                                            <TrashIcon className="w-4 h-4" />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalItems > 0 && (
                        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-medium">
                                <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span>
                                {' – '}
                                <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
                                {' of '}
                                <span className="font-bold text-slate-700">{totalItems}</span>
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeftIcon className="w-3 h-3" /> Prev
                                </button>
                                {renderPaginationNumbers().map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === p ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                >
                                    Next <ChevronRightIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL ── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 14 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 14 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black text-slate-900">{modalMode === 'create' ? 'New Color' : 'Edit Color'}</h2>
                                    {modalMode === 'edit' && selectedColor?.code && (
                                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">SKU: {selectedColor.code}</p>
                                    )}
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[78vh]">
                                {/* Identity */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Identity</span>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Color Name <span className="text-red-400">*</span></label>
                                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, displayName: e.target.value })} placeholder="Midnight Blue" required className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">SKU {modalMode === 'create' && <span className="text-slate-400 font-normal">(auto)</span>}</label>
                                            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} readOnly={modalMode === 'edit'} placeholder={modalMode === 'create' ? 'BLU-001' : ''} className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all ${modalMode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Visual */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Visual</span>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>
                                    <div className="space-y-3.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Hex Color <span className="text-red-400">*</span></label>
                                            <div className="flex gap-3">
                                                <div className="relative w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden shadow-sm border border-slate-200 cursor-pointer" style={{ backgroundColor: isSafeHex(formData.hexCode) ? formData.hexCode : '#3B82F6' }}>
                                                    <input type="color" value={isSafeHex(normalizeHex(formData.hexCode)) ? normalizeHex(formData.hexCode) : '#3B82F6'} onChange={(e) => setFormData({ ...formData, hexCode: normalizeHex(e.target.value) })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" />
                                                </div>
                                                <input type="text" value={formData.hexCode} onChange={(e) => setFormData({ ...formData, hexCode: e.target.value.toUpperCase() })} placeholder="#3B82F6" maxLength={7} className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all" />
                                            </div>
                                            {/* WCAG Contrast Warning */}
                                            {(() => {
                                                const w = getWcagWarning(normalizeHex(formData.hexCode));
                                                if (!w) return null;
                                                return (
                                                    <div className={`mt-2 flex items-start gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold leading-snug ${w.level === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                        <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                        {w.msg}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3.5">
                                            <div>
                                                <ModalDropdown
                                                    label="Color Family"
                                                    value={formData.colorFamily}
                                                    onChange={(v) => setFormData({ ...formData, colorFamily: v })}
                                                    options={[{ value: '', label: 'Auto-Detect' }, ...['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'GREY', 'BROWN', 'PINK', 'BEIGE'].map(f => ({ value: f, label: f }))]}
                                                />
                                            </div>
                                            <div>
                                                <ModalDropdown
                                                    label="Visual Style"
                                                    value={formData.visualCategory}
                                                    onChange={(v) => setFormData({ ...formData, visualCategory: v })}
                                                    options={['SOLID', 'METALLIC', 'PATTERN', 'GRADIENT', 'NEON', 'MATTE', 'GLOSSY'].map(c => ({ value: c, label: c }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Governance */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Governance</span>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3.5">
                                        {modalMode === 'edit' && (
                                            <div>
                                                <ModalDropdown
                                                    label="Lifecycle State"
                                                    value={formData.lifecycleState}
                                                    onChange={(v) => setFormData({ ...formData, lifecycleState: v })}
                                                    options={Object.entries(LIFECYCLE).filter(([s]) => s !== 'ARCHIVED').map(([s, cfg]) => ({ value: s, label: cfg.label }))}
                                                />
                                            </div>
                                        )}
                                        <div className={modalMode === 'create' ? 'col-span-2' : ''}>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Priority</label>
                                            <input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all" />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-1 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isSubmitting && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
                                        {modalMode === 'create' ? 'Create Color' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ColorManagement;
