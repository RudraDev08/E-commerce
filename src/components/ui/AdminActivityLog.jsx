import React from 'react';
import { PackageSearch, ArrowLeftRight, CreditCard, Box, MoreHorizontal } from 'lucide-react';

export const AdminActivityLog = ({ logs = [] }) => {
    // Sample data if empty
    const activities = logs.length > 0 ? logs : [
        { id: 1, action: 'Product Created', detail: 'Added "Mens Premium Tee"', user: 'John Admin', time: '10 mins ago', type: 'create' },
        { id: 2, action: 'Stock Adjusted', detail: '-50 units (WH-B) due to damage', user: 'Sally Mgr', time: '1 hour ago', type: 'inventory' },
        { id: 3, action: 'Refund Approved', detail: 'Order #ORD-9912 ($45.00)', user: 'John Admin', time: '3 hours ago', type: 'financial' },
    ];

    const getIcon = (type) => {
        switch (type) {
            case 'create': return <PackageSearch className="w-4 h-4 text-emerald-600" />;
            case 'inventory': return <Box className="w-4 h-4 text-blue-600" />;
            case 'financial': return <CreditCard className="w-4 h-4 text-purple-600" />;
            default: return <MoreHorizontal className="w-4 h-4 text-gray-600" />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'create': return 'bg-emerald-100 dark:bg-emerald-900/30';
            case 'inventory': return 'bg-blue-100 dark:bg-blue-900/30';
            case 'financial': return 'bg-purple-100 dark:bg-purple-900/30';
            default: return 'bg-gray-100 dark:bg-gray-800';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>

            <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6 lg:space-y-4 py-2">
                {activities.map((item, index) => (
                    <div key={item.id} className="relative pl-6 group">
                        <span className={`absolute -left-[11px] top-1 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white dark:ring-gray-900 ${getColor(item.type)}`}>
                            {getIcon(item.type)}
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between min-w-0">
                            <div className="max-w-full">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {item.action}
                                    <span className="font-normal text-gray-500 dark:text-gray-400 ml-1.5">— {item.detail}</span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    by {item.user}
                                </p>
                            </div>
                            <div className="flex-shrink-0 mt-1 sm:mt-0 text-xs text-gray-400 whitespace-nowrap">
                                {item.time}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                View Full Audit Log
            </button>
        </div>
    );
};
