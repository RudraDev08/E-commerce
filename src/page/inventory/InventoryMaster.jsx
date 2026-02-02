import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/inventory';

/**
 * ========================================================================
 * INVENTORY MASTER PAGE - COMPLETE INVENTORY MANAGEMENT
 * ========================================================================
 * 
 * FEATURES:
 * - Real-time inventory dashboard with statistics
 * - Variant-level stock tracking with visual indicators
 * - Manual stock updates with reason tracking
 * - Bulk stock update functionality
 * - Low stock alerts and filters
 * - Stock status badges (In Stock, Low Stock, Out of Stock)
 * - Inventory ledger/history view
 * - Search and advanced filtering
 * - Responsive design with modern UI
 * ========================================================================
 */

const InventoryMaster = () => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [inventories, setInventories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

  // Notification
  const [notification, setNotification] = useState(null);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchInventories();
    fetchStats();
  }, [currentPage, stockStatusFilter, lowStockOnly]);

  const fetchInventories = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage
      });

      if (searchTerm) params.append('search', searchTerm);
      if (stockStatusFilter) params.append('stockStatus', stockStatusFilter);
      if (lowStockOnly) params.append('lowStock', 'true');

      const response = await axios.get(`${API_BASE}?${params}`);

      if (response.data.success) {
        setInventories(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching inventories:', err);
      setError(err.response?.data?.message || 'Failed to load inventories');
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
      console.error('Error fetching stats:', err);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchInventories();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStockStatusFilter('');
    setLowStockOnly(false);
    setCurrentPage(1);
  };

  // ========================================================================
  // STOCK UPDATE HANDLERS
  // ========================================================================

  const handleUpdateStock = (inventory) => {
    setSelectedInventory(inventory);
    setShowUpdateModal(true);
  };

  const handleViewLedger = (inventory) => {
    setSelectedInventory(inventory);
    setShowLedgerModal(true);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  const getStockStatusBadge = (status) => {
    const badges = {
      in_stock: { bg: 'bg-green-100', text: 'text-green-800', label: 'In Stock' },
      low_stock: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Low Stock' },
      out_of_stock: { bg: 'bg-red-100', text: 'text-red-800', label: 'Out of Stock' },
      discontinued: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Discontinued' }
    };

    const badge = badges[status] || badges.out_of_stock;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HEADER ===== */}
      <div className="bg-white shadow">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage variant-level stock with real-time tracking and automation
              </p>
            </div>
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Bulk Update
            </button>
          </div>
        </div>
      </div>

      {/* ===== NOTIFICATION ===== */}
      {notification && (
        <div className="px-8 pt-4">
          <div className={`p-4 rounded-lg ${notification.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <p className="font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== STATISTICS CARDS ===== */}
      {stats && (
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Total Variants */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Variants</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.totalVariants)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* In Stock */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">In Stock</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{formatNumber(stats.inStock)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Low Stock */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Low Stock</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{formatNumber(stats.lowStock)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Out of Stock */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{formatNumber(stats.outOfStock)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          {/* Inventory Value Card */}
          <div className="mt-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Total Inventory Value</p>
                <p className="text-4xl font-bold mt-2">{formatCurrency(stats.totalInventoryValue)}</p>
                <p className="text-sm text-purple-100 mt-1">
                  {formatNumber(stats.totalStock)} units • {formatNumber(stats.totalReserved)} reserved
                </p>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-lg">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

              {/* Search */}
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by SKU or product name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Stock Status Filter */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              {/* Low Stock Toggle */}
              <div className="md:col-span-2 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Low Stock Only</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 flex items-end gap-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Search
                </button>
                {(searchTerm || stockStatusFilter || lowStockOnly) && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              </div>
            ) : inventories.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || stockStatusFilter || lowStockOnly
                    ? 'Try adjusting your filters'
                    : 'Inventory will be auto-created when you add variants'}
                </p>
              </div>
            ) : (
              <InventoryTable
                inventories={inventories}
                onUpdateStock={handleUpdateStock}
                onViewLedger={handleViewLedger}
                getStockStatusBadge={getStockStatusBadge}
                formatNumber={formatNumber}
              />
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && inventories.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ===== MODALS ===== */}
      {showUpdateModal && (
        <UpdateStockModal
          inventory={selectedInventory}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedInventory(null);
          }}
          onSuccess={() => {
            fetchInventories();
            fetchStats();
            showNotification('Stock updated successfully');
          }}
          showNotification={showNotification}
        />
      )}

      {showBulkModal && (
        <BulkUpdateModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            fetchInventories();
            fetchStats();
            showNotification('Bulk update completed successfully');
          }}
          showNotification={showNotification}
        />
      )}

      {showLedgerModal && (
        <LedgerModal
          inventory={selectedInventory}
          onClose={() => {
            setShowLedgerModal(false);
            setSelectedInventory(null);
          }}
        />
      )}

    </div>
  );
};

// ========================================================================
// INVENTORY TABLE COMPONENT
// ========================================================================

const InventoryTable = ({ inventories, onUpdateStock, onViewLedger, getStockStatusBadge, formatNumber }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Product / Variant
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            SKU
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Stock
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Reserved
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Available
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {inventories.map((inventory) => (
          <tr key={inventory._id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{inventory.productName}</div>
                <div className="text-sm text-gray-500">
                  {inventory.variantAttributes?.size && (
                    <span className="mr-2">Size: {inventory.variantAttributes.size}</span>
                  )}
                  {inventory.variantAttributes?.color && (
                    <span>Color: {inventory.variantAttributes.color}</span>
                  )}
                  {inventory.variantAttributes?.colorwayName && (
                    <span>Colorway: {inventory.variantAttributes.colorwayName}</span>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-sm font-mono text-gray-900">{inventory.sku}</span>
            </td>
            <td className="px-6 py-4 text-center">
              <span className="text-sm font-semibold text-gray-900">{formatNumber(inventory.totalStock)}</span>
            </td>
            <td className="px-6 py-4 text-center">
              <span className="text-sm text-gray-600">{formatNumber(inventory.reservedStock)}</span>
            </td>
            <td className="px-6 py-4 text-center">
              <span className="text-sm font-semibold text-indigo-600">{formatNumber(inventory.availableStock)}</span>
            </td>
            <td className="px-6 py-4 text-center">
              {getStockStatusBadge(inventory.stockStatus)}
            </td>
            <td className="px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => onUpdateStock(inventory)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  title="Update Stock"
                >
                  Update
                </button>
                <button
                  onClick={() => onViewLedger(inventory)}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  title="View History"
                >
                  History
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ========================================================================
// UPDATE STOCK MODAL COMPONENT
// ========================================================================

const UpdateStockModal = ({ inventory, onClose, onSuccess, showNotification }) => {
  const [newStock, setNewStock] = useState(inventory?.totalStock || 0);
  const [reason, setReason] = useState('MANUAL_CORRECTION');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    { value: 'PURCHASE_RECEIVED', label: 'Purchase Received' },
    { value: 'STOCK_RECEIVED', label: 'Stock Received' },
    { value: 'CUSTOMER_RETURN', label: 'Customer Return' },
    { value: 'DAMAGE', label: 'Damage' },
    { value: 'THEFT', label: 'Theft' },
    { value: 'LOSS', label: 'Loss' },
    { value: 'SAMPLE', label: 'Sample' },
    { value: 'MANUAL_CORRECTION', label: 'Manual Correction' },
    { value: 'AUDIT_ADJUSTMENT', label: 'Audit Adjustment' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Handle both populated object and string ID
      const variantId = typeof inventory.variantId === 'object'
        ? inventory.variantId._id
        : inventory.variantId;

      const response = await axios.put(`${API_BASE}/${variantId}/update-stock`, {
        newStock: parseInt(newStock),
        reason,
        notes,
        performedBy: 'ADMIN'
      });

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!inventory) return null;

  const stockChange = newStock - inventory.totalStock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Update Stock</h3>
          <p className="text-sm text-gray-500 mt-1">{inventory.sku}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Current Stock Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Current</p>
                <p className="text-lg font-semibold text-gray-900">{inventory.totalStock}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reserved</p>
                <p className="text-lg font-semibold text-gray-600">{inventory.reservedStock}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-lg font-semibold text-indigo-600">{inventory.availableStock}</p>
              </div>
            </div>
          </div>

          {/* New Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Stock</label>
            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {stockChange !== 0 && (
              <p className={`text-sm mt-1 ${stockChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stockChange > 0 ? '+' : ''}{stockChange} units
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {reasons.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========================================================================
// BULK UPDATE MODAL COMPONENT (Placeholder)
// ========================================================================

const BulkUpdateModal = ({ onClose, onSuccess, showNotification }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bulk Stock Update</h3>
          <p className="text-sm text-gray-500 mt-1">Update multiple variants at once</p>
        </div>
        <div className="p-6">
          <p className="text-gray-600">Bulk update functionality coming soon...</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================================================
// LEDGER MODAL COMPONENT (Placeholder)
// ========================================================================

const LedgerModal = ({ inventory, onClose }) => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (inventory) {
      fetchLedger();
    }
  }, [inventory]);

  const fetchLedger = async () => {
    try {
      // Handle both populated object and string ID
      const variantId = typeof inventory.variantId === 'object'
        ? inventory.variantId._id
        : inventory.variantId;

      const response = await axios.get(`${API_BASE}/${variantId}/ledger`);
      if (response.data.success) {
        setLedger(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!inventory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Inventory History</h3>
          <p className="text-sm text-gray-500 mt-1">{inventory.sku} - {inventory.productName}</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : ledger.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No history available</p>
          ) : (
            <div className="space-y-4">
              {ledger.map((entry, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{entry.transactionType}</p>
                      <p className="text-sm text-gray-600">{entry.reason}</p>
                      {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${entry.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.transactionDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Before:</span>
                      <span className="ml-1 font-medium">{entry.stockBefore.total}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">After:</span>
                      <span className="ml-1 font-medium">{entry.stockAfter.total}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">By:</span>
                      <span className="ml-1 font-medium">{entry.performedBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryMaster;