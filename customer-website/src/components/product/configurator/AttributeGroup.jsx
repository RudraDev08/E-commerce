import React from 'react';
import { COMPONENT_MAP, ButtonGroup } from './ConfiguratorOptions';
import '../VariantSelector.css';

export const AttributeGroup = ({
    attribute,
    values,
    selectedValue,
    onSelect,
    checkAvailability,
    isDisabled,
    helperText,
}) => {
    const Component = COMPONENT_MAP[attribute.inputType] || ButtonGroup;

    return (
        <div
            className={`attribute-group-container ${isDisabled ? 'opacity-50 pointer-events-none select-none' : ''}`}
        >
            <div className="attribute-header flex flex-wrap justify-between items-center mb-2">
                <h3 className="attribute-title">
                    {attribute.name || attribute.slug}
                    {selectedValue && (
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#111', marginLeft: 6 }}>
                            — {values.find(v => (v.slug || v.value) === selectedValue)?.value}
                        </span>
                    )}
                </h3>
                {helperText && (
                    <span className="text-xs font-medium text-blue-600 animate-pulse bg-blue-50 px-2 py-1 rounded-full border border-blue-100 italic">
                        {helperText}
                    </span>
                )}
            </div>

            <Component
                attribute={attribute}
                values={values}
                selectedValue={selectedValue}
                onSelect={onSelect}
                checkAvailability={checkAvailability}
            />
        </div>
    );
};
