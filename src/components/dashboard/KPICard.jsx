import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const KPICard = ({
    title,
    value,
    change,
    trend, // 'up' | 'down' | 'neutral'
    icon: Icon,
    loading = false
}) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                    <div className="w-16 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="w-24 h-8 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                <div className="w-32 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
            </div>
        );
    }

    const isPositive = trend === 'up';

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                </div>
                {change && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                        isPositive
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                    )}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
            </div>
        </div>
    );
};
