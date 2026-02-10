import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const CustomDropdown = ({ label, value, options, onChange, icon: Icon, color = "indigo" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const colorStyles = {
        purple: "text-purple-600 ring-purple-500/20 group-hover:ring-purple-500/40",
        pink: "text-pink-600 ring-pink-500/20 group-hover:ring-pink-500/40",
        indigo: "text-indigo-600 ring-indigo-500/20 group-hover:ring-indigo-500/40"
    };

    const activeColor = colorStyles[color] || colorStyles.indigo;

    return (
        <div className="flex flex-col h-full justify-end min-w-[220px]" ref={containerRef}>
            {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 ml-1">
                {label}
            </label>}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full relative flex items-center gap-3 pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 ${isOpen ? 'ring-4 ring-slate-100 border-slate-300' : 'shadow-sm'}`}
                >
                    {Icon && <Icon className={`w-5 h-5 transition-colors ${isOpen ? activeColor.split(' ')[0] : 'text-slate-400'}`} />}
                    <span className="truncate">{selectedOption?.label}</span>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-slate-600' : ''}`} />
                    </span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 focus:outline-none overflow-hidden origin-top right-0"
                        >
                            {options.map((option) => (
                                <li key={option.value} className="px-2">
                                    <button
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${value === option.value
                                            ? 'bg-slate-50 text-slate-900'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            {option.icon && <span className="text-slate-400">{option.icon}</span>}
                                            {option.label}
                                        </span>
                                        {value === option.value && (
                                            <div className={`w-1.5 h-1.5 rounded-full ${color === 'purple' ? 'bg-purple-500' : color === 'pink' ? 'bg-pink-500' : 'bg-indigo-500'}`} />
                                        )}
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

export default CustomDropdown;
