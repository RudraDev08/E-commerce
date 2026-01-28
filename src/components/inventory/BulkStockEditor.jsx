import { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../hooks/useInventory';

const BulkStockEditor = ({ onCancel, onSave }) => {
    const { inventories, fetchInventories } = useInventory();
    const [editedItems, setEditedItems] = useState({});
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef({});

    useEffect(() => {
        fetchInventories();
    }, []);

    const handleStockChange = (variantId, newValue, item) => {
        setEditedItems(prev => ({
            ...prev,
            [variantId]: {
                value: newValue,
                original: item.currentStock,
                item
            }
        }));
    };

    const handleKeyDown = (e, index, variantId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Move to next input
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) nextInput.focus();
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const updates = Object.entries(editedItems).map(([variantId, data]) => ({
            variantId,
            newStock: Number(data.value),
            reason: 'Bulk Grid Update'
        }));

        if (updates.length > 0) {
            // Call parent onSave which should handle the API call
            await onSave(updates);
        }
        setLoading(false);
    };

    const hasChanges = Object.keys(editedItems).length > 0;

    return (
        <div className="bg-white rounded-lg shadow h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Bulk Stock Editor</h2>
                    <p className="text-sm text-gray-500">Edit stock quantities directly in the grid.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : `Save ${Object.keys(editedItems).length} Changes`}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Variant</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">SKU</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Current Stock</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase w-40">New Stock</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {inventories.map((item, index) => {
                            const variantId = item.variantId?._id || item.variantId; // Handle if populated
                            const isEdited = editedItems[variantId];
                            const stockValue = isEdited !== undefined ? isEdited.value : item.currentStock;
                            const diff = stockValue - item.currentStock;

                            return (
                                <tr key={item._id || index} className={isEdited ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {item.productId?.name || item.productName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {item.variantId?.sizeId?.name}
                                        {item.variantId?.colorId && ` - ${item.variantId.colorId.name}`}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                        {item.sku}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                        {item.currentStock}
                                    </td>
                                    <td className="px-6 py-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {isEdited && diff !== 0 && (
                                                <span className={`text-xs font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {diff > 0 ? '+' : ''}{diff}
                                                </span>
                                            )}
                                            <input
                                                ref={el => inputRefs.current[index] = el}
                                                type="number"
                                                min="0"
                                                value={stockValue}
                                                onChange={(e) => handleStockChange(variantId, e.target.value, item)}
                                                onKeyDown={(e) => handleKeyDown(e, index, variantId)}
                                                className={`w-24 text-right px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEdited ? 'border-blue-500 font-bold' : 'border-gray-300'}`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BulkStockEditor;
