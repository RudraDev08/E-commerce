import React from 'react';

const ProductFilters = ({ 
  filters, 
  onFilterChange, 
  categories, 
  brands,
  viewMode,
  onViewModeChange 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
          />
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.brand}
            onChange={(e) => onFilterChange('brand', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
          >
            <option value="all">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.stockStatus}
            onChange={(e) => onFilterChange('stockStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
          >
            <option value="newest">Newest</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
        
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            className={`px-5 py-2 text-sm font-medium ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            onClick={() => onViewModeChange('grid')}
          >
            Grid
          </button>
          <button
            className={`px-5 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            onClick={() => onViewModeChange('table')}
          >
            Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;