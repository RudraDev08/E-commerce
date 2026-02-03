
import React from 'react';

const InventoryTable = ({ inventories, onUpdateStock, onViewLedger, formatNumber }) => {
  const getStockStatusBadge = (status) => {
    const badges = {
      in_stock: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', label: 'In Stock' },
      low_stock: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500', label: 'Low Stock' },
      out_of_stock: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Out of Stock' },
      discontinued: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-500', label: 'Discontinued' }
    };

    // Fallback to out_of_stock if status is unknown or undefined
    const badge = badges[status] || badges.out_of_stock;

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${badge.dot}`}></span>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Product / Variant
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[220px]">
                SKU
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-[90px]">
                Total
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">
                Reserved
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">
                Available
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-[130px]">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Warehouse Distribution
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-[140px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventories.map((inventory, index) => (
              <tr
                key={inventory._id || index}
                className="hover:bg-gray-50 transition-colors duration-150 ease-in-out group"
              >
                {/* Product / Variant */}
                <td className="px-6 py-4">
                  <div>
                    <div className="text-[15px] font-semibold text-gray-900 leading-snug">
                      {inventory.productName || inventory.productId?.name || 'Unknown Product'}
                    </div>
                    <div className="text-[13px] text-gray-600 mt-1">
                      {inventory.variantAttributes?.size && `Size: ${inventory.variantAttributes.size}`}
                      {inventory.variantAttributes?.color && `  •  Color: ${inventory.variantAttributes.color}`}
                      {inventory.variantAttributes?.colorwayName && `  •  ${inventory.variantAttributes.colorwayName}`}
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="px-6 py-4">
                  <span className="font-mono text-[13px] text-gray-700 truncate block max-w-[200px]" title={inventory.sku}>
                    {inventory.sku}
                  </span>
                </td>

                {/* Total Stock */}
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(inventory.totalStock)}
                  </span>
                </td>

                {/* Reserved */}
                <td className="px-6 py-4 text-center">
                  <span className={`text-sm font-medium ${inventory.reservedStock > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {formatNumber(inventory.reservedStock)}
                  </span>
                </td>

                {/* Available */}
                <td className="px-6 py-4 text-center">
                  <button
                    className="text-sm font-bold text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                  >
                    {formatNumber(inventory.availableStock)}
                  </button>
                </td>

                <td className="px-6 py-4 text-center">
                  {getStockStatusBadge(inventory.stockStatus)}
                </td>

                {/* Warehouse Distribution */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {inventory.locations && inventory.locations.length > 0 ? (
                      inventory.locations.map((loc, i) => (
                        <div key={i} className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-[11px]" title={loc.warehouseId?.name || 'Warehouse'}>
                          <span className="font-bold text-gray-700 mr-1">{loc.warehouseId?.code || 'WH'}:</span>
                          <span className="text-blue-600 font-bold">{loc.stock}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic font-mono">- No locations -</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onUpdateStock(inventory)}
                      className="text-[13px] font-medium text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Update
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => onViewLedger(inventory)}
                      className="text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:underline"
                    >
                      History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {inventories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No inventory records found</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Try adjusting your search or create a new product variant to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTable;