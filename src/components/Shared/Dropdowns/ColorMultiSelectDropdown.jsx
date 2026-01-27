import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ColorMultiSelectDropdown = ({ value = [], onChange, label = "Select Colors" }) => {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch Active Colors
    useEffect(() => {
        const fetchColors = async () => {
            setLoading(true);
            try {
                // Adjust endpoint if needed
                const res = await axios.get('http://localhost:5000/api/colors', {
                    params: { status: 'active', limit: 100 }
                });
                setColors(res.data.data || []);
            } catch (err) {
                console.error("Failed to load colors", err);
            } finally {
                setLoading(false);
            }
        };
        fetchColors();
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

    const toggleColor = (colorId) => {
        const newSelection = value.includes(colorId)
            ? value.filter(id => id !== colorId)
            : [...value, colorId];
        onChange(newSelection);
    };

    const removeColor = (e, colorId) => {
        e.stopPropagation();
        onChange(value.filter(id => id !== colorId));
    };

    const getSelectedObjects = () => {
        return colors.filter(c => value.includes(c._id));
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
                        <span className="text-slate-400 text-sm font-medium">Select available colors...</span>
                    ) : (
                        getSelectedObjects().map(color => (
                            <span key={color._id} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-100 group transition-all">
                                <span
                                    className="w-4 h-4 rounded-full border border-indigo-200 shadow-sm"
                                    style={{ backgroundColor: color.hexCode }}
                                />
                                {color.name}
                                <button onClick={(e) => removeColor(e, color._id)} className="text-indigo-400 hover:text-red-500 transition-colors ml-1">
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
                    <div className="p-3 max-h-72 overflow-y-auto space-y-1">
                        {loading ? (
                            <div className="p-6 text-center text-slate-400 text-sm">Loading colors...</div>
                        ) : (
                            colors.map(color => {
                                const isSelected = value.includes(color._id);
                                return (
                                    <button
                                        key={color._id}
                                        type="button"
                                        onClick={() => toggleColor(color._id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${isSelected
                                            ? 'bg-indigo-50 border border-indigo-100'
                                            : 'hover:bg-slate-50 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-8 h-8 rounded-full border border-slate-200 shadow-sm ring-2 ring-white"
                                                style={{ backgroundColor: color.hexCode }}
                                            />
                                            <div className="text-left">
                                                <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {color.name}
                                                </p>
                                                <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                                                    {color.hexCode}
                                                </p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white">
                                                <span className="font-bold text-sm">✓</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {colors.length === 0 && !loading && (
                        <div className="p-4 text-center text-sm text-slate-500">No active colors found.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ColorMultiSelectDropdown;
