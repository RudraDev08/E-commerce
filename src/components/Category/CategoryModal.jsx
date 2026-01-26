import { useState, useEffect, useMemo } from 'react';
import {
    XMarkIcon,
    PhotoIcon,
    TagIcon,
    GlobeAltIcon,
    EyeIcon,
    StarIcon,
    FolderIcon,
    CheckIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CategoryModal = ({ isOpen, onClose, onSubmit, category, mode = 'create', allCategories = [] }) => {
    // ----------------------------------------------------------------------
    // 🛠️ TREE FLATTENER FOR DROPDOWN
    // ----------------------------------------------------------------------
    const flatCategories = useMemo(() => {
        const flatten = (nodes, level = 0) => {
            let result = [];
            nodes.forEach(node => {
                // Prevent selecting itself as parent (infinite loop prevention)
                if (category && node._id === category._id) return;

                result.push({ ...node, level });
                if (node.children && node.children.length > 0) {
                    result = result.concat(flatten(node.children, level + 1));
                }
            });
            return result;
        };
        // Sort roots alphabetically before flattening? 
        // Typically tree order is preserved from backend (priority/name).
        return flatten(allCategories);
    }, [allCategories, category]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        parentId: '', // '' represents Root (null)
        status: 'active',
        isVisible: true,
        isFeatured: false,
        showInNav: true,
        priority: 0,
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        image: null,
        imagePreview: null,
        banner: null,
        bannerPreview: null,
        icon: '',
        tags: [],
        newTag: '',
        customFields: {}
    });

    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category && mode === 'edit') {
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                description: category.description || '',
                parentId: category.parentId?._id || category.parentId || '', // Handle populated object or ID
                status: category.status || 'active',
                isVisible: category.isVisible !== undefined ? category.isVisible : true,
                isFeatured: category.isFeatured || false,
                showInNav: category.showInNav !== undefined ? category.showInNav : true,
                priority: category.priority || 0,
                metaTitle: category.metaTitle || '',
                metaDescription: category.metaDescription || '',
                metaKeywords: category.metaKeywords || '',
                image: null,
                imagePreview: category.image ? (category.image.startsWith('http') ? category.image : `http://localhost:5000/${category.image}`) : null,
                banner: null,
                bannerPreview: category.banner ? (category.banner.startsWith('http') ? category.banner : `http://localhost:5000/${category.banner}`) : null,
                icon: category.icon || '',
                tags: category.tags || [],
                newTag: '',
                customFields: category.customFields || {}
            });
        } else {
            resetForm();
        }
    }, [category, mode, isOpen]);

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            parentId: '',
            status: 'active',
            isVisible: true,
            isFeatured: false,
            showInNav: true,
            priority: 0,
            metaTitle: '',
            metaDescription: '',
            metaKeywords: '',
            image: null,
            imagePreview: null,
            banner: null,
            bannerPreview: null,
            icon: '',
            tags: [],
            newTag: '',
            customFields: {}
        });
        setErrors({});
        setActiveTab('basic');
    };

    const generateSlug = (name) => {
        return name.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'name' && mode === 'create') {
            setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
        }

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleImageChange = (field, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, [field]: 'File size must be less than 5MB' }));
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    [field]: file,
                    [`${field}Preview`]: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // simplified tag handlers ... (same as before)
    const handleAddTag = () => {
        const tag = formData.newTag.trim().toLowerCase();
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag], newTag: '' }));
        }
    };
    const handleRemoveTag = (t) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== t) }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Category name is required';
        if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
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
                if (key === 'image' || key === 'banner') {
                    if (formData[key] instanceof File) submitData.append(key, formData[key]);
                } else if (key === 'tags' || key === 'customFields') {
                    submitData.append(key, JSON.stringify(formData[key]));
                } else if (key === 'parentId') {
                    // Only append if strict valid value
                    if (formData[key] && formData[key] !== '' && formData[key] !== 'null') {
                        submitData.append(key, formData[key]);
                    }
                    // Do NOT append empty string. Let backend handle undefined as null.
                } else if (!key.includes('Preview') && key !== 'newTag') {
                    submitData.append(key, formData[key]);
                }
            });
            await onSubmit(submitData);
            handleClose();
        } catch (error) {
            console.error('Submit Error:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to save';
            setErrors({ submit: msg });
            toast.error(msg);
            // DEBUG: Show full server error details
            if (error.response?.data) {
                alert(`Server Error Details:\n${JSON.stringify(error.response.data, null, 2)}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{mode === 'create' ? 'Create Category' : 'Edit Category'}</h2>
                            <p className="text-sm text-slate-500 mt-1">Configure hierarchy and settings</p>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <XMarkIcon className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="bg-slate-50/50 border-b border-slate-100 flex px-8">
                        {[
                            { id: 'basic', label: 'General', icon: FolderIcon },
                            { id: 'seo', label: 'SEO & Metadata', icon: GlobeAltIcon },
                            { id: 'media', label: 'Images', icon: PhotoIcon },
                            { id: 'advanced', label: 'Settings', icon: TagIcon }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 bg-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-[600px]">
                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            {/* Basic Info */}
                            {activeTab === 'basic' && (
                                <div className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Category Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900"
                                                placeholder="e.g. Smartphones"
                                                autoFocus
                                            />
                                            {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Slug (URL)</label>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => handleChange('slug', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Parent Category</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.parentId}
                                                    onChange={(e) => handleChange('parentId', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer font-medium text-slate-700"
                                                >
                                                    <option value="" className="font-bold text-slate-900 border-b">🚫 No Parent (Root Category)</option>
                                                    {flatCategories.map(cat => (
                                                        <option key={cat._id} value={cat._id} className="text-slate-700">
                                                            {'\u00A0'.repeat(cat.level * 4)}
                                                            {cat.level > 0 ? '└ ' : ''}
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                                    <FolderIcon className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                                <ArrowPathIcon className="w-3 h-3" />
                                                Select a parent to nest this category under
                                            </p>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SEO Tab */}
                            {activeTab === 'seo' && (
                                <div className="space-y-6 max-w-2xl">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-4">
                                        <GlobeAltIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-indigo-900">Search Engine Optimization</h4>
                                            <p className="text-sm text-indigo-700 mt-1">Optimize how this category appears in Google search results.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Meta Title</label>
                                        <input
                                            type="text"
                                            value={formData.metaTitle}
                                            onChange={(e) => handleChange('metaTitle', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            placeholder={formData.name}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Meta Description</label>
                                        <textarea
                                            value={formData.metaDescription}
                                            onChange={(e) => handleChange('metaDescription', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Media Tab */}
                            {activeTab === 'media' && (
                                <div className="space-y-8">
                                    {/* Image Logic here... (Simplified for brevity as logic is sound in original) */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Thumbnail</label>
                                            <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all h-48 flex items-center justify-center overflow-hidden">
                                                <input type="file" onChange={(e) => handleImageChange('image', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                {formData.imagePreview ? (
                                                    <img src={formData.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                                ) : (
                                                    <div className="text-center">
                                                        <PhotoIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                        <p className="text-sm font-bold text-slate-600">Upload Thumbnail</p>
                                                        <p className="text-xs text-slate-400">JPG, PNG up to 5MB</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Banner ... similar */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Banner</label>
                                            <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all h-48 flex items-center justify-center overflow-hidden">
                                                <input type="file" onChange={(e) => handleImageChange('banner', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                {formData.bannerPreview ? (
                                                    <img src={formData.bannerPreview} className="w-full h-full object-cover" alt="Preview" />
                                                ) : (
                                                    <div className="text-center">
                                                        <PhotoIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                        <p className="text-sm font-bold text-slate-600">Upload Banner</p>
                                                        <p className="text-xs text-slate-400">Wide format recommended</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'advanced' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Visibility</label>
                                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isVisible}
                                                    onChange={(e) => handleChange('isVisible', e.target.checked)}
                                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-900">Visible on Storefront</p>
                                                    <p className="text-xs text-slate-500">Show this category to customers</p>
                                                </div>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Featured</label>
                                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isFeatured}
                                                    onChange={(e) => handleChange('isFeatured', e.target.checked)}
                                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-900">Mark as Featured</p>
                                                    <p className="text-xs text-slate-500">Highlight in main sections</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-slate-100 px-8 py-5 flex justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                                {mode === 'create' ? 'Create Category' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CategoryModal;
