import { useState, useEffect } from 'react';

const InventorySettingsModal = ({ isOpen, onClose, onSubmit, inventory, isLoading }) => {
    const [formData, setFormData] = useState({
        reorderLevel: 5,
        minimumStockLevel: 0,
        maximumStockLevel: 1000,
    });

    useEffect(() => {
        if (inventory) {
            setFormData({
                reorderLevel: inventory.reorderLevel || 5,
                minimumStockLevel: inventory.minimumStockLevel || 0,
                maximumStockLevel: inventory.maximumStockLevel || 1000,
            });
        }
    }, [inventory, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: Number(value)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...inventory,
            ...formData
        });
    };

    if (!isOpen || !inventory) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Inventory Settings</h2>
                        <p className="text-sm text-gray-500 mt-1">Configure alerts for this variant</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Low Stock Threshold (Reorder Level)
                        </label>
                        <input
                            type="number"
                            name="reorderLevel"
                            value={formData.reorderLevel}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Stock status becomes "Low Stock" when available stock falls below this number.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min Stock Rule
                            </label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Stock Rule
                            </label>
                            <input
                                type="number"
                                name="maximumStockLevel"
                                value={formData.maximumStockLevel}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventorySettingsModal;
