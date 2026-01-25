import { useState, useEffect, useRef } from 'react';
import {
    ChevronDownIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    FolderIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { FolderIcon as FolderIconSolid } from '@heroicons/react/24/solid';

/**
 * Premium Category Selector Component
 * Features: Single/Multi-select, Search, Hierarchical, Keyboard accessible
 */
const CategorySelector = ({
    categories = [],
    selectedCategories = [],
    onChange,
    mode = 'single', // 'single' | 'multi'
    placeholder = 'Select category...',
    searchPlaceholder = 'Search categories...',
    disabled = false,
    loading = false,
    error = null,
    showCount = true,
    maxHeight = '320px',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter categories based on search
    const filterCategories = (cats, term) => {
        if (!term) return cats;

        return cats.filter(cat => {
            const matchesSearch = cat.name.toLowerCase().includes(term.toLowerCase());
            const hasMatchingChild = cat.children?.some(child =>
                child.name.toLowerCase().includes(term.toLowerCase())
            );
            return matchesSearch || hasMatchingChild;
        });
    };

    const filteredCategories = filterCategories(categories, searchTerm);

    // Toggle category selection
    const handleSelect = (category) => {
        if (mode === 'single') {
            onChange([category]);
            setIsOpen(false);
        } else {
            const isSelected = selectedCategories.some(c => c._id === category._id);
            if (isSelected) {
                onChange(selectedCategories.filter(c => c._id !== category._id));
            } else {
                onChange([...selectedCategories, category]);
            }
        }
    };

    // Toggle node expansion
    const toggleNode = (categoryId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedNodes(newExpanded);
    };

    // Clear all selections
    const handleClear = (e) => {
        e.stopPropagation();
        onChange([]);
    };

    // Check if category is selected
    const isSelected = (category) => {
        return selectedCategories.some(c => c._id === category._id);
    };

    // Render category item
    const renderCategory = (category, level = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedNodes.has(category._id);
        const selected = isSelected(category);

        return (
            <div key={category._id}>
                <div
                    className={`
            flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-150
            hover:bg-slate-50 rounded-lg
            ${selected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}
            ${level > 0 ? `ml-${level * 4}` : ''}
          `}
                    style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
                >
                    {/* Expand/Collapse Icon */}
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleNode(category._id);
                            }}
                            className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                            ) : (
                                <ChevronRightIcon className="w-4 h-4 text-slate-500" />
                            )}
                        </button>
                    )}

                    {/* Checkbox (Multi-select) */}
                    {mode === 'multi' && (
                        <div
                            onClick={() => handleSelect(category)}
                            className={`
                w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                ${selected
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'border-slate-300 hover:border-indigo-400'
                                }
              `}
                        >
                            {selected && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                    )}

                    {/* Category Icon */}
                    {selected ? (
                        <FolderIconSolid className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    ) : (
                        <FolderIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}

                    {/* Category Name */}
                    <div
                        onClick={() => handleSelect(category)}
                        className="flex-1 flex items-center justify-between"
                    >
                        <span className={`text-sm font-medium ${selected ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {category.name}
                        </span>

                        {/* Product Count */}
                        {showCount && category.productCount !== undefined && (
                            <span className="text-xs text-slate-400 ml-2">
                                ({category.productCount})
                            </span>
                        )}
                    </div>
                </div>

                {/* Render Children */}
                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {category.children.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Get display text
    const getDisplayText = () => {
        if (selectedCategories.length === 0) return placeholder;
        if (mode === 'single') return selectedCategories[0]?.name;
        return `${selectedCategories.length} selected`;
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg
          flex items-center justify-between gap-2
          text-sm font-medium text-slate-700
          transition-all duration-200
          hover:border-slate-300 hover:bg-slate-50
          focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}
        `}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FolderIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{getDisplayText()}</span>
                </div>

                <div className="flex items-center gap-1">
                    {selectedCategories.length > 0 && !disabled && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                    <ChevronDownIcon
                        className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Category List */}
                    <div
                        className="p-2 overflow-y-auto custom-scrollbar"
                        style={{ maxHeight }}
                    >
                        {loading ? (
                            <div className="py-8 text-center">
                                <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                <p className="mt-2 text-sm text-slate-500">Loading categories...</p>
                            </div>
                        ) : error ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="py-8 text-center">
                                <FolderIcon className="w-12 h-12 mx-auto text-slate-300" />
                                <p className="mt-2 text-sm font-medium text-slate-900">No categories found</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {searchTerm ? 'Try a different search term' : 'No categories available'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredCategories.map(category => renderCategory(category))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {mode === 'multi' && selectedCategories.length > 0 && (
                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">
                                {selectedCategories.length} selected
                            </span>
                            <button
                                onClick={handleClear}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategorySelector;
