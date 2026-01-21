import React from 'react';
import { FiSearch, FiLayers, FiGrid, FiList, FiChevronDown, FiFilter } from 'react-icons/fi';

const ProductFilters = ({ 
  filters, 
  onFilterChange, 
  categories = [], 
  brands = [], 
  viewMode,
  onViewModeChange 
}) => {
  
  // Helper for consistent Select styling
  const selectClasses = "w-full pl-4 pr-10 py-3 bg-slate-50 border-2 border-transparent rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer";

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 mb-10">
      <div className="flex flex-col space-y-6">
        
        {/* Top Row: Search and View Toggle */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative group">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors z-10" size={18} />
            <input
              type="text"
              placeholder="Search identity by name or serial..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FiGrid size={14} /> Grid
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FiList size={14} /> Table
            </button>
          </div>
        </div>

        {/* Bottom Row: Filters Engine */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center pt-4 border-t border-slate-100">
          
          {/* Classification */}
          <div className="relative">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] absolute -top-2.5 left-4 bg-white px-2 z-10">Classification</label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className={selectClasses}
            >
              <option value="all">All Sectors</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Brand */}
          <div className="relative">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] absolute -top-2.5 left-4 bg-white px-2 z-10">Source Brand</label>
            <select
              value={filters.brand}
              onChange={(e) => onFilterChange('brand', e.target.value)}
              className={selectClasses}
            >
              <option value="all">All Sources</option>
              {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
            </select>
            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] absolute -top-2.5 left-4 bg-white px-2 z-10">Vault Status</label>
            <select
              value={filters.stockStatus}
              onChange={(e) => onFilterChange('stockStatus', e.target.value)}
              className={selectClasses}
            >
              <option value="all">Inventory: All</option>
              <option value="in-stock">Available</option>
              <option value="out-of-stock">Depleted</option>
            </select>
            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Sorting */}
          <div className="relative">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] absolute -top-2.5 left-4 bg-white px-2 z-10">Ordering Engine</label>
            <select
              value={filters.sort}
              onChange={(e) => onFilterChange('sort', e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-900 text-white rounded-xl font-bold outline-none ring-offset-4 focus:ring-2 focus:ring-slate-900 transition-all appearance-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="name-asc">Identity (A-Z)</option>
              <option value="price-asc">Valuation: Low</option>
              <option value="price-desc">Valuation: High</option>
            </select>
            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductFilters;