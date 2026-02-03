
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { StatCard } from '../../components/inventory/StatCard';
import { InventoryValueBanner } from '../../components/inventory/InventoryValueBanner';
import InventoryTable from '../../components/inventory/InventoryTable';
import UpdateStockModal from '../../components/inventory/UpdateStockModal';
import InventoryLedgerModal from '../../components/inventory/InventoryLedgerModal';
import BulkUpdateModal from '../../components/inventory/BulkUpdateModal';

// Icons
const SortIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const TotalIcon = () => (
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const InStockIcon = () => (
  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LowStockIcon = () => (
  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const OutStockIcon = () => (
  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const API_BASE = 'http://localhost:5000/api/inventory';

const InventoryMaster = () => {
  // State
  const [inventories, setInventories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 50;

  // Modals
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Warehouse Filter
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseFilter, setWarehouseFilter] = useState('');

  // Initial Fetch
  useEffect(() => {
    fetchInventories();
    fetchStats();
    fetchWarehouses();
  }, [currentPage, stockStatusFilter, lowStockOnly, warehouseFilter]);

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/warehouses');
      if (res.data.success) setWarehouses(res.data.data);
    } catch (err) {
      console.error("Failed to load warehouses");
    }
  };

  const fetchInventories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage
      });

      if (searchTerm) params.append('search', searchTerm);
      if (stockStatusFilter) params.append('stockStatus', stockStatusFilter);
      if (lowStockOnly) params.append('lowStock', 'true');
      if (warehouseFilter) params.append('warehouseId', warehouseFilter);

      // Simulate slight delay for smooth UI (as per design prompt's "micro-interaction")
      // const delay = new Promise(resolve => setTimeout(resolve, 300));

      const response = await axios.get(`${API_BASE}?${params}`);

      // await delay;

      if (response.data.success) {
        setInventories(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);

        // Notify if there are out of stock items on initial load
        if (response.data.data.some(i => i.stockStatus === 'out_of_stock')) {
          toast.error('Critical: Some items are OUT OF STOCK!', { id: 'out-of-stock-alert' });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format helpers
  const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num || 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          style: {
            background: '#10B981', // Green-500
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
        },
        error: {
          style: {
            background: '#EF4444', // Red-500
          },
        },
      }} />

      {/* PAGE HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage variant-level stock with real-time tracking and automation
              </p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all">
                Export CSV
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale-105"
              >
                <SortIcon />
                <span className="ml-2">Bulk Update</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* STATISTICS CARDS */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Variants"
              value={formatNumber(stats.totalVariants)}
              icon={<TotalIcon />}
              color="blue"
            />
            <StatCard
              label="In Stock"
              value={formatNumber(stats.inStock)}
              icon={<InStockIcon />}
              color="green"
            />
            <StatCard
              label="Low Stock"
              value={formatNumber(stats.lowStock)}
              icon={<LowStockIcon />}
              color="orange"
            />
            <StatCard
              label="Out of Stock"
              value={formatNumber(stats.outOfStock)}
              icon={<OutStockIcon />}
              color="red"
            />
          </div>
        )}

        {/* INVENTORY VALUE BANNER */}
        {stats && (
          <InventoryValueBanner
            totalValue={stats.totalInventoryValue}
            totalUnits={stats.totalStock}
            reservedUnits={stats.totalReserved}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* FILTERS TOOLBAR */}
          <div className="p-5 border-b border-gray-200 bg-white">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">

              {/* Search */}
              <div className="w-full md:w-2/5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-shadow"
                  placeholder="Search by SKU or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInventories()}
                />
              </div>

              <div className="flex gap-4 w-full md:w-auto items-center">
                {/* Status Filter */}
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>

                {/* Warehouse Filter */}
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>

                {/* Low Stock Toggle */}
                <label className="inline-flex items-center cursor-pointer whitespace-nowrap select-none">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 transition duration-150 ease-in-out"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">Low Stock Only</span>
                </label>

                <button
                  onClick={fetchInventories}
                  className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm active:transform active:scale-95"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <InventoryTable
              inventories={inventories}
              formatNumber={formatNumber}
              onUpdateStock={(inventory) => {
                setSelectedInventory(inventory);
                setShowUpdateModal(true);
              }}
              onViewLedger={(inventory) => {
                setSelectedInventory(inventory);
                setShowLedgerModal(true);
              }}
            />
          )}

          {/* PAGINATION */}
          {!loading && inventories.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-gray-900">{totalItems}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === pageNum
                          ? 'bg-purple-600 text-white border border-purple-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showUpdateModal && (
        <UpdateStockModal
          inventory={selectedInventory}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => {
            fetchInventories();
            fetchStats();
          }}
        />
      )}

      {showLedgerModal && (
        <InventoryLedgerModal
          inventory={selectedInventory}
          onClose={() => setShowLedgerModal(false)}
        />
      )}

      {showBulkModal && (
        <BulkUpdateModal
          onClose={() => setShowBulkModal(false)}
        />
      )}

    </div>
  );
};

export default InventoryMaster;