import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SizeMultiSelectDropdown = ({ value = [], onChange, label = "Select Sizes" }) => {
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch Active Sizes
    useEffect(() => {
        const fetchSizes = async () => {
            setLoading(true);
            try {
                const res = await axios.get('http://localhost:5000/api/sizes', {
                    params: { status: 'active', limit: 100 }
                });
                setSizes(res.data.data || []);
            } catch (err) {
                console.error("Failed to load sizes", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSizes();
    }, []);

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

    const toggleSize = (sizeId) => {
        const newSelection = value.includes(sizeId)
            ? value.filter(id => id !== sizeId)
            : [...value, sizeId];
        onChange(newSelection);
    };

    const removeSize = (e, sizeId) => {
        e.stopPropagation();
        onChange(value.filter(id => id !== sizeId));
    };

    const getSelectedObjects = () => {
        return sizes.filter(s => value.includes(s._id));
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`min-h-[50px] w-full bg-white border cursor-pointer transition-all duration-200 rounded-xl px-4 py-3 flex flex-wrap gap-2 items-center justify-between ${isOpen
                    ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                    }`}
            >
                <div className="flex flex-wrap gap-2 flex-1">
                    {value.length === 0 ? (
                        <span className="text-slate-400 text-sm font-medium">Select available sizes...</span>
                    ) : (
                        getSelectedObjects().map(size => (
                            <span key={size._id} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-100 group transition-all">
                                {size.code}
                                <button onClick={(e) => removeSize(e, size._id)} className="text-indigo-400 group-hover:text-indigo-600 transition-colors">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </span>
                        ))
                    )}
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-slide-down origin-top">
                    <div className="p-4 grid grid-cols-3 gap-3 max-h-72 overflow-y-auto">
                        {loading ? (
                            <div className="col-span-3 text-center py-6 text-slate-400 text-sm">Loading sizes...</div>
                        ) : (
                            sizes.map(size => {
                                const isSelected = value.includes(size._id);
                                return (
                                    <button
                                        key={size._id}
                                        type="button"
                                        onClick={() => toggleSize(size._id)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${isSelected
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <span className={`text-xl font-bold tracking-tight mb-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                            {size.code}
                                        </span>
                                        <span className={`text-xs font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                            {size.name}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {sizes.length === 0 && !loading && (
                        <div className="p-4 text-center text-sm text-slate-500">No active sizes found.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SizeMultiSelectDropdown;
