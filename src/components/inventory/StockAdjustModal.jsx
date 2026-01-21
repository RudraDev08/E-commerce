import { useState, useEffect } from 'react';
import { formatNumber, validateStockAdjustment } from '../../utils/stockUtils';

const StockAdjustModal = ({ isOpen, onClose, onSubmit, inventory, isLoading }) => {
  const [formData, setFormData] = useState({
    transactionType: 'IN',
    quantity: 0,
    reason: '',
    referenceId: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        transactionType: 'IN',
        quantity: 0,
        reason: '',
        referenceId: '',
        notes: '',
      });
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const quantity = Number(formData.quantity);
    const validation = validateStockAdjustment(
      formData.transactionType,
      quantity,
      inventory?.currentStock || 0
    );

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (!formData.reason.trim()) {
      setError('Reason is required');
      return;
    }

    const adjustmentData = {
      productId: inventory.productId,
      transactionType: formData.transactionType,
      quantity: formData.transactionType === 'ADJUST' ? quantity : Math.abs(quantity),
      reason: formData.reason,
      referenceId: formData.referenceId || undefined,
      notes: formData.notes || undefined,
      performedBy: 'ADMIN',
    };

    onSubmit(adjustmentData);
  };

  if (!isOpen || !inventory) return null;

  const calculateNewStock = () => {
    const qty = Number(formData.quantity) || 0;
    const current = inventory.currentStock;

    switch (formData.transactionType) {
      case 'IN':
        return current + Math.abs(qty);
      case 'OUT':
        return current - Math.abs(qty);
      case 'ADJUST':
        return current + qty;
      default:
        return current;
    }
  };

  const newStock = calculateNewStock();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Stock Adjustment</h2>
            <p className="text-sm text-gray-500 mt-1">{inventory.productName} ({inventory.sku})</p>
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

        {/* Current Stock Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Current Stock</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(inventory.currentStock)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Reserved</p>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(inventory.reservedStock)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Available</p>
              <p className="text-2xl font-bold text-green-600">{formatNumber(inventory.availableStock)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, transactionType: 'IN' }))}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  formData.transactionType === 'IN'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Stock IN
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, transactionType: 'OUT' }))}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  formData.transactionType === 'OUT'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Stock OUT
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, transactionType: 'ADJUST' }))}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  formData.transactionType === 'ADJUST'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Adjustment
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={formData.transactionType === 'ADJUST' ? 'Enter +/- quantity' : 'Enter quantity'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.transactionType === 'ADJUST' 
                ? 'Use positive for increase, negative for decrease'
                : 'Enter positive number only'}
            </p>
          </div>

          {/* New Stock Preview */}
          {formData.quantity !== 0 && (
            <div className={`p-4 rounded-lg ${newStock < 0 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">New Stock After Adjustment:</span>
                <span className={`text-2xl font-bold ${newStock < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatNumber(newStock)}
                </span>
              </div>
              {newStock < 0 && (
                <p className="text-xs text-red-600 mt-1">⚠️ Stock cannot be negative</p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select reason</option>
              {formData.transactionType === 'IN' && (
                <>
                  <option value="Purchase">Purchase</option>
                  <option value="Purchase Return">Purchase Return</option>
                  <option value="Production">Production</option>
                  <option value="Transfer In">Transfer In</option>
                </>
              )}
              {formData.transactionType === 'OUT' && (
                <>
                  <option value="Sale">Sale</option>
                  <option value="Sale Return">Sale Return</option>
                  <option value="Damage">Damage</option>
                  <option value="Transfer Out">Transfer Out</option>
                  <option value="Consumption">Consumption</option>
                </>
              )}
              {formData.transactionType === 'ADJUST' && (
                <>
                  <option value="Physical Count">Physical Count</option>
                  <option value="Correction">Correction</option>
                  <option value="Reconciliation">Reconciliation</option>
                  <option value="Loss">Loss</option>
                  <option value="Found">Found</option>
                </>
              )}
            </select>
          </div>

          {/* Reference ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
            <input
              type="text"
              name="referenceId"
              value={formData.referenceId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., PO-12345, INV-67890"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustModal;