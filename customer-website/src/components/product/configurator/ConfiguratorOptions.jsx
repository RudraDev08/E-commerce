import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { getImageUrl } from '../../../utils/formatters';

/**
 * Rich Variant Card (Amazon Style)
 * Shows a thumbnail image + price inside a bordered card.
 */
export const RichVariantCard = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => (
    <div className="rich-variant-group">
        {values.map(val => {
            const isAvailable = checkAvailability(val.slug || val.value);
            const isSelected = selectedValue === (val.slug || val.value);
            const image = val.previewImage || 'https://via.placeholder.com/100';
            const price = val.previewPrice;

            return (
                <button
                    key={val.id}
                    onClick={() => onSelect(val.slug || val.value)}
                    disabled={!isAvailable}
                    className={`rich-variant-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                    title={!isAvailable ? 'Out of Stock' : val.value}
                >
                    <div className="variant-thumb-container">
                        <img src={getImageUrl(image)} alt={val.value} className="variant-thumb" />
                    </div>
                    <div className="variant-details">
                        <span className="variant-name">{val.value}</span>
                        {price && <span className="variant-price">₹{price.toLocaleString()}</span>}
                    </div>
                    {isSelected && (
                        <div className="selected-tick">
                            <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                    )}
                </button>
            );
        })}
    </div>
);


/**
 * Button Group Component
 */
export const ButtonGroup = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => (
    <div className="options-group">
        {values.map(val => {
            const isAvailable = checkAvailability(val.slug || val.value);
            const isSelected = selectedValue === (val.slug || val.value);

            return (
                <button
                    key={val.id}
                    onClick={() => onSelect(val.slug || val.value)}
                    disabled={!isAvailable}
                    className={`option-btn ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                    title={!isAvailable ? 'Out of Stock' : val.value}
                >
                    {val.value}
                </button>
            );
        })}
    </div>
);

/**
 * Color Swatch Component (Classic)
 */
export const ColorSwatch = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => (
    <div className="swatches-group">
        {values.map(val => {
            const isAvailable = checkAvailability(val.slug || val.value);
            const isSelected = selectedValue === (val.slug || val.value);
            const colorCode = val.hexCode || val.value;

            return (
                <button
                    key={val.id}
                    onClick={() => onSelect(val.slug || val.value)}
                    disabled={!isAvailable}
                    className={`color-swatch-btn ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                    style={{ backgroundColor: colorCode }}
                    title={`${val.name || val.value} ${!isAvailable ? '(Out of Stock)' : ''}`}
                >
                    {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                            <XMarkIcon className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                    )}
                </button>
            );
        })}
    </div>
);

/**
 * Dropdown Select Component
 */
export const AttributeSelect = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => (
    <div className="select-wrapper">
        <select
            value={selectedValue || ''}
            onChange={(e) => onSelect(e.target.value)}
            className="config-select"
        >
            <option value="" disabled>Select {attribute.name}</option>
            {values.map(val => {
                const isAvailable = checkAvailability(val.slug || val.value);
                return (
                    <option
                        key={val.id}
                        value={val.slug || val.value}
                        disabled={!isAvailable}
                    >
                        {val.value} {!isAvailable ? '(Unavailable)' : ''}
                    </option>
                );
            })}
        </select>
    </div>
);

/**
 * Radio Group Component
 */
export const RadioGroup = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => (
    <div className="radio-group-container">
        {values.map(val => {
            const isAvailable = checkAvailability(val.slug || val.value);
            const isSelected = selectedValue === (val.slug || val.value);

            return (
                <div key={val.id} className="radio-item">
                    <input
                        id={`${attribute.id}-${val.id}`}
                        name={attribute.id}
                        type="radio"
                        checked={isSelected}
                        disabled={!isAvailable}
                        onChange={() => onSelect(val.slug || val.value)}
                        className="radio-input"
                    />
                    <label
                        htmlFor={`${attribute.id}-${val.id}`}
                        className={`radio-label ${!isAvailable ? 'disabled' : ''}`}
                    >
                        {val.value}
                    </label>
                </div>
            );
        })}
    </div>
);

// Map of input types to components
export const COMPONENT_MAP = {
    // Revert to Classic Swatches per new request (Clean, Minimal, Rounded)
    color_swatch: ColorSwatch,
    swatch: ColorSwatch,

    // Keep Rich Cards for explicit image grids if used
    image_grid: RichVariantCard,

    // Others
    button_group: ButtonGroup,
    button: ButtonGroup,
    dropdown: AttributeSelect,
    radio: RadioGroup,
    checkbox: ButtonGroup,
};
