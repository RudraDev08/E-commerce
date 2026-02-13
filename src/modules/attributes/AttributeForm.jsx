import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAttributes from '../../hooks/useAttributes';
import { ArrowLeftIcon, SaveIcon } from 'lucide-react';

const AttributeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { getAttributeTypeById, createAttributeType, updateAttributeType, selectedAttribute, loading } = useAttributes();
    const [isEditMode, setIsEditMode] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'specification',
        inputType: 'dropdown',
        displayStyle: 'inline',
        showInFilters: true,
        showInVariants: true,
        description: '',
        validationRules: {
            isRequired: false,
            allowMultipleSelection: false
        },
        measurementConfig: {
            hasMeasurements: false,
            unit: 'none'
        }
    });

    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            getAttributeTypeById(id);
        }
    }, [id, getAttributeTypeById]);

    useEffect(() => {
        if (selectedAttribute && isEditMode) {
            setFormData({
                name: selectedAttribute.name || '',
                code: selectedAttribute.code || '',
                category: selectedAttribute.category || 'specification',
                inputType: selectedAttribute.inputType || 'dropdown',
                displayStyle: selectedAttribute.displayStyle || 'inline',
                showInFilters: selectedAttribute.showInFilters ?? true,
                showInVariants: selectedAttribute.showInVariants ?? true,
                description: selectedAttribute.description || '',
                validationRules: {
                    isRequired: selectedAttribute.validationRules?.isRequired || false,
                    allowMultipleSelection: selectedAttribute.validationRules?.allowMultipleSelection || false
                },
                measurementConfig: {
                    hasMeasurements: selectedAttribute.measurementConfig?.hasMeasurements || false,
                    unit: selectedAttribute.measurementConfig?.unit || 'none'
                }
            });
        }
    }, [selectedAttribute, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await updateAttributeType(id, formData);
            } else {
                await createAttributeType(formData);
            }
            navigate('/attributes');
        } catch (error) {
            console.error("Form submission error", error);
        }
    };

    if (loading && isEditMode && !selectedAttribute) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/attributes')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {isEditMode ? 'Edit Attribute' : 'Create New Attribute'}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">Configure attribute settings</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <SaveIcon className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Attribute'}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Attribute Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="e.g. Material, RAM, Fabric"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Attribute Code (Slug)</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                                    placeholder="e.g. MATERIAL_TYPE"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option value="physical">Physical</option>
                                    <option value="visual">Visual</option>
                                    <option value="technical">Technical</option>
                                    <option value="material">Material</option>
                                    <option value="style">Style</option>
                                    <option value="specification">Specification</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                    placeholder="Internal description for admins..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Input Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Input Type</label>
                                <select
                                    name="inputType"
                                    value={formData.inputType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option value="dropdown">Dropdown Select</option>
                                    <option value="button">Button Group</option>
                                    <option value="swatch">Visual Swatch (Color/Image)</option>
                                    <option value="radio">Radio List</option>
                                    <option value="checkbox">Checkbox List</option>
                                    <option value="text_input">Text Input</option>
                                    <option value="number_input">Number Input</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Display Style</label>
                                <select
                                    name="displayStyle"
                                    value={formData.displayStyle}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option value="inline">Inline</option>
                                    <option value="grid">Grid (2+ Cols)</option>
                                    <option value="list">Vertical List</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4">
                            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    name="showInFilters"
                                    checked={formData.showInFilters}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="font-bold text-sm text-slate-700">Show in Filters</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    name="showInVariants"
                                    checked={formData.showInVariants}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="font-bold text-sm text-slate-700">Allow in Variants</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    name="validationRules.isRequired"
                                    checked={formData.validationRules.isRequired}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="font-bold text-sm text-slate-700">Required Field</span>
                            </label>
                        </div>
                    </div>

                    {/* Measurement Configuration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Measurement Config</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="measurementConfig.hasMeasurements"
                                    checked={formData.measurementConfig.hasMeasurements}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="text-sm font-medium text-slate-600">Enable Units</span>
                            </label>
                        </div>

                        {formData.measurementConfig.hasMeasurements && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Base Unit</label>
                                    <select
                                        name="measurementConfig.unit"
                                        value={formData.measurementConfig.unit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="none">None</option>
                                        <option value="cm">Centimeters (cm)</option>
                                        <option value="m">Meters (m)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="g">Grams (g)</option>
                                        <option value="gb">Gigabytes (GB)</option>
                                        <option value="tb">Terabytes (TB)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AttributeForm;
