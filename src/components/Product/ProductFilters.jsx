import React from 'react';

const ProductFilters = ({ 
  filters, 
  onFilterChange, 
  categories = [], // Default to empty array
  brands = [],     // Default to empty array
  viewMode,
  onViewModeChange 
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex flex-wrap gap-4 items-center">
        
        {/* Search Identity */}
        <div className="flex-1 min-w-[240px] relative">
          <input
            type="text"
            placeholder="Search identity name..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>
        
        {/* Category Classification */}
        <div className="flex-1 min-w-[180px]">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none"
          >
            <option value="all">All Classifications</option>
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        {/* Source Brand */}
        <div className="flex-1 min-w-[180px]">
          <select
            value={filters.brand}
            onChange={(e) => onFilterChange('brand', e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none"
          >
            <option value="all">All Brands</option>
            {Array.isArray(brands) && brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        
        {/* Status Filter */}
        <div className="flex-1 min-w-[160px]">
          <select
            value={filters.stockStatus}
            onChange={(e) => onFilterChange('stockStatus', e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none"
          >
            <option value="all">Inventory: All</option>
            <option value="in-stock">Available</option>
            <option value="out-of-stock">Depleted</option>
          </select>
        </div>

        {/* Sorting Engine */}
        <div className="flex-1 min-w-[180px]">
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-slate-900 transition-all appearance-none"
          >
            <option value="newest">Sort: Newest</option>
            <option value="name-asc">Identity (A-Z)</option>
            <option value="price-asc">Valuation: Low</option>
            <option value="price-desc">Valuation: High</option>
          </select>
        </div>
        
        {/* Layout Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Grid
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;