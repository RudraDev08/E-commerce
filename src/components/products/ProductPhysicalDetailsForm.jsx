import { useState } from 'react';
import {
    CubeIcon,
    WrenchScrewdriverIcon,
    TagIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

/**
 * ProductPhysicalDetailsForm Component
 * 
 * Unified Product Master form for managing:
 * - Physical Details (Dimensions, Weight, Form Factor)
 * - Build & Material (Materials, Durability)
 * - Product Tags (Search & Organization)
 * 
 * Design: Enterprise-grade, production-ready
 * Data Contract: Strict schema for Product Master only
 */

const ProductPhysicalDetailsForm = ({
    formData = {},
    onChange
}) => {
    const [tagInput, setTagInput] = useState('');

    // Handle dimension changes
    const handleDimensionChange = (field, value) => {
        onChange('dimensions', {
            ...formData.dimensions,
            [field]: value
        });
    };

    // Handle weight changes
    const handleWeightChange = (field, value) => {
        onChange('weight', {
            ...formData.weight,
            [field]: value
        });
    };

    // Handle build/material changes
    const handleBuildChange = (field, value) => {
        onChange('build', {
            ...formData.build,
            [field]: value
        });
    };

    // Handle tag addition
    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const trimmedTag = tagInput.trim();

            // Validation: max length
            if (trimmedTag.length > 30) {
                return;
            }

            // Prevent duplicates (case-insensitive comparison, preserve original casing)
            const existingTags = formData.tags || [];
            const isDuplicate = existingTags.some(
                tag => tag.toLowerCase() === trimmedTag.toLowerCase()
            );

            if (!isDuplicate) {
                onChange('tags', [...existingTags, trimmedTag]);
            }

            setTagInput('');
        }
    };

    // Handle tag removal
    const handleRemoveTag = (tagToRemove) => {
        onChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-6">
            {/* ============================================ */}
            {/* SECTION 1: PHYSICAL DETAILS */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                {/* Section Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <CubeIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">Physical Details</h3>
                    </div>
                    <p className="text-sm text-slate-500 ml-11">
                        Define the physical dimensions and form factor of the product.
                    </p>
                </div>

                {/* Dimensions Group */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Dimensions
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Thickness */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                                Thickness
                            </label>
                            <input
                                type="number"
                                value={formData.dimensions?.thickness || ''}
                                onChange={(e) => handleDimensionChange('thickness', e.target.value)}
                                className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                placeholder="0"
                                step="0.01"
                            />
                        </div>

                        {/* Width */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                                Width
                            </label>
                            <input
                                type="number"
                                value={formData.dimensions?.width || ''}
                                onChange={(e) => handleDimensionChange('width', e.target.value)}
                                className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                placeholder="0"
                                step="0.01"
                            />
                        </div>

                        {/* Height */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                                Height
                            </label>
                            <input
                                type="number"
                                value={formData.dimensions?.height || ''}
                                onChange={(e) => handleDimensionChange('height', e.target.value)}
                                className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                placeholder="0"
                                step="0.01"
                            />
                        </div>

                        {/* Unit Selector */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                                Unit
                            </label>
                            <select
                                value={formData.dimensions?.unit || 'mm'}
                                onChange={(e) => handleDimensionChange('unit', e.target.value)}
                                className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                                <option value="mm">mm</option>
                                <option value="cm">cm</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Weight */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Weight
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                            <input
                                type="number"
                                value={formData.weight?.value || ''}
                                onChange={(e) => handleWeightChange('value', e.target.value)}
                                className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                placeholder="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <select
                                value={formData.weight?.unit || 'g'}
                                onChange={(e) => handleWeightChange('unit', e.target.value)}
                                className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Form Factor */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Form Factor
                    </label>
                    <select
                        value={formData.formFactor || ''}
                        onChange={(e) => onChange('formFactor', e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                        <option value="">Select form factor</option>
                        <option value="foldable">Foldable</option>
                        <option value="non-foldable">Non-Foldable</option>
                    </select>
                </div>
            </div>

            {/* ============================================ */}
            {/* SECTION 2: BUILD & MATERIAL */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                {/* Section Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <WrenchScrewdriverIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">Build & Material</h3>
                    </div>
                    <p className="text-sm text-slate-500 ml-11">
                        Specify the materials and durability characteristics.
                    </p>
                </div>

                {/* First Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Front Material */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Front Material
                        </label>
                        <input
                            type="text"
                            value={formData.build?.frontMaterial || ''}
                            onChange={(e) => handleBuildChange('frontMaterial', e.target.value)}
                            className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Gorilla Glass Victus"
                        />
                    </div>

                    {/* Back Material */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Back Material
                        </label>
                        <input
                            type="text"
                            value={formData.build?.backMaterial || ''}
                            onChange={(e) => handleBuildChange('backMaterial', e.target.value)}
                            className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Aluminum"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-6"></div>

                {/* Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Frame Material */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Frame Material
                        </label>
                        <input
                            type="text"
                            value={formData.build?.frameMaterial || ''}
                            onChange={(e) => handleBuildChange('frameMaterial', e.target.value)}
                            className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Stainless Steel"
                        />
                    </div>

                    {/* Hinge Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Hinge Type
                        </label>
                        <input
                            type="text"
                            value={formData.build?.hingeType || ''}
                            onChange={(e) => handleBuildChange('hingeType', e.target.value)}
                            className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Dual Hinge"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-6"></div>

                {/* Water Resistance */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Water Resistance Rating
                    </label>
                    <select
                        value={formData.build?.waterResistance || ''}
                        onChange={(e) => handleBuildChange('waterResistance', e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                        <option value="">Select rating</option>
                        <option value="IPX7">IPX7</option>
                        <option value="IPX8">IPX8</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </div>

            {/* ============================================ */}
            {/* SECTION 3: PRODUCT TAGS */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                {/* Section Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-50 rounded-lg">
                            <TagIcon className="w-5 h-5 text-violet-600" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">Product Tags</h3>
                    </div>
                    <p className="text-sm text-slate-500 ml-11">
                        Tags help with search, filtering, and internal organization.
                    </p>
                </div>

                {/* Tag Input */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                        placeholder="Type a tag and press Enter"
                        maxLength={30}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono">Enter</kbd> to add tag (max 30 characters)
                    </p>
                </div>

                {/* Tags Display */}
                {formData.tags && formData.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100 hover:bg-indigo-100 transition-colors"
                            >
                                <span>{tag}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                                    title="Remove tag"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                        <TagIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-400">No tags added yet</p>
                        <p className="text-xs text-slate-400 mt-1">Start typing to add your first tag</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductPhysicalDetailsForm;
