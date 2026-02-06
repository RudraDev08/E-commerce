import React from 'react';
import { COMPONENT_MAP, ButtonGroup } from './ConfiguratorOptions';

export const AttributeGroup = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => {
    // Determine Component based on inputType
    const Component = COMPONENT_MAP[attribute.inputType] || ButtonGroup;

    return (
        <div className="attribute-group-container">
            <div className="attribute-header">
                <h3 className="attribute-title">
                    {attribute.name || attribute.slug}
                </h3>
                {selectedValue && (
                    <span className="selected-value-label">
                        {values.find(v => (v.slug || v.value) === selectedValue)?.value}
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
