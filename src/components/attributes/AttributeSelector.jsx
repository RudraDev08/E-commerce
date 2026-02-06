import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Universal Attribute Selector Component
 * Renders UI based on AttributeType configuration
 * Step 7 Compliance
 */
export const AttributeSelector = ({
    attributeType,
    values,
    selectedValueId,
    onSelect,
    validValueIds = [], // Array of Value IDs valid for current combination
    showPriceImpact = true
}) => {
    const { inputType, displayName, helperText } = attributeType;

    // Common props for all renderers
    const commonProps = {
        values,
        selectedValueId,
        onSelect,
        validValueIds,
        showPriceImpact,
        attributeType
    };

    const renderers = {
        button: ButtonRenderer,
        dropdown: DropdownRenderer,
        swatch: SwatchRenderer,
        image_grid: ImageGridRenderer,
        radio: RadioRenderer,
        checkbox: CheckboxRenderer // for multi-select
    };

    const Renderer = renderers[inputType] || DropdownRenderer;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-900">
                    {displayName}
                </label>
                {helperText?.customerLabel && (
                    <span className="text-xs text-gray-500">{helperText.customerLabel}</span>
                )}
            </div>

            <Renderer {...commonProps} />

            {helperText?.tooltipText && (
                <p className="mt-1 text-xs text-gray-500">{helperText.tooltipText}</p>
            )}
        </div>
    );
};

// ==================== RENDERERS ====================

const ButtonRenderer = ({ values, selectedValueId, onSelect, validValueIds, showPriceImpact }) => (
    <div className="flex flex-wrap gap-2">
        {values.map((val) => {
            const isSelected = selectedValueId === val._id;
            const isValid = validValueIds.length === 0 || validValueIds.includes(val._id); // If empty, assume all valid or handled by parent

            return (
                <button
                    key={val._id}
                    onClick={() => isValid && onSelect(val)}
                    disabled={!isValid}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border rounded-md transition-all",
                        isSelected
                            ? "border-black bg-black text-white"
                            : isValid
                                ? "border-gray-200 bg-white text-gray-900 hover:border-gray-900"
                                : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed decoration-slice line-through"
                    )}
                >
                    {val.displayName || val.name}
                    {showPriceImpact && <PriceBadge modifier={val.pricingModifiers} />}
                </button>
            );
        })}
    </div>
);

const SwatchRenderer = ({ values, selectedValueId, onSelect, validValueIds }) => (
    <div className="flex flex-wrap gap-3">
        {values.map((val) => {
            const isSelected = selectedValueId === val._id;
            const isValid = validValueIds.length === 0 || validValueIds.includes(val._id);
            const color = val.visualData?.hexCode || '#ccc';

            return (
                <button
                    key={val._id}
                    onClick={() => isValid && onSelect(val)}
                    disabled={!isValid}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center p-1 transition-all",
                        isSelected ? "ring-2 ring-black ring-offset-2" : "",
                        !isValid && "opacity-40 cursor-not-allowed"
                    )}
                    title={val.displayName}
                    aria-label={val.displayName}
                >
                    <span
                        className="w-full h-full rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                    />
                    {!isValid && <div className="absolute w-[120%] h-[1px] bg-gray-400 rotate-45" />}
                </button>
            );
        })}
    </div>
);

const DropdownRenderer = ({ values, selectedValueId, onSelect, validValueIds, showPriceImpact }) => (
    <div className="relative w-full md:w-64">
        <select
            value={selectedValueId || ''}
            onChange={(e) => {
                const val = values.find(v => v._id === e.target.value);
                if (val) onSelect(val);
            }}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
        >
            <option value="" disabled>Select Option</option>
            {values.map((val) => {
                const isValid = validValueIds.length === 0 || validValueIds.includes(val._id);
                return (
                    <option key={val._id} value={val._id} disabled={!isValid}>
                        {val.displayName || val.name}
                        {showPriceImpact && formatPriceImpact(val.pricingModifiers)}
                        {!isValid ? ' (Unavailable)' : ''}
                    </option>
                );
            })}
        </select>
    </div>
);

const ImageGridRenderer = ({ values, selectedValueId, onSelect, validValueIds }) => (
    <div className="grid grid-cols-4 gap-2">
        {values.map((val) => {
            const isSelected = selectedValueId === val._id;
            const isValid = validValueIds.length === 0 || validValueIds.includes(val._id);
            const imageUrl = val.visualData?.swatchValue || val.visualData?.primaryImage;

            return (
                <button
                    key={val._id}
                    onClick={() => isValid && onSelect(val)}
                    disabled={!isValid}
                    className={cn(
                        "relative aspect-square border rounded-lg overflow-hidden transition-all",
                        isSelected ? "ring-2 ring-black ring-offset-1" : "hover:border-gray-400",
                        !isValid && "opacity-50 grayscale cursor-not-allowed"
                    )}
                >
                    {imageUrl ? (
                        <img src={imageUrl} alt={val.displayName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs">No Img</div>
                    )}
                    <span className="sr-only">{val.displayName}</span>
                </button>
            );
        })}
    </div>
);

const RadioRenderer = ({ values, selectedValueId, onSelect, validValueIds, showPriceImpact }) => (
    <div className="space-y-2">
        {values.map((val) => {
            const isSelected = selectedValueId === val._id;
            const isValid = validValueIds.length === 0 || validValueIds.includes(val._id);

            return (
                <label key={val._id} className={cn("flex items-center space-x-3 cursor-pointer", !isValid && "opacity-50 pointer-events-none")}>
                    <input
                        type="radio"
                        name="attr_radio"
                        checked={isSelected}
                        onChange={() => isValid && onSelect(val)}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                        disabled={!isValid}
                    />
                    <span className="text-sm font-medium text-gray-900">{val.displayName}</span>
                    {showPriceImpact && <PriceBadge modifier={val.pricingModifiers} className="ml-2 text-xs text-gray-500" />}
                </label>
            );
        })}
    </div>
);

// Placeholder for Checkbox
const CheckboxRenderer = RadioRenderer;

// Helpers

const PriceBadge = ({ modifier, className }) => {
    if (!modifier || modifier.modifierType === 'none') return null;
    return (
        <span className={cn("ml-1 text-xs text-green-600 font-medium", className)}>
            {formatPriceImpact(modifier)}
        </span>
    );
}

const formatPriceImpact = (modifier) => {
    if (!modifier || modifier.modifierType === 'none') return '';
    const val = modifier.value;
    if (modifier.modifierType === 'percentage') return `(+${val}%)`;
    return `(+₹${val})`;
};

// Fallback cn if utility missing (inline simplified)
// But I assume user has cn in utils based on import instructions often seen,
// if not I should check.
// List dir shows `src/utils`. 
