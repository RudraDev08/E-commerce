import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/productApi';
import { getCategories } from '../api/categoryApi';
import { getBrands } from '../api/brandApi';
import { getDiscoveryFilters } from '../api/discoveryApi';
import { getAttributeTypes } from '../api/attributeApi';
import ProductCard from '../components/product/ProductCard';
import './ProductListingPage.css';

const ProductListingPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [attributeTypes, setAttributeTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);

    // Filter states
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        brand: searchParams.get('brand') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        search: searchParams.get('search') || '',
    });

    // Sorting and pagination
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [itemsPerPage] = useState(12);

    // Mobile filter toggle
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadFiltersData();
    }, [filters.category]); // Reload facets when category changes (though usually handled by discovery logic)

    useEffect(() => {
        loadProducts();
        updateURL();
    }, [filters, sortBy, currentPage]);

    const normalizeDiscoveryFilters = (rawData) => {
        if (!rawData) return [];

        // Strategy 1: Already in the legacy array format
        if (Array.isArray(rawData)) {
            // Ensure we strictly only return objects where values is an array
            return rawData.filter(item => Array.isArray(item.values));
        }

        // Strategy 2: New grouped Object format { colors: [], sizes: [] }
        if (typeof rawData === 'object') {
            const normalized = [];
            for (const [key, values] of Object.entries(rawData)) {

                // Only map keys where the API provided an actual array of values
                if (Array.isArray(values) && values.length > 0) {
                    normalized.push({
                        attributeType: {
                            _id: `dynamic-${key}`,
                            slug: key,
                            name: key.charAt(0).toUpperCase() + key.slice(1)
                        },
                        values: values
                    });
                }
            }
            return normalized;
        }

        // Strategy 3: Complete fallback (string, number, boolean)
        return [];
    };

    const loadFiltersData = async () => {
        try {
            // Context for Discovery
            const context = {
                category: filters.category,
                // Add more context if needed for narrowing filters
            };

            const [categoriesRes, brandsRes, discoveryRes] = await Promise.all([
                getCategories(),
                getBrands(),
                getDiscoveryFilters(context)
            ]);

            // Ensure categories is strictly an array
            let categoriesData = categoriesRes.data?.data || categoriesRes.data || [];
            if (!Array.isArray(categoriesData)) categoriesData = [];
            setCategories(categoriesData);

            // Ensure brands is strictly an array
            let brandsData = brandsRes.data?.data || brandsRes.data || [];
            if (!Array.isArray(brandsData)) brandsData = [];
            setBrands(brandsData);

            // 🔧 FIX: Safely normalize dynamic filters
            // Using nullish coalescing operator strictly as requested
            const rawDynamicFilters = discoveryRes.data?.data ?? discoveryRes.data ?? {};
            const normalizedFilters = normalizeDiscoveryFilters(rawDynamicFilters);
            setAttributeTypes(normalizedFilters);

        } catch (error) {
            console.error('Error loading filters:', error);
            // On error, default to empty arrays to prevent crashes
            setCategories([]);
            setBrands([]);
            setAttributeTypes([]);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);

            const params = {
                page: currentPage,
                limit: itemsPerPage,
                sort: getSortField(sortBy),
                order: getSortOrder(sortBy),
            };

            if (filters.category) params.category = filters.category;
            if (filters.brand) params.brand = filters.brand;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;
            if (filters.search) params.search = filters.search;

            // Pass dynamic filters
            // Pass dynamic filters
            // attributeTypes here is the Groups Array from Discovery
            attributeTypes.forEach(group => {
                const slug = group.attributeType.slug;
                if (filters[slug]) {
                    params[slug] = filters[slug];
                }
            });

            const response = await getProducts(params);
            setProducts(response.data || []);
            setTotalProducts(response.total || response.data?.length || 0);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSortField = (sort) => {
        const sortMap = {
            'price-low': 'price',
            'price-high': 'price',
            'newest': 'createdAt',
            'popular': 'views',
            'rating': 'rating'
        };
        return sortMap[sort] || 'createdAt';
    };

    const getSortOrder = (sort) => {
        return sort === 'price-high' ? 'desc' : sort === 'price-low' ? 'asc' : 'desc';
    };

    const updateURL = () => {
        const params = new URLSearchParams();
        if (filters.category) params.set('category', filters.category);
        if (filters.brand) params.set('brand', filters.brand);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.search) params.set('search', filters.search);
        if (sortBy !== 'newest') params.set('sort', sortBy);
        if (currentPage > 1) params.set('page', currentPage);
        setSearchParams(params);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            category: '',
            brand: '',
            minPrice: '',
            maxPrice: '',
            search: '',
        });
        setSortBy('newest');
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    const activeFiltersCount = Object.values(filters).filter(v => v).length;

    return (
        <div className="product-listing-page">
            <div className="container">
                {/* Header */}
                <div className="listing-header">
                    <div>
                        <h1>All Products</h1>
                        <p className="results-count">
                            {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
                        </p>
                    </div>

                    <div className="listing-controls">
                        {/* Sort Dropdown */}
                        <div className="sort-control">
                            <label htmlFor="sort">Sort by:</label>
                            <select
                                id="sort"
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="sort-select"
                            >
                                <option value="newest">Newest First</option>
                                <option value="popular">Most Popular</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            className="btn btn-outline mobile-filter-btn"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            🔍 Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                        </button>
                    </div>
                </div>

                <div className="listing-content">
                    {/* Filters Sidebar */}
                    <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
                        <div className="filters-header">
                            <h3>Filters</h3>
                            {activeFiltersCount > 0 && (
                                <button className="clear-filters-btn" onClick={handleClearFilters}>
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Search Filter */}
                        <div className="filter-group">
                            <label className="filter-label">Search</label>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="filter-input"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="filter-group">
                            <label className="filter-label">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Brand Filter */}
                        <div className="filter-group">
                            <label className="filter-label">Brand</label>
                            <select
                                value={filters.brand}
                                onChange={(e) => handleFilterChange('brand', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Brands</option>
                                {brands.map(brand => (
                                    <option key={brand._id} value={brand._id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic Attribute Filters (Rich with Counts) */}
                        {attributeTypes.map((group) => {
                            // group = { attributeType: {...}, values: [...] }
                            // Only show if there are values
                            if (!group.values || group.values.length === 0) return null;

                            return (
                                <div className="filter-group" key={group.attributeType._id}>
                                    <label className="filter-label">{group.attributeType.name}</label>
                                    <div className="filter-checkbox-group">
                                        {group.values.map(val => (
                                            <div key={val._id} className="filter-checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    id={`filter-${group.attributeType.slug}-${val._id}`}
                                                    checked={
                                                        // Check if value ID or Name is in filters
                                                        // Filters state for attribute is usually single string or array.
                                                        // For multi-select, we need to handle comma-separated or array.
                                                        // Current simplistic approach: string match
                                                        // TODO: Robust Multi-select handling
                                                        filters[group.attributeType.slug] === val._id ||
                                                        filters[group.attributeType.slug] === val.name
                                                    }
                                                    onChange={(e) => {
                                                        const newVal = e.target.checked ? val._id : '';
                                                        handleFilterChange(group.attributeType.slug, newVal);
                                                        // Note: Single select for now per attribute to match state structure 
                                                        // unless we refactor 'filters' to support arrays
                                                    }}
                                                />
                                                <label htmlFor={`filter-${group.attributeType.slug}-${val._id}`}>
                                                    {val.name} <span className="text-gray-400 text-xs">({val.count})</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Price Range Filter */}
                        <div className="filter-group">
                            <label className="filter-label">Price Range</label>
                            <div className="price-inputs">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    className="filter-input price-input"
                                />
                                <span className="price-separator">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    className="filter-input price-input"
                                />
                            </div>
                        </div>

                        {/* Quick Price Filters */}
                        <div className="filter-group">
                            <label className="filter-label">Quick Filters</label>
                            <div className="quick-filters">
                                <button
                                    className="quick-filter-btn"
                                    onClick={() => {
                                        handleFilterChange('minPrice', '');
                                        handleFilterChange('maxPrice', '500');
                                    }}
                                >
                                    Under ₹500
                                </button>
                                <button
                                    className="quick-filter-btn"
                                    onClick={() => {
                                        handleFilterChange('minPrice', '500');
                                        handleFilterChange('maxPrice', '1000');
                                    }}
                                >
                                    ₹500 - ₹1000
                                </button>
                                <button
                                    className="quick-filter-btn"
                                    onClick={() => {
                                        handleFilterChange('minPrice', '1000');
                                        handleFilterChange('maxPrice', '');
                                    }}
                                >
                                    Above ₹1000
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className="products-main">
                        {loading ? (
                            <div className="loading-grid">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="skeleton product-skeleton"></div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="no-products">
                                <div className="no-products-icon">📦</div>
                                <h3>No products found</h3>
                                <p>Try adjusting your filters or search terms</p>
                                <button className="btn btn-primary" onClick={handleClearFilters}>
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="products-grid">
                                    {products.map(product => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            ← Previous
                                        </button>

                                        <div className="pagination-numbers">
                                            {[...Array(totalPages)].map((_, i) => {
                                                const page = i + 1;
                                                // Show first, last, current, and adjacent pages
                                                if (
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={page}
                                                            className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                                                            onClick={() => setCurrentPage(page)}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                    return <span key={page} className="pagination-ellipsis">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            className="pagination-btn"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProductListingPage;
