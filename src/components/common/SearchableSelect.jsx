import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchableSelect = ({
    label,
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    required = false,
    disabled = false,
    loading = false,
    error = null,
    multiple = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get display label for selected value
    const getDisplayValue = () => {
        if (!value) return '';
        if (multiple) {
            // If value is array of IDs
            if (Array.isArray(value) && value.length > 0) {
                return `${value.length} selected`;
            }
            return '';
        }
        // Single value
        const selected = options.find(opt => opt._id === value || opt.value === value);
        return selected ? selected.name : '';
    };

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        if (multiple) {
            // Toggle selection for multiple mode
            const currentValues = Array.isArray(value) ? value : [];
            const optionId = option._id || option.value;

            let newValues;
            if (currentValues.includes(optionId)) {
                newValues = currentValues.filter(v => v !== optionId);
            } else {
                newValues = [...currentValues, optionId];
            }
            onChange(newValues);
        } else {
            // Single selection
            onChange(option._id || option.value);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const isSelected = (option) => {
        const optionId = option._id || option.value;
        if (multiple) {
            return Array.isArray(value) && value.includes(optionId);
        }
        return value === optionId;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    relative w-full cursor-default rounded-lg border bg-white py-2.5 pl-4 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm
                    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'}
                    ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <span className={`block truncate ${!value ? 'text-gray-400' : 'text-gray-900'}`}>
                    {getDisplayValue() || placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                </span>
            </button>

            {/* Error Message */}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-2">
                    {/* Search Input */}
                    <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-100">
                        <div className="relative">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full rounded-md border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <ul className="max-h-48 overflow-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <li className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500 italic text-center">
                                No results found
                            </li>
                        ) : (
                            filteredOptions.map((option) => (
                                <li
                                    key={option._id || option.value}
                                    className={`
                                        relative cursor-pointer select-none py-2.5 pl-3 pr-9 
                                        ${isSelected(option) ? 'bg-indigo-50 text-indigo-900 font-medium' : 'text-gray-900'}
                                        hover:bg-indigo-50 hover:text-indigo-900 transition-colors duration-150
                                    `}
                                    onClick={() => handleSelect(option)}
                                >
                                    <div className="flex items-center">
                                        {/* Optional Image/Icon for Brand/Category */}
                                        {option.image || option.logo ? (
                                            <img
                                                src={option.image || option.logo}
                                                alt=""
                                                className="h-6 w-6 flex-shrink-0 rounded-full object-cover mr-3 border border-gray-200"
                                            />
                                        ) : null}
                                        <span className={`block truncate ${isSelected(option) ? 'font-semibold' : 'font-normal'}`}>
                                            {option.name || option.label}
                                        </span>
                                    </div>

                                    {isSelected(option) ? (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                    ) : null}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
