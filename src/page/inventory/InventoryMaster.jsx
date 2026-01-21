import { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import InventoryTable from '../../components/inventory/InventoryTable';
import InventoryForm from '../../components/inventory/InventoryForm';
import StockAdjustModal from '../../components/inventory/StockAdjustModal';
import InventoryLedger from '../../components/inventory/InventoryLedger';
import { formatNumber, formatCurrency } from '../../utils/stockUtils';

const InventoryMaster = () => {
  const {
    inventories,
    loading,
    error,
    stats,
    fetchInventories,
    createInventory,
    updateInventory,
    adjustStock,
  } = useInventory();

  const [showForm, setShowForm] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateNew = () => {
    setSelectedInventory(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = (inventory) => {
    setSelectedInventory(inventory);
    setEditMode(true);
    setShowForm(true);
  };

  const handleFormSubmit = async (data) => {
    let result;
    if (editMode && selectedInventory) {
      result = await updateInventory(selectedInventory._id, data);
    } else {
      result = await createInventory(data);
    }

    if (result.success) {
      setShowForm(false);
      setSelectedInventory(null);
      showNotification(
        editMode ? 'Inventory updated successfully' : 'Inventory created successfully'
      );
    } else {
      showNotification(result.error, 'error');
    }
  };

  const handleAdjustStock = (inventory) => {
    setSelectedInventory(inventory);
    setShowAdjustModal(true);
  };

  const handleStockAdjustSubmit = async (adjustmentData) => {
    const result = await adjustStock(adjustmentData);
    if (result.success) {
      setShowAdjustModal(false);
      setSelectedInventory(null);
      showNotification('Stock adjusted successfully');
    } else {
      showNotification(result.error, 'error');
    }
  };

  const handleViewLedger = (inventory) => {
    setSelectedInventory(inventory);
    setShowLedger(true);
  };

  const handleSearch = () => {
    fetchInventories({
      search: searchTerm,
      status: statusFilter || undefined,
      lowStock: lowStockFilter || undefined,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setLowStockFilter(false);
    fetchInventories();
  };

  const filteredInventories = inventories.filter(item => {
    const matchesSearch = !searchTerm || 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesLowStock = !lowStockFilter || item.currentStock <= item.reorderLevel;
    
    return matchesSearch && matchesStatus && matchesLowStock;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Master</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your inventory stock and controls</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Item
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-lg ${
            notification.type === 'error' 
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

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalItems)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Items</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatNumber(stats.activeItems)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{formatNumber(stats.lowStockItems)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Stock Value</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(stats.totalStockValue)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          {showForm ? (
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editMode ? 'Edit Inventory Item' : 'Create New Inventory Item'}
                </h2>
              </div>
              <InventoryForm
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setSelectedInventory(null);
                }}
                initialData={editMode ? selectedInventory : null}
                isLoading={loading}
              />
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by SKU, Product ID, or Name..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="DISCONTINUED">Discontinued</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={lowStockFilter}
                        onChange={(e) => setLowStockFilter(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Low Stock Only</span>
                    </label>
                    {(searchTerm || statusFilter || lowStockFilter) && (
                      <button
                        onClick={handleClearFilters}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div>
                {error ? (
                  <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                ) : (
                  <InventoryTable
                    inventories={filteredInventories}
                    onEdit={handleEdit}
                    onAdjustStock={handleAdjustStock}
                    onViewLedger={handleViewLedger}
                    loading={loading}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <StockAdjustModal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedInventory(null);
        }}
        onSubmit={handleStockAdjustSubmit}
        inventory={selectedInventory}
        isLoading={loading}
      />

      <InventoryLedger
        isOpen={showLedger}
        onClose={() => {
          setShowLedger(false);
          setSelectedInventory(null);
        }}
        inventory={selectedInventory}
      />
    </div>
  );
};

export default InventoryMaster;