import React from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { format, subDays, startOfToday } from 'date-fns';

const DATE_PRESETS = [
    { label: 'Today', value: 'today', range: [startOfToday(), startOfToday()] },
    { label: 'Last 7 days', value: 'last_7_days', range: [subDays(startOfToday(), 7), startOfToday()] },
    { label: 'Last 30 days', value: 'last_30_days', range: [subDays(startOfToday(), 30), startOfToday()] },
    { label: 'Custom range', value: 'custom', range: null }
];

export const DashboardDateFilter = ({ selected, onChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const currentPreset = DATE_PRESETS.find(p => p.value === selected) || DATE_PRESETS[0];

    return (
        <div className="relative z-20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{currentPreset.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        {DATE_PRESETS.map((preset) => (
                            <button
                                key={preset.value}
                                onClick={() => {
                                    onChange(preset.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-colors ${selected === preset.value
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {preset.label}
                                {selected === preset.value && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
