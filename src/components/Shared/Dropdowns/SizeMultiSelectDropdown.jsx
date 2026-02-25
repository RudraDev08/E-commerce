import { useState, useEffect, useRef } from 'react';
import { sizeAPI } from '../../../Api/api';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SizeMultiSelectDropdown = ({ value = [], onChange, label = "Select Sizes" }) => {
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch Active Sizes with AbortController for cleanup
    useEffect(() => {
        const controller = new AbortController();
        const fetchSizes = async () => {
            setLoading(true);
            try {
                // Enterprise API returns { data: [], pageInfo: ... }
                // Explicitly requesting active sizes to prevent archived/draft usage
                const res = await sizeAPI.getAll({
                    lifecycleState: 'ACTIVE',
                    limit: 100,
                    signal: controller.signal // Pass signal to axios if supported, otherwise ignore
                });

                if (controller.signal.aborted) return;

                const data = res.data?.data || [];

                // Map Enterprise fields (displayName, value) to Component internal fields (name, code)
                // This preserves backward compatibility with parent components expecting 'code' and 'name'
                const mappedSizes = data.map(s => ({
                    _id: s._id,
                    name: s.displayName || s.value,
                    code: s.value
                }));

                setSizes(mappedSizes);
            } catch (err) {
                if (controller.signal.aborted) return;
                toast.error("Failed to retrieve sizes");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchSizes();

        return () => controller.abort();
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
                onClick={() => !loading && setIsOpen(!isOpen)}
                className={`min-h-[50px] w-full bg-white border cursor-pointer transition-all duration-200 rounded-xl px-4 py-3 flex flex-wrap gap-2 items-center justify-between ${isOpen
                    ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                    } ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
                <div className="flex flex-wrap gap-2 flex-1">
                    {loading ? (
                        <span className="text-slate-400 text-sm font-medium animate-pulse">Loading sizes...</span>
                    ) : value.length === 0 ? (
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

            {isOpen && !loading && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-slide-down origin-top">
                    <div className="p-4 grid grid-cols-3 gap-3 max-h-72 overflow-y-auto">
                        {sizes.map(size => {
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
                        })}
                        {sizes.length === 0 && (
                            <div className="col-span-3 text-center py-6 text-slate-400 text-sm">No active sizes found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SizeMultiSelectDropdown;
