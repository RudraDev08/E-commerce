import { ChevronDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';

const StatusSelect = ({ value, onChange, label = "Status" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const options = [
        { value: 'active', label: 'Active', color: 'emerald', icon: CheckCircleIcon },
        { value: 'inactive', label: 'Inactive', color: 'slate', icon: XCircleIcon }
    ];

    const selectedOption = options.find(o => o.value === value) || options[0];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-left flex items-center justify-between hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full bg-${selectedOption.color}-500`}></span>
                    <span className="text-sm font-medium text-slate-700">{selectedOption.label}</span>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-100 py-1 animate-slide-down">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                        >
                            <opt.icon className={`w-5 h-5 text-${opt.color}-500`} />
                            <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatusSelect;
