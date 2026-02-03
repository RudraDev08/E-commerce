
import React from 'react';

export const StatCard = ({ label, value, icon: Icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-500',
        green: 'bg-green-50 text-green-500',
        orange: 'bg-orange-50 text-orange-500',
        red: 'bg-red-50 text-red-500'
    };

    const valueColors = {
        blue: 'text-gray-900',
        green: 'text-green-600',
        orange: 'text-orange-600',
        red: 'text-red-600'
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                        {label}
                    </p>
                    <p className={`text-4xl font-bold ${valueColors[color]}`}>
                        {value}
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {Icon}
                </div>
            </div>
        </div>
    );
};
