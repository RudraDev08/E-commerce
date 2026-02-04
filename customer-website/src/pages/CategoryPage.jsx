import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getCategories } from '../api/categoryApi';
import { getProducts } from '../api/productApi';
import ProductCard from '../components/product/ProductCard';
import './CategoryPage.css';

/**
 * Sub-Category Product Listing Page
 * - Auto-generates brand filters from products
 * - Shows products for specific sub-category
 * - Multiple filter support
 * - Mobile responsive
 */
const CategoryPage = () => {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [selectedTags, setSelectedTags] = useState([]);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

    // Mobile filter toggle
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadCategoryAndProducts();
    }, [slug]);

    useEffect(() => {
        updateURLParams();
    }, [selectedBrands, priceRange, selectedTags, inStockOnly, sortBy]);

    const loadCategoryAndProducts = async () => {
        try {
            setLoading(true);

            // Find category by slug
            const categoriesRes = await getCategories();
            const foundCategory = categoriesRes.data.find(c => c.slug === slug);

            if (!foundCategory) {
                setLoading(false);
                return;
            }

            setCategory(foundCategory);

            // Load products for this category
            const productsRes = await getProducts({
                category: foundCategory._id,
                limit: 100
            });

            setProducts(productsRes.data || []);
        } catch (error) {
            console.error('Error loading category:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate brand filters from products in this category
    const availableBrands = useMemo(() => {
        const brandMap = new Map();

        products.forEach(product => {
            if (product.brand) {
                const brandId = product.brand._id || product.brand;
                const brandName = product.brand.name || product.brand;

                if (!brandMap.has(brandId)) {
                    brandMap.set(brandId, {
                        id: brandId,
                        name: brandName,
                        count: 0
                    });
                }

                brandMap.get(brandId).count++;
            }
        });

        return Array.from(brandMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [products]);

    // Auto-generate tag filters from products
    const availableTags = useMemo(() => {
        const tagSet = new Set();

        products.forEach(product => {
            if (product.tags && Array.isArray(product.tags)) {
                product.tags.forEach(tag => tagSet.add(tag));
            }
        });

        return Array.from(tagSet);
    }, [products]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        // Brand filter (multiple selection)
        if (selectedBrands.length > 0) {
            filtered = filtered.filter(p => {
                const brandId = p.brand?._id || p.brand;
                return selectedBrands.includes(brandId);
            });
        }

        // Price filter
        if (priceRange.min) {
            filtered = filtered.filter(p => p.price >= parseFloat(priceRange.min));
        }
        if (priceRange.max) {
            filtered = filtered.filter(p => p.price <= parseFloat(priceRange.max));
        }

        // Tag filter
        if (selectedTags.length > 0) {
            filtered = filtered.filter(p =>
                p.tags?.some(tag => selectedTags.includes(tag))
            );
        }

        // In stock filter
        if (inStockOnly) {
            filtered = filtered.filter(p => p.stock > 0 || p.hasVariants);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'popular':
                    return (b.views || 0) - (a.views || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'newest':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    }, [products, selectedBrands, priceRange, selectedTags, inStockOnly, sortBy]);

    const handleBrandToggle = (brandId) => {
        setSelectedBrands(prev =>
            prev.includes(brandId)
                ? prev.filter(id => id !== brandId)
                : [...prev, brandId]
        );
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleClearFilters = () => {
        setSelectedBrands([]);
        setPriceRange({ min: '', max: '' });
        setSelectedTags([]);
        setInStockOnly(false);
        setSortBy('newest');
    };

    const updateURLParams = () => {
        const params = new URLSearchParams();
        if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
        if (priceRange.min) params.set('minPrice', priceRange.min);
        if (priceRange.max) params.set('maxPrice', priceRange.max);
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
        if (inStockOnly) params.set('inStock', 'true');
        if (sortBy !== 'newest') params.set('sort', sortBy);
        setSearchParams(params);
    };

    const activeFiltersCount = selectedBrands.length + selectedTags.length +
        (priceRange.min ? 1 : 0) + (priceRange.max ? 1 : 0) + (inStockOnly ? 1 : 0);

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="spinner-large"></div>
                <p>Loading products...</p>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h2>Category not found</h2>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '2rem' }}>
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="category-page">
            <div className="container">
                {/* Enhanced Breadcrumb with Icons */}
                <nav className="breadcrumb" aria-label="Breadcrumb navigation">
                    <Link to="/" className="breadcrumb-item">
                        <svg className="home-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span>Home</span>
                    </Link>
                    <span className="breadcrumb-separator">›</span>
                    {category.parentId && (
                        <>
                            <Link to={`/category/${category.parentId.slug || 'parent'}`} className="breadcrumb-item">
                                <span>{category.parentId.name || 'Category'}</span>
                            </Link>
                            <span className="breadcrumb-separator">›</span>
                        </>
                    )}
                    <span className="breadcrumb-item active">{category.name}</span>
                </nav>

                {/* Enhanced Page Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">{category.name}</h1>
                        <p className="page-description">
                            {category.description || `Explore ${category.name.toLowerCase()} from top brands`}
                        </p>
                    </div>
                </div>

                {/* Utility Information Row */}
                <div className="utility-bar">
                    <div className="product-count">
                        <svg className="count-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}</span>
                    </div>

                    <div className="utility-controls">
                        {/* Sort Dropdown */}
                        <div className="sort-control">
                            <label htmlFor="sort">Sort by:</label>
                            <select
                                id="sort"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                            >
                                <option value="popular">Popularity</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="newest">New Arrivals</option>
                                <option value="rating">Best Seller</option>
                            </select>
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            className="btn btn-outline mobile-filter-btn"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14"></line>
                                <line x1="4" y1="10" x2="4" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12" y2="3"></line>
                                <line x1="20" y1="21" x2="20" y2="16"></line>
                                <line x1="20" y1="12" x2="20" y2="3"></line>
                                <line x1="1" y1="14" x2="7" y2="14"></line>
                                <line x1="9" y1="8" x2="15" y2="8"></line>
                                <line x1="17" y1="16" x2="23" y2="16"></line>
                            </svg>
                            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                        </button>
                    </div>
                </div>

                {/* Quick Filter Chips */}
                {availableTags.length > 0 && (
                    <div className="quick-filters">
                        <span className="quick-filters-label">Quick Filters:</span>
                        <div className="filter-chips">
                            {availableTags.slice(0, 5).map(tag => (
                                <button
                                    key={tag}
                                    className={`filter-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                                    onClick={() => handleTagToggle(tag)}
                                >
                                    {tag}
                                    {selectedTags.includes(tag) && (
                                        <svg className="chip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </button>
                            ))}
                            <button
                                className={`filter-chip ${inStockOnly ? 'active' : ''}`}
                                onClick={() => setInStockOnly(!inStockOnly)}
                            >
                                In Stock
                                {inStockOnly && (
                                    <svg className="chip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <div className="category-content">
                    {/* Filters Sidebar */}
                    <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
                        <div className="filters-header">
                            <h3>Filters</h3>
                            {activeFiltersCount > 0 && (
                                <button className="clear-filters-btn" onClick={handleClearFilters}>
                                    Clear All
                                </button>
                            )}
                            {/* Mobile Close Button */}
                            <button
                                className="mobile-close-btn"
                                onClick={() => setShowFilters(false)}
                                aria-label="Close filters"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Brand Filter - AUTO-GENERATED */}
                        {availableBrands.length > 0 && (
                            <div className="filter-group">
                                <label className="filter-label">Brand</label>
                                <div className="checkbox-list">
                                    {availableBrands.map(brand => (
                                        <label key={brand.id} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand.id)}
                                                onChange={() => handleBrandToggle(brand.id)}
                                            />
                                            <span className="checkbox-label">
                                                {brand.name}
                                                <span className="item-count">({brand.count})</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Range Filter */}
                        <div className="filter-group">
                            <label className="filter-label">Price Range</label>
                            <div className="price-inputs">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                    className="filter-input price-input"
                                />
                                <span className="price-separator">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                    className="filter-input price-input"
                                />
                            </div>
                        </div>

                        {/* Tag Filter - AUTO-GENERATED */}
                        {availableTags.length > 0 && (
                            <div className="filter-group">
                                <label className="filter-label">Tags</label>
                                <div className="checkbox-list">
                                    {availableTags.map(tag => (
                                        <label key={tag} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedTags.includes(tag)}
                                                onChange={() => handleTagToggle(tag)}
                                            />
                                            <span className="checkbox-label">{tag}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Availability Filter */}
                        <div className="filter-group">
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                />
                                <span className="checkbox-label">In Stock Only</span>
                            </label>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className="products-section">
                        {filteredProducts.length > 0 ? (
                            <div className="products-grid">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="no-products">
                                <p>No products found matching your filters.</p>
                                <button className="btn btn-primary" onClick={handleClearFilters}>
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default CategoryPage;
