import { useState, useEffect } from 'react';
import {
    XMarkIcon,
    PhotoIcon,
    TagIcon,
    GlobeAltIcon,
    EyeIcon,
    EyeSlashIcon,
    StarIcon,
    FolderIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

const CategoryModal = ({ isOpen, onClose, onSubmit, category, mode = 'create', allCategories = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        parentId: null,
        status: 'active',
        isVisible: true,
        isFeatured: false,
        showInNav: true,
        priority: 0,
        // SEO Fields
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        // Media
        image: null,
        imagePreview: null,
        banner: null,
        bannerPreview: null,
        icon: '',
        // Tags
        tags: [],
        newTag: '',
        // Additional
        customFields: {}
    });

    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('basic'); // basic, seo, media, advanced
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category && mode === 'edit') {
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                description: category.description || '',
                parentId: category.parentId || null,
                status: category.status || 'active',
                isVisible: category.isVisible !== undefined ? category.isVisible : true,
                isFeatured: category.isFeatured || false,
                showInNav: category.showInNav !== undefined ? category.showInNav : true,
                priority: category.priority || 0,
                metaTitle: category.metaTitle || '',
                metaDescription: category.metaDescription || '',
                metaKeywords: category.metaKeywords || '',
                image: null,
                imagePreview: category.image || null,
                banner: null,
                bannerPreview: category.banner || null,
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
            parentId: null,
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
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-generate slug from name
        if (field === 'name' && mode === 'create') {
            setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
        }

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleImageChange = (field, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

    const handleAddTag = () => {
        const tag = formData.newTag.trim().toLowerCase();
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag],
                newTag: ''
            }));
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Category name is required';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            setActiveTab('basic');
            return;
        }

        setLoading(true);

        try {
            // Prepare form data for submission
            const submitData = new FormData();

            // Basic fields
            Object.keys(formData).forEach(key => {
                if (key === 'image' || key === 'banner') {
                    if (formData[key] instanceof File) {
                        submitData.append(key, formData[key]);
                    }
                } else if (key === 'tags') {
                    submitData.append(key, JSON.stringify(formData[key]));
                } else if (key === 'customFields') {
                    submitData.append(key, JSON.stringify(formData[key]));
                } else if (key === 'parentId') {
                    // Only append parentId if it has a valid value
                    if (formData[key] && formData[key] !== 'null' && formData[key] !== '') {
                        submitData.append(key, formData[key]);
                    }
                } else if (!key.includes('Preview') && key !== 'newTag') {
                    submitData.append(key, formData[key]);
                }
            });

            await onSubmit(submitData);
            handleClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors({ submit: error.message || 'Failed to save category. Please try again.' });
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <FolderIcon className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {mode === 'create' ? 'Create New Category' : 'Edit Category'}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {mode === 'create'
                                        ? 'Add a new category to organize your products'
                                        : 'Update category information and settings'
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 px-6 pt-4 border-b border-slate-200">
                        {[
                            { id: 'basic', label: 'Basic Info', icon: FolderIcon },
                            { id: 'seo', label: 'SEO', icon: GlobeAltIcon },
                            { id: 'media', label: 'Media', icon: PhotoIcon },
                            { id: 'advanced', label: 'Advanced', icon: TagIcon }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                                    ${activeTab === tab.id
                                        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                            {/* Basic Info Tab */}
                            {activeTab === 'basic' && (
                                <div className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Category Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="e.g., Electronics, Fashion, Home & Kitchen"
                                            className={`
                                                w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm
                                                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                                                ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}
                                            `}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Slug */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            URL Slug <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => handleChange('slug', e.target.value)}
                                            placeholder="e.g., electronics, fashion, home-kitchen"
                                            className={`
                                                w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm font-mono
                                                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                                                ${errors.slug ? 'border-red-300 bg-red-50' : 'border-slate-200'}
                                            `}
                                        />
                                        {errors.slug && (
                                            <p className="mt-1 text-xs text-red-600">{errors.slug}</p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-500">
                                            URL: /category/{formData.slug || 'your-slug'}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Brief description of this category..."
                                            rows={4}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                                        />
                                    </div>

                                    {/* Parent Category */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Parent Category
                                        </label>
                                        <select
                                            value={formData.parentId || ''}
                                            onChange={(e) => handleChange('parentId', e.target.value || null)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="">None (Root Category)</option>
                                            {allCategories.map(cat => (
                                                <option key={cat._id} value={cat._id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Select a parent to create a subcategory
                                        </p>
                                    </div>

                                    {/* Status & Visibility */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => handleChange('status', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Priority
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.priority}
                                                onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                                                min="0"
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <EyeIcon className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">Visible</p>
                                                    <p className="text-xs text-slate-500">Show this category on the website</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.isVisible}
                                                onChange={(e) => handleChange('isVisible', e.target.checked)}
                                                className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </label>

                                        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <StarIcon className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">Featured</p>
                                                    <p className="text-xs text-slate-500">Highlight this category</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.isFeatured}
                                                onChange={(e) => handleChange('isFeatured', e.target.checked)}
                                                className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </label>

                                        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FolderIcon className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">Show in Navigation</p>
                                                    <p className="text-xs text-slate-500">Display in main menu</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.showInNav}
                                                onChange={(e) => handleChange('showInNav', e.target.checked)}
                                                className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* SEO Tab */}
                            {activeTab === 'seo' && (
                                <div className="space-y-5">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <GlobeAltIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-blue-900">SEO Optimization</h4>
                                                <p className="text-xs text-blue-700 mt-1">
                                                    Improve search engine visibility with optimized meta tags
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Meta Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.metaTitle}
                                            onChange={(e) => handleChange('metaTitle', e.target.value)}
                                            placeholder={formData.name || 'Category meta title'}
                                            maxLength={60}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">
                                            {formData.metaTitle.length}/60 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Meta Description
                                        </label>
                                        <textarea
                                            value={formData.metaDescription}
                                            onChange={(e) => handleChange('metaDescription', e.target.value)}
                                            placeholder="Brief description for search engines..."
                                            maxLength={160}
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">
                                            {formData.metaDescription.length}/160 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Meta Keywords
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.metaKeywords}
                                            onChange={(e) => handleChange('metaKeywords', e.target.value)}
                                            placeholder="keyword1, keyword2, keyword3"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">
                                            Separate keywords with commas
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Media Tab */}
                            {activeTab === 'media' && (
                                <div className="space-y-5">
                                    {/* Category Image */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Category Image
                                        </label>
                                        <div className="flex items-start gap-4">
                                            {formData.imagePreview && (
                                                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-200">
                                                    <img
                                                        src={formData.imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('imagePreview', null)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            <label className="flex-1 flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                                                <PhotoIcon className="w-10 h-10 text-slate-400 mb-2" />
                                                <p className="text-sm font-medium text-slate-700">Upload Image</p>
                                                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageChange('image', e)}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        {errors.image && (
                                            <p className="mt-1 text-xs text-red-600">{errors.image}</p>
                                        )}
                                    </div>

                                    {/* Banner Image */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Banner Image
                                        </label>
                                        <div className="flex items-start gap-4">
                                            {formData.bannerPreview && (
                                                <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-slate-200">
                                                    <img
                                                        src={formData.bannerPreview}
                                                        alt="Banner Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('bannerPreview', null)}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            {!formData.bannerPreview && (
                                                <label className="flex-1 flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                                                    <PhotoIcon className="w-10 h-10 text-slate-400 mb-2" />
                                                    <p className="text-sm font-medium text-slate-700">Upload Banner</p>
                                                    <p className="text-xs text-slate-500 mt-1">Recommended: 1920x400px</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageChange('banner', e)}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Icon */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Icon Class (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.icon}
                                            onChange={(e) => handleChange('icon', e.target.value)}
                                            placeholder="e.g., fa-laptop, heroicon-device-phone-mobile"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">
                                            Icon class name for category representation
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Advanced Tab */}
                            {activeTab === 'advanced' && (
                                <div className="space-y-5">
                                    {/* Tags */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Tags
                                        </label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={formData.newTag}
                                                onChange={(e) => handleChange('newTag', e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                                placeholder="Add a tag..."
                                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddTag}
                                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        {formData.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                                                    >
                                                        <TagIcon className="w-3.5 h-3.5" />
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTag(tag)}
                                                            className="ml-1 hover:text-indigo-900"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="mt-2 text-xs text-slate-500">
                                            Tags help organize and filter categories (e.g., trending, new, best-seller)
                                        </p>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Additional Information</h4>
                                        <p className="text-xs text-slate-500">
                                            Custom fields and advanced settings can be added here based on your requirements.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Submit Error */}
                            {errors.submit && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">{errors.submit}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="w-5 h-5" />
                                        {mode === 'create' ? 'Create Category' : 'Update Category'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CategoryModal;
