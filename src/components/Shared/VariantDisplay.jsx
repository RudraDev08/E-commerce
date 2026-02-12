/**
 * ========================================================================
 * VARIANT DISPLAY FORMAT COMPONENT
 * ========================================================================
 * 
 * Purpose: Display variant combinations in a clean, readable format
 * Format: Storage / RAM / Color
 * 
 * Example:
 * - 1TB / 12GB / Silver
 * - 512GB / 8GB / Black
 * ========================================================================
 */

import React from 'react';

/**
 * VariantDisplayCell Component
 * Displays a single variant's configuration in table format
 */
export const VariantDisplayCell = ({ variant }) => {
    // Extract sizes
    const storage = variant.sizes?.find(s => s.category === 'storage');
    const ram = variant.sizes?.find(s => s.category === 'ram');

    // Extract color
    const color = variant.color;

    return (
        <div className="flex items-center gap-2">
            {/* Storage */}
            {storage && (
                <>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {storage.value}
                    </span>
                    <span className="text-slate-400">/</span>
                </>
            )}

            {/* RAM */}
            {ram && (
                <>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {ram.value}
                    </span>
                    <span className="text-slate-400">/</span>
                </>
            )}

            {/* Color */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 border border-slate-200">
                <div
                    className="w-3 h-3 rounded-full border border-slate-300"
                    style={{ backgroundColor: color?.hexCode || '#ccc' }}
                />
                <span className="text-slate-700">{color?.name || 'N/A'}</span>
            </div>
        </div>
    );
};

/**
 * VariantDisplayCompact Component
 * Compact text-only display
 */
export const VariantDisplayCompact = ({ variant }) => {
    const storage = variant.sizes?.find(s => s.category === 'storage');
    const ram = variant.sizes?.find(s => s.category === 'ram');
    const color = variant.color;

    const parts = [];
    if (storage) parts.push(storage.value);
    if (ram) parts.push(ram.value);
    if (color) parts.push(color.name);

    return (
        <span className="text-sm font-medium text-slate-700">
            {parts.join(' / ')}
        </span>
    );
};

/**
 * VariantDisplayFull Component
 * Full display with labels
 */
export const VariantDisplayFull = ({ variant }) => {
    const storage = variant.sizes?.find(s => s.category === 'storage');
    const ram = variant.sizes?.find(s => s.category === 'ram');
    const color = variant.color;

    return (
        <div className="space-y-2">
            {storage && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 w-16">Storage:</span>
                    <span className="text-sm font-semibold text-slate-900">{storage.value}</span>
                </div>
            )}
            {ram && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 w-16">RAM:</span>
                    <span className="text-sm font-semibold text-slate-900">{ram.value}</span>
                </div>
            )}
            {color && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 w-16">Color:</span>
                    <div className="flex items-center gap-1.5">
                        <div
                            className="w-4 h-4 rounded-full border-2 border-slate-300"
                            style={{ backgroundColor: color.hexCode }}
                        />
                        <span className="text-sm font-semibold text-slate-900">{color.name}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * VariantTable Component
 * Example table implementation showing all variants
 */
export const VariantTable = ({ variants }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Configuration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Stock
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {variants.map((variant) => (
                        <tr key={variant._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <VariantDisplayCell variant={variant} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-mono text-slate-600">
                                    {variant.sku}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-slate-900">
                                    ₹{variant.price?.toLocaleString()}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant.stock > 0
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-indigo-600 hover:text-indigo-900">
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/**
 * Usage Examples:
 * 
 * 1. In a table cell:
 *    <VariantDisplayCell variant={variant} />
 * 
 * 2. Compact display:
 *    <VariantDisplayCompact variant={variant} />
 * 
 * 3. Full display with labels:
 *    <VariantDisplayFull variant={variant} />
 * 
 * 4. Complete table:
 *    <VariantTable variants={variants} />
 */

export default {
    VariantDisplayCell,
    VariantDisplayCompact,
    VariantDisplayFull,
    VariantTable
};
