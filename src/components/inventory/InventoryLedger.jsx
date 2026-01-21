import { useState } from 'react';
import { useInventoryLedger } from '../../hooks/useInventory';
import { formatDate, formatNumber, getTransactionTypeColor } from '../../utils/stockUtils';

const InventoryLedger = ({ isOpen, onClose, inventory }) => {
  const [filterType, setFilterType] = useState('');
  const { ledger, loading } = useInventoryLedger(inventory?.productId);

  if (!isOpen || !inventory) return null;

  const filteredLedger = filterType
    ? ledger.filter(entry => entry.transactionType === filterType)
    : ledger;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-5xl sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Inventory Ledger</h2>
            <p className="text-sm text-gray-500 mt-1">
              {inventory.productName} ({inventory.sku})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilterType('')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterType === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('IN')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterType === 'IN'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              IN
            </button>
            <button
              onClick={() => setFilterType('OUT')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterType === 'OUT'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              OUT
            </button>
            <button
              onClick={() => setFilterType('ADJUST')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterType === 'ADJUST'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ADJUST
            </button>
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">No ledger entries found for this product.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLedger.map((entry) => (
                <div
                  key={entry._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getTransactionTypeColor(entry.transactionType)}`}>
                          {entry.transactionType}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {entry.reason}
                        </span>
                        {entry.referenceId && (
                          <span className="text-xs text-gray-500">
                            Ref: {entry.referenceId}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className={`text-sm font-semibold ${
                            entry.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.quantity > 0 ? '+' : ''}{formatNumber(entry.quantity)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Stock Before</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(entry.stockBefore)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Stock After</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(entry.stockAfter)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Value</p>
                          <p className="text-sm font-medium text-gray-900">
                            ₹{formatNumber(entry.totalValue)}
                          </p>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">{entry.notes}</p>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span>By: {entry.performedBy}</span>
                        <span>•</span>
                        <span>{formatDate(entry.transactionDate)}</span>
                      </div>
                    </div>

                    {entry.approvalStatus === 'PENDING' && (
                      <span className="ml-4 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total Entries: <span className="font-semibold">{filteredLedger.length}</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryLedger;