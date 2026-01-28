import { useState } from 'react';
import { formatNumber, formatCurrency, getStatusBadgeColor, getStockStatusColor } from '../../utils/stockUtils';

const InventoryTable = ({ inventories, onEdit, onAdjustStock, onViewLedger, loading }) => {
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInventories = [...inventories].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle nested fields for sorting if necessary
    if (sortField === 'productName') aVal = a.productId?.name || '';
    if (sortField === 'productName') bVal = b.productId?.name || '';

    if (sortField === 'currentStock' || sortField === 'availableStock') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const renderColorInfo = (variant) => {
    if (!variant) return <span className="text-gray-400">-</span>;

    // Colorway Mode
    if (variant.colorParts && variant.colorParts.length > 0) {
      return (
        <div className="flex -space-x-1">
          {variant.colorParts.slice(0, 3).map((part, idx) => (
            <div
              key={idx}
              className="w-4 h-4 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: part.hex }}
              title={part.name}
            />
          ))}
          {variant.colorParts.length > 3 && (
            <span className="text-[10px] pl-1 pt-0.5 text-gray-500">+{variant.colorParts.length - 3}</span>
          )}
        </div>
      );
    }

    // Single Color Mode
    if (variant.colorId) {
      return (
        <div
          className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
          style={{ backgroundColor: variant.colorId.hex }}
          title={variant.colorId.name}
        />
      );
    }

    return <span className="text-gray-300 text-xs">N/A</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (inventories.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new inventory item.</p>
      </div>
    );
  }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Variant</th>
            <th onClick={() => handleSort('sku')} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
              SKU {sortField === 'sku' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('currentStock')} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
              Stock {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Reserved/Avail</th>
            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedInventories.map((item) => {
            const isLowStock = item.currentStock <= item.reorderLevel;
            const stockColorClass = getStockStatusColor(item.currentStock, item.reorderLevel, item.minimumStockLevel);
            const product = item.productId || {};
            const variant = item.variantId || {};

            return (
              <tr key={item._id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-yellow-50/50' : ''} transition-colors`}>
                {/* Product */}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      {product.image ? (
                        <img className="h-10 w-10 object-cover" src={`${API_URL}${product.image}`} alt="" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{product.name || 'Unknown Product'}</div>
                      <div className="text-xs text-gray-500">{product._id}</div>
                    </div>
                  </div>
                </td>

                {/* Variant */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Size Badge */}
                    {variant.sizeId ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                        {variant.sizeId.name}
                      </span>
                    ) : <span className="text-gray-400 text-xs">-</span>}

                    {/* Color Dots */}
                    {renderColorInfo(variant)}
                  </div>
                </td>

                {/* SKU */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    {item.sku}
                  </span>
                </td>

                {/* Stock - Main */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${stockColorClass}`}>
                      {formatNumber(item.currentStock)}
                    </span>
                  </div>
                </td>

                {/* Reserved / Available */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-xs text-gray-500 font-medium">
                    Rsrv: <span className="text-gray-900">{formatNumber(item.reservedStock)}</span>
                  </div>
                  <div className="text-xs text-green-600 font-bold">
                    Avail: {formatNumber(item.availableStock)}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onAdjustStock(item)} className="p-1 hover:bg-slate-100 rounded text-blue-600" title="Adjust Balance">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button onClick={() => onViewLedger(item)} className="p-1 hover:bg-slate-100 rounded text-gray-500" title="View History">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    {onEdit && (
                      <button onClick={() => onEdit(item)} className="p-1 hover:bg-slate-100 rounded text-gray-400" title="Settings">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;