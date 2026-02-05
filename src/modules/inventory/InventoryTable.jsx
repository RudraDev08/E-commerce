
import React from 'react';

const InventoryTable = ({ inventories, onUpdateStock, onViewLedger, formatNumber }) => {
  const getStockStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    const badges = {
      in_stock: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', label: 'In Stock' },
      low_stock: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500', label: 'Low Stock' },
      out_of_stock: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Out of Stock' },
      discontinued: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-500', label: 'Discontinued' }
    };

    // Fallback to out_of_stock if status is unknown or undefined
    const badge = badges[s] || badges[s.replace(' ', '_')] || badges.out_of_stock;

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
                      {inventory.productId?.name || inventory.productName || 'Unknown Product'}
                    </div>
                    <div className="text-[13px] text-gray-600 mt-1">
                      {/* Size Logic: Check populated object or raw ID/String */}
                      {(inventory.variantId?.size?.name || inventory.variantId?.size?.code || inventory.variantAttributes?.size) &&
                        `Size: ${inventory.variantId?.size?.name || inventory.variantId?.size?.code || inventory.variantAttributes?.size}`}

                      {/* Color Logic: Check populated object or raw ID/String */}
                      {(inventory.variantId?.color?.name || inventory.variantAttributes?.color) &&
                        `  •  Color: ${inventory.variantId?.color?.name || inventory.variantAttributes?.color}`}

                      {/* Colorway Logic */}
                      {(inventory.variantId?.colorwayName || inventory.variantAttributes?.colorwayName) &&
                        `  •  ${inventory.variantId?.colorwayName || inventory.variantAttributes?.colorwayName}`}
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
                  {getStockStatusBadge(inventory.status)}
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
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-gradient-to-br from-gray-50 to-white">
            {/* Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-purple-100 rounded-full blur-2xl opacity-50"></div>
              <div className="relative p-6 bg-white rounded-full shadow-lg border-2 border-purple-100">
                <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No inventory initialized for variants yet.
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-base max-w-md mb-8 leading-relaxed">
              Your inventory is empty because no product variants exist yet.
              Follow these steps to get started:
            </p>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mb-8">
              {/* Step 1 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Create Products</h4>
                <p className="text-sm text-gray-600">
                  Go to <span className="font-medium text-purple-600">Product Master</span> and add your products
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-purple-600">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Build Variants</h4>
                <p className="text-sm text-gray-600">
                  Use <span className="font-medium text-purple-600">Variant Builder</span> to create size/color options
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Manage Stock</h4>
                <p className="text-sm text-gray-600">
                  Return here to update stock levels and track inventory
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <a
                href="/product-master"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Product
              </a>
              <a
                href="/variant-builder"
                className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-medium rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Build Variants
              </a>
            </div>

            {/* Help Text */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 max-w-2xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900 mb-1">Need Help?</p>
                  <p className="text-sm text-blue-700">
                    Inventory is automatically created when you add variants. Each variant (e.g., "Red T-Shirt - Size M") gets its own inventory record.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTable;