import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/productApi';
import { getCategories } from '../api/categoryApi';
import { getBrands } from '../api/brandApi';
import ProductCard from '../components/product/ProductCard';
import './ProductListingPage.css';

const ProductListingPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
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
    }, []);

    useEffect(() => {
        loadProducts();
        updateURL();
    }, [filters, sortBy, currentPage]);

    const loadFiltersData = async () => {
        try {
            const [categoriesRes, brandsRes] = await Promise.all([
                getCategories(),
                getBrands()
            ]);
            setCategories(categoriesRes.data || []);
            setBrands(brandsRes.data || []);
        } catch (error) {
            console.error('Error loading filters:', error);
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
