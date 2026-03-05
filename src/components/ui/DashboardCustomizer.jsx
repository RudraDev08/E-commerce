import React, { useState } from 'react';
import { LayoutGrid, EyeOff, LayoutTemplate, Save, Check } from 'lucide-react';

export const DashboardCustomizer = ({
    widgets,
    onLayoutChange
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Local state for toggling visibility
    const [activeWidgets, setActiveWidgets] = useState(
        widgets.reduce((acc, w) => ({ ...acc, [w.id]: w.visible !== false }), {})
    );

    const toggleWidget = (id) => {
        setActiveWidgets(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSave = () => {
        // In a real app, this calls an API to save preferences to the User model
        if (onLayoutChange) {
            onLayoutChange(activeWidgets);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                Customize
            </button>

            {isOpen && (
                <div className="absolute right-0 top-10 w-64 bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 rounded-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <LayoutTemplate className="w-4 h-4" />
                            Dashboard Layout
                        </h4>
                    </div>

                    <div className="p-2 max-h-64 overflow-y-auto space-y-1">
                        {widgets.map(w => (
                            <label
                                key={w.id}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 flex items-center justify-center border rounded ${activeWidgets[w.id] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {activeWidgets[w.id] && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className={`text-sm ${activeWidgets[w.id] ? 'text-gray-900 dark:text-white' : 'text-gray-500 line-through dark:text-gray-500'}`}>
                                        {w.title}
                                    </span>
                                </div>
                                {!activeWidgets[w.id] && <EyeOff className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />}
                            </label>
                        ))}
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors"
                        >
                            <Save className="w-4 h-4" /> Save View
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
