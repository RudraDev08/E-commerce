import { useState, useEffect } from 'react';
import {
    XMarkIcon,
    PhotoIcon,
    TagIcon,
    GlobeAltIcon,
    InformationCircleIcon,
    CloudArrowUpIcon,
    EyeIcon,
    StarIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const BrandModal = ({ isOpen, onClose, onSubmit, brand, mode = 'create' }) => {
    // ----------------------------------------------------------------------
    // State
    // ----------------------------------------------------------------------
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        isFeatured: false,
        showInNav: true,
        priority: 0,
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        logo: null,
        logoPreview: null,
        banner: null,
        bannerPreview: null
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // ----------------------------------------------------------------------
    // Effects
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (brand && mode === 'edit') {
            setFormData({
                name: brand.name || '',
                description: brand.description || '',
                status: brand.status || 'active',
                isFeatured: brand.isFeatured || false,
                showInNav: brand.showInNav !== undefined ? brand.showInNav : true,
                priority: brand.priority || 0,
                metaTitle: brand.metaTitle || '',
                metaDescription: brand.metaDescription || '',
                metaKeywords: brand.metaKeywords || '',
                logo: null,
                logoPreview: brand.logo ? `http://localhost:5000/uploads/${brand.logo.split(/[/\\]/).pop()}` : null,
                banner: null,
                bannerPreview: brand.banner ? `http://localhost:5000/uploads/${brand.banner.split(/[/\\]/).pop()}` : null
            });
        } else {
            resetForm();
        }
    }, [brand, mode, isOpen]);

    // ----------------------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------------------
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            status: 'active',
            isFeatured: false,
            showInNav: true,
            priority: 0,
            metaTitle: '',
            metaDescription: '',
            metaKeywords: '',
            logo: null,
            logoPreview: null,
            banner: null,
            bannerPreview: null
        });
        setErrors({});
        setActiveTab('basic');
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
    };

    const handleImageChange = (key, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setFormData(prev => ({
                ...prev,
                [key]: file,
                [`${key}Preview`]: URL.createObjectURL(file)
            }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Brand name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) { setActiveTab('basic'); return; }

        setLoading(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'logo' || key === 'banner') {
                    if (formData[key] instanceof File) submitData.append(key, formData[key]);
                } else if (!key.includes('Preview')) {
                    submitData.append(key, formData[key]);
                }
            });

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    // ----------------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------------
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={handleClose} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {mode === 'create' ? 'Create New Brand' : 'Edit Brand Identity'}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Manage brand details, visuals and visibility.</p>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="bg-slate-50/50 border-b border-slate-100 flex px-8 flex-shrink-0 overflow-x-auto">
                        {[
                            { id: 'basic', label: 'General Info', icon: InformationCircleIcon },
                            { id: 'visuals', label: 'Visual Identity', icon: PhotoIcon },
                            { id: 'seo', label: 'SEO & Meta', icon: GlobeAltIcon },
                            { id: 'settings', label: 'Configuration', icon: TagIcon }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 bg-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-10 py-8 bg-white scrollbar-thin">

                            {/* --- General Info --- */}
                            {activeTab === 'basic' && (
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Brand Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg text-slate-900 placeholder:font-normal"
                                            placeholder="e.g. Nike, Adidas"
                                            autoFocus
                                        />
                                        {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            rows={5}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none text-slate-600"
                                            placeholder="Tell the brand's story..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- Visuals --- */}
                            {activeTab === 'visuals' && (
                                <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
                                    {/* Logo Upload */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Brand Logo</label>
                                        <div className="flex gap-6 items-start">
                                            <div
                                                className={`
                                                    relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all w-40 h-40 flex items-center justify-center overflow-hidden bg-slate-50
                                                    ${formData.logoPreview ? 'border-indigo-500/50' : 'border-slate-300 hover:border-indigo-500'}
                                                `}
                                            >
                                                <input type="file" onChange={(e) => handleImageChange('logo', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                {formData.logoPreview ? (
                                                    <>
                                                        <img src={formData.logoPreview} alt="Preview" className="w-full h-full object-contain p-2" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-white text-xs font-bold">Change</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <PhotoIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                        <span className="text-xs text-slate-500 font-medium">Upload Logo</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-slate-900 mb-1">Logo Guidelines</h4>
                                                <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                                                    <li>Recommended size: 500x500px</li>
                                                    <li>Format: PNG (transparent) or SVG</li>
                                                    <li>Max file size: 5MB</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Banner Upload */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Brand Banner (Optional)</label>
                                        <div
                                            className={`
                                                relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all h-48 flex items-center justify-center overflow-hidden bg-slate-50
                                                ${formData.bannerPreview ? 'border-indigo-500/50' : 'border-slate-300 hover:border-indigo-500'}
                                            `}
                                        >
                                            <input type="file" onChange={(e) => handleImageChange('banner', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                            {formData.bannerPreview ? (
                                                <>
                                                    <img src={formData.bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white text-sm font-bold">Change Banner</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center">
                                                    <CloudArrowUpIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                                    <p className="text-sm font-bold text-slate-700">Drag & Drop or Click to Upload</p>
                                                    <p className="text-xs text-slate-400 mt-1">1200x400px recommended for best results.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- SEO --- */}
                            {activeTab === 'seo' && (
                                <div className="grid grid-cols-12 gap-8">
                                    <div className="col-span-12 lg:col-span-7 space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Meta Title</label>
                                            <input
                                                type="text"
                                                value={formData.metaTitle}
                                                onChange={(e) => handleChange('metaTitle', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                                placeholder={formData.name || 'Brand Name'}
                                            />
                                            <p className="text-xs text-slate-400 mt-1.5 flex justify-between">
                                                <span>Title shown in search results</span>
                                                <span className={`${formData.metaTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>{formData.metaTitle.length} chars</span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Meta Description</label>
                                            <textarea
                                                value={formData.metaDescription}
                                                onChange={(e) => handleChange('metaDescription', e.target.value)}
                                                rows={4}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                                                placeholder="Brief summary for search engines..."
                                            />
                                            <p className="text-xs text-slate-400 mt-1.5 flex justify-between">
                                                <span>Description under the title</span>
                                                <span className={`${formData.metaDescription.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>{formData.metaDescription.length} chars</span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Keywords</label>
                                            <input
                                                type="text"
                                                value={formData.metaKeywords}
                                                onChange={(e) => handleChange('metaKeywords', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                placeholder="sneakers, sports, fashion..."
                                            />
                                            <p className="text-xs text-slate-400 mt-1.5">Comma separated keywords</p>
                                        </div>
                                    </div>

                                    <div className="col-span-12 lg:col-span-5">
                                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                                            <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-4 text-sm">
                                                <GlobeAltIcon className="w-4 h-4 text-indigo-500" />
                                                Search Result Preview
                                            </h4>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm select-none">
                                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                                    yourstore.com <span className="text-slate-300">›</span> brands <span className="text-slate-300">›</span> {formData.name.toLowerCase() || 'brand'}
                                                </div>
                                                <div className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer truncate">
                                                    {formData.metaTitle || formData.name || 'Brand Name'}
                                                </div>
                                                <div className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                    {formData.metaDescription || formData.description || "The brand's description will appear here in search engine results."}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- Settings --- */}
                            {activeTab === 'settings' && (
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
                                        {[
                                            { id: 'status', label: 'Active Status', desc: 'Enable or disable this brand globally.', isBool: false },
                                            { id: 'isFeatured', label: 'Featured Brand', desc: 'Highlight this brand on the homepage.', isBool: true },
                                            { id: 'showInNav', label: 'Show in Navigation', desc: 'Include in the main menu dropdowns.', isBool: true }
                                        ].map(setting => (
                                            <div key={setting.id} className="flex items-center justify-between">
                                                <div>
                                                    <label className="text-sm font-bold text-slate-900">{setting.label}</label>
                                                    <p className="text-xs text-slate-500">{setting.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={setting.isBool ? formData[setting.id] : formData[setting.id] === 'active'}
                                                        onChange={(e) => handleChange(setting.id, setting.isBool ? e.target.checked : (e.target.checked ? 'active' : 'inactive'))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Display Priority</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                value={formData.priority}
                                                onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                                                className="w-24 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                            />
                                            <span className="text-xs text-slate-400">Higher numbers appear first</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {mode === 'create' ? 'Create Brand' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BrandModal;
