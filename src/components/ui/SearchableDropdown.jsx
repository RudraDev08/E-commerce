import { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChevronDownIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

const SearchableDropdown = ({
    label = 'Select…',
    value = '',
    options = [],
    onChange,
    onClear,
    icon: Icon,
    clearable = true,
    disabled = false,
    className = '',
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(-1);

    const wrapRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const normalised = options.map(o =>
        typeof o === 'string' ? { value: o, label: o } : o
    );

    const filtered = query
        ? normalised.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : normalised;

    const selected = normalised.find(o => o.value === value);
    const hasValue = !!value;

    useEffect(() => {
        const handler = e => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
                setFocused(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
            setFocused(-1);
        }
    }, [open]);

    useEffect(() => {
        if (focused >= 0 && listRef.current) {
            const item = listRef.current.children[focused];
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [focused]);

    const openPanel = () => { if (!disabled) setOpen(true); };
    const closePanel = () => { setOpen(false); setQuery(''); setFocused(-1); };

    const select = useCallback(val => {
        onChange?.(val);
        closePanel();
    }, [onChange]);

    const handleClear = e => {
        e.stopPropagation();
        onClear?.();
        onChange?.('');
        closePanel();
    };

    const handleKeyDown = e => {
        if (!open) {
            if (e.key === 'Enter' || e.key === ' ') openPanel();
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocused(f => Math.min(f + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocused(f => Math.max(f - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (focused >= 0 && filtered[focused]) select(filtered[focused].value);
                break;
            case 'Escape':
                closePanel();
                break;
            default:
                break;
        }
    };

    return (
        <div ref={wrapRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>

            {/* ── Trigger ─────────────────────────────────────────────── */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => (open ? closePanel() : openPanel())}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={label}
                className={`
                    inline-flex items-center gap-2 h-10 px-4
                    border rounded-lg text-sm font-medium
                    transition-all cursor-pointer whitespace-nowrap
                    focus:outline-none focus:ring-2 focus:ring-indigo-400/40
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${hasValue
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    }
                    ${open ? 'ring-2 ring-indigo-400/40 border-indigo-400' : ''}
                `}
            >
                {Icon && <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />}
                <span className="max-w-[120px] truncate">
                    {selected ? selected.label : label}
                </span>

                {clearable && hasValue ? (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={handleClear}
                        onKeyDown={e => { if (e.key === 'Enter') handleClear(e); }}
                        aria-label="Clear filter"
                        className="ml-1 p-0.5 rounded-md hover:bg-indigo-200/60 transition-colors"
                    >
                        <XMarkIcon className="w-3.5 h-3.5" />
                    </span>
                ) : (
                    <ChevronDownIcon
                        className={`w-4 h-4 flex-shrink-0 opacity-50 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {/* ── Floating Panel ───────────────────────────────────────── */}
            {open && (
                <div
                    role="listbox"
                    aria-label={label}
                    className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                >
                    {/* Search */}
                    <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 z-10">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setFocused(-1); }}
                                placeholder={`Search ${label.toLowerCase()}…`}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300 transition-all"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <ul ref={listRef} className="max-h-64 overflow-y-auto py-1">
                        {/* Clear option */}
                        {clearable && hasValue && (
                            <>
                                <li
                                    role="option"
                                    aria-selected={false}
                                    onClick={() => select('')}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 cursor-pointer transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                    Clear selection
                                </li>
                                <div className="border-b border-slate-100 mx-3" />
                            </>
                        )}

                        {filtered.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-slate-400 text-center">
                                No matches found
                            </li>
                        ) : (
                            filtered.map((opt, i) => {
                                const isActive = opt.value === value;
                                const isFocused = focused === i;
                                return (
                                    <li
                                        key={opt.value}
                                        role="option"
                                        aria-selected={isActive}
                                        onClick={() => select(opt.value)}
                                        className={`
                                            flex items-center justify-between gap-2 px-4 py-2.5
                                            text-sm cursor-pointer transition-colors
                                            ${isActive
                                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                : 'text-slate-700 font-medium'
                                            }
                                            ${isFocused
                                                ? 'bg-indigo-100'
                                                : 'hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isActive && (
                                            <CheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
