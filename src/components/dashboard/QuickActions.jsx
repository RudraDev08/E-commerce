import React from 'react';
import { PlusCircle, ArrowLeftRight, Percent, Home, ShoppingBag, Plus } from 'lucide-react';

const ACTIONS = [
    { id: 'create_product', label: 'Create Product', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'transfer_inventory', label: 'Transfer Inventory', icon: ArrowLeftRight, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'create_promotion', label: 'Create Promotion', icon: Percent, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'add_warehouse', label: 'Add Warehouse', icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'view_orders', label: 'View Orders', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' }
];

export const QuickActionPanel = ({ onAction }) => {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 group">
                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    More Actions
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {ACTIONS.map(action => (
                    <button
                        key={action.id}
                        onClick={() => onAction && onAction(action.id)}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                        <div className={`p-3 ${action.bg} ${action.color} rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
