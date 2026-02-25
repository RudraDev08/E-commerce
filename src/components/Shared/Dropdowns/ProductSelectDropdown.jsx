import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MagnifyingGlassIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

const ProductSelectDropdown = ({ value, onChange, label = "Select Product", disabled = false }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const dropdownRef = useRef(null);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Adjust API endpoint as needed
                const res = await axios.get('http://localhost:5000/api/products', {
                    params: { search, limit: 10, status: 'active' }
                });
                setProducts(res.data.data || []);
            } catch (err) {
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen, search]);

    // Handle initial value
    useEffect(() => {
        if (value && !selectedProduct) {
            // If we have an ID but no object, we might need to fetch the single product
            // For now, assuming value might be the product object or we just show "Selected"
            // Best practice: Pass full object if possible, or fetch by ID here.
            // We'll trust the parent to pass the product object or we fetch it.
            if (typeof value === 'object') {
                setSelectedProduct(value);
            } else {
                // Fetch single product by ID
                axios.get(`http://localhost:5000/api/products/${value}`)
                    .then(res => setProducts(res.data.data || res.data || []));
            }
        } else if (!value) {
            setSelectedProduct(null);
        }
    }, [value]);

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

    const handleSelect = (product) => {
        setSelectedProduct(product);
        onChange(product._id); // Return ID to parent
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-white border ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200'} rounded-xl px-4 py-3 text-left flex items-center justify-between transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={disabled}
            >
                {selectedProduct ? (
                    <div className="flex items-center gap-3">
                        {selectedProduct.image ? (
                            <img src={`http://localhost:5000/uploads/${selectedProduct.image.split(/[/\\]/).pop()}`} className="w-8 h-8 rounded-md object-cover bg-slate-100" />
                        ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">IMG</div>
                        )}
                        <div>
                            <p className="text-sm font-bold text-slate-900">{selectedProduct.name}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{selectedProduct.category?.name || 'No Category'}</p>
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-400 text-sm font-medium">Search for a product...</span>
                )}
                <ChevronUpDownIcon className="w-5 h-5 text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-down">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Type to search..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                        {loading && products.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                        ) : products.length > 0 ? (
                            products.map(product => (
                                <button
                                    key={product._id}
                                    onClick={() => handleSelect(product)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${selectedProduct?._id === product._id ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'}`}
                                >
                                    {product.image ? (
                                        <img src={`http://localhost:5000/uploads/${product.image.split(/[/\\]/).pop()}`} className="w-10 h-10 rounded-md object-cover bg-white border border-slate-100" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">IMG</div>
                                    )}
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${selectedProduct?._id === product._id ? 'text-indigo-700' : 'text-slate-900'}`}>{product.name}</p>
                                        <p className="text-xs text-slate-500">{product.sku}</p>
                                    </div>
                                    {selectedProduct?._id === product._id && <CheckIcon className="w-5 h-5 text-indigo-600" />}
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm font-bold text-slate-900">No products found</p>
                                <p className="text-xs text-slate-500 mt-1">Try a different search term</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductSelectDropdown;
