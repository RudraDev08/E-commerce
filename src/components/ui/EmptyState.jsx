import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';

export const EmptyState = ({
    icon: Icon = PackageOpen,
    title = 'No Data Found',
    description = 'There is currently no data to display here.',
    actionLabel,
    onAction
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
                {description}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all hover:shadow-md active:scale-95 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900"
                >
                    <Plus className="w-4 h-4" /> {actionLabel}
                </button>
            )}
        </div>
    );
};
