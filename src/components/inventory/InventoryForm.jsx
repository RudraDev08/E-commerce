import { useState, useEffect } from 'react';
import { generateSKU } from '../../utils/stockUtils';

const InventoryForm = ({ onSubmit, onCancel, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    sku: '',
    barcode: '',
    unitOfMeasure: 'PCS',
    openingStock: 0,
    costPrice: 0,
    minimumStockLevel: 10,
    maximumStockLevel: 1000,
    reorderLevel: 20,
    reorderQuantity: 100,
    valuationMethod: 'WEIGHTED_AVERAGE',
    autoLowStockAlert: true,
    autoBlockOnZeroStock: false,
    autoReorderSuggestion: true,
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleGenerateSKU = () => {
    if (formData.productName) {
      setFormData(prev => ({
        ...prev,
        sku: generateSKU(formData.productName)
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.productId.trim()) newErrors.productId = 'Product ID is required';
    if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (formData.costPrice <= 0) newErrors.costPrice = 'Cost price must be greater than 0';
    if (formData.openingStock < 0) newErrors.openingStock = 'Opening stock cannot be negative';
    if (formData.maximumStockLevel <= formData.minimumStockLevel) {
      newErrors.maximumStockLevel = 'Maximum must be greater than minimum';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Information */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              disabled={initialData !== null}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {errors.productId && <p className="text-red-500 text-xs mt-1">{errors.productId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                disabled={initialData !== null}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-gray-100"
              />
              {!initialData && (
                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Generate
                </button>
              )}
            </div>
            {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <select
              name="unitOfMeasure"
              value={formData.unitOfMeasure}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PCS">Pieces</option>
              <option value="KG">Kilogram</option>
              <option value="LTR">Litre</option>
              <option value="MTR">Metre</option>
              <option value="BOX">Box</option>
              <option value="PACK">Pack</option>
              <option value="SET">Set</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Information */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="openingStock"
              value={formData.openingStock}
              onChange={handleChange}
              disabled={initialData !== null}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {errors.openingStock && <p className="text-red-500 text-xs mt-1">{errors.openingStock}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
          </div>
        </div>
      </div>

      {/* Stock Control Rules */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Control Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
            <input
              type="number"
              name="minimumStockLevel"
              value={formData.minimumStockLevel}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock Level</label>
            <input
              type="number"
              name="maximumStockLevel"
              value={formData.maximumStockLevel}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.maximumStockLevel && <p className="text-red-500 text-xs mt-1">{errors.maximumStockLevel}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
            <input
              type="number"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
            <input
              type="number"
              name="reorderQuantity"
              value={formData.reorderQuantity}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valuation Method</label>
            <select
              name="valuationMethod"
              value={formData.valuationMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
              <option value="WEIGHTED_AVERAGE">Weighted Average</option>
            </select>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Rules</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="autoLowStockAlert"
              checked={formData.autoLowStockAlert}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable low stock alerts</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="autoBlockOnZeroStock"
              checked={formData.autoBlockOnZeroStock}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto block product when stock reaches zero</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="autoReorderSuggestion"
              checked={formData.autoReorderSuggestion}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable auto reorder suggestions</span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;