import React, { useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { getImageUrl } from '../../../utils/formatters';

// ─── RICH VARIANT CARD (Image + Price preview) ───────────────────────────────
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

// ─── PREMIUM SEGMENTED BUTTON GROUP (Size / Generic) ─────────────────────────
export const ButtonGroup = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => (
    <div className="seg-group">
        {values.map(val => {
            const isAvailable = checkAvailability(val.slug || val.value);
            const isSelected = selectedValue === (val.slug || val.value);
            const key = val.id || val.slug || val.value;

            return (
                <button
                    key={key}
                    onClick={() => isAvailable && onSelect(val.slug || val.value)}
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    title={!isAvailable ? 'Out of stock for this combination' : val.value}
                    className={[
                        'seg-btn',
                        isSelected ? 'seg-btn--active' : '',
                        !isAvailable ? 'seg-btn--disabled' : '',
                    ].join(' ')}
                >
                    {val.value}
                    {!isAvailable && <span className="seg-btn__slash" aria-hidden="true" />}
                </button>
            );
        })}
    </div>
);

// ─── PREMIUM CIRCULAR COLOR SWATCHES ─────────────────────────────────────────
export const ColorSwatch = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => {
    const [tooltip, setTooltip] = useState(null);

    return (
        <div className="swatches-row">
            {values.map(val => {
                const isAvailable = checkAvailability(val.slug || val.value);
                const isSelected = selectedValue === (val.slug || val.value);
                const colorCode = val.hexCode || val.hex || val.value;
                const isLightColor = colorCode && /^#?[fF]{3,6}$/.test(colorCode.replace('#', ''));
                const key = val.id || val.slug || val.value;

                return (
                    <div key={key} className="swatch-wrap">
                        <button
                            onClick={() => isAvailable && onSelect(val.slug || val.value)}
                            disabled={!isAvailable}
                            aria-pressed={isSelected}
                            aria-label={`${val.name || val.value} ${!isAvailable ? '(Out of Stock)' : ''}`}
                            onMouseEnter={() => setTooltip(key)}
                            onMouseLeave={() => setTooltip(null)}
                            className={[
                                'swatch-btn',
                                isSelected ? 'swatch-btn--selected' : '',
                                !isAvailable ? 'swatch-btn--disabled' : '',
                                isLightColor ? 'swatch-btn--light' : '',
                            ].join(' ')}
                            style={{ backgroundColor: colorCode || '#ccc' }}
                        >
                            {isSelected && (
                                <CheckIcon
                                    className="swatch-check"
                                    style={{ color: isLightColor ? '#111' : '#fff' }}
                                />
                            )}
                            {!isAvailable && (
                                <span className="swatch-slash" aria-hidden="true" />
                            )}
                        </button>
                        {/* Tooltip */}
                        {tooltip === key && (
                            <div className="swatch-tooltip" role="tooltip">
                                {val.name || val.value}
                                {!isAvailable && ' · OOS'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ─── TAG-STYLE ATTRIBUTE SELECTOR (Processor, Material, etc.) ────────────────
export const TagSelector = ({ attribute, values, selectedValue, onSelect, checkAvailability }) => (
    <div className="tags-row">
        {values.map(val => {
            const isAvailable = checkAvailability(val.slug || val.value);
            const isSelected = selectedValue === (val.slug || val.value);
            const key = val.id || val.slug || val.value;

            return (
                <button
                    key={key}
                    onClick={() => isAvailable && onSelect(val.slug || val.value)}
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    title={!isAvailable ? 'Unavailable' : val.value}
                    className={[
                        'tag-btn',
                        isSelected ? 'tag-btn--active' : '',
                        !isAvailable ? 'tag-btn--disabled' : '',
                    ].join(' ')}
                >
                    {val.value}
                </button>
            );
        })}
    </div>
);

// ─── DROPDOWN SELECT ──────────────────────────────────────────────────────────
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

// ─── RADIO GROUP ──────────────────────────────────────────────────────────────
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

// ─── COMPONENT MAP ────────────────────────────────────────────────────────────
export const COMPONENT_MAP = {
    color_swatch: ColorSwatch,
    swatch: ColorSwatch,
    image_grid: RichVariantCard,
    button_group: ButtonGroup,
    button: ButtonGroup,
    dropdown: AttributeSelect,
    radio: RadioGroup,
    checkbox: TagSelector,
    // Generic attribute tags (processor, material, etc.)
    tag: TagSelector,
};
