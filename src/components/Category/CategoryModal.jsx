import { useState, useEffect, useMemo } from 'react';
import {
    XMarkIcon,
    PhotoIcon,
    TagIcon,
    GlobeAltIcon,
    FolderIcon,
    ArrowPathIcon,
    CloudArrowUpIcon,
    InformationCircleIcon,
    EyeIcon,
    StarIcon,
    ChevronDownIcon,
    CheckIcon,
    ChevronRightIcon
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
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const [isParentOpen, setIsParentOpen] = useState(false);
    const [dropdownExpanded, setDropdownExpanded] = useState(new Set());

    const toggleDropdownExpand = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        const newSet = new Set(dropdownExpanded);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setDropdownExpanded(newSet);
    };

    // ... (rest of state)

    useEffect(() => {
        if (category && mode === 'edit') {
            // ... (existing useEffect content)

            // Note: Make sure to keep this logic intact!
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                description: category.description || '',
                parentId: category.parentId?._id || category.parentId || '',
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
            setSlugManuallyEdited(true);
        } else {
            resetForm();
        }
    }, [category, mode, isOpen]);

    // ... (resetForm, helpers)

    const handleParentSelect = (id) => {
        handleChange('parentId', id);
        setIsParentOpen(false);
    };

    const selectedParent = flatCategories.find(c => c._id === formData.parentId);

    // ... (rest of component code)

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
        setSlugManuallyEdited(false);
    };

    const generateSlug = (name) => {
        return name.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'name' && !slugManuallyEdited && mode === 'create') {
            setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
        }

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSlugChange = (e) => {
        setSlugManuallyEdited(true);
        handleChange('slug', e.target.value);
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

    const handleRemoveImage = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: null,
            [`${field}Preview`]: null
        }));
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
                    if (formData[key] && formData[key] !== '' && formData[key] !== 'null') {
                        submitData.append(key, formData[key]);
                    }
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
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const renderDropdownItem = (node, level = 0) => {
        // Prevent selecting itself or its descendants as parent
        if (category && node._id === category._id) return null;

        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = dropdownExpanded.has(node._id);
        const isSelected = formData.parentId === node._id;

        return (
            <div key={node._id} className="select-none">
                <div
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors relative group
                        ${isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}
                    `}
                    style={{ paddingLeft: `${(level * 16) + 12}px` }}
                >
                    {/* Tree Guide Lines */}
                    {level > 0 && (
                        <>
                            <div className="absolute border-l border-slate-200" style={{ left: `${level * 16}px`, top: 0, bottom: '50%' }} />
                            <div className="absolute border-t border-slate-200 w-2" style={{ left: `${level * 16}px`, top: '50%' }} />
                        </>
                    )}

                    {/* Expand/Collapse Toggle */}
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center relative z-10" style={{ marginLeft: hasChildren ? '-6px' : '0' }}>
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={(e) => toggleDropdownExpand(e, node._id)}
                                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 transition-colors focus:outline-none"
                            >
                                {isExpanded ? (
                                    <ChevronDownIcon className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronRightIcon className="w-3.5 h-3.5" />
                                )}
                            </button>
                        ) : (
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                        )}
                    </div>

                    {/* Selection Click Area - Main Content */}
                    <button
                        type="button"
                        onClick={() => handleParentSelect(node._id)}
                        className="flex-1 flex items-center gap-2 text-left truncate focus:outline-none"
                    >
                        <FolderIcon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                        <span className="truncate">{node.name}</span>
                    </button>

                    {isSelected && <CheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0 ml-2" />}
                </div>

                {/* Recursive Children */}
                {hasChildren && isExpanded && (
                    <div className="relative">
                        {/* Continuous Vertical Line for Children */}
                        {level >= 0 && (
                            <div className="absolute border-l border-slate-200" style={{ left: `${(level + 1) * 16}px`, top: 0, bottom: 0 }} />
                        )}
                        {node.children.map(child => renderDropdownItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={handleClose} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{mode === 'create' ? 'Create New Category' : 'Edit Category'}</h2>
                            <p className="text-sm text-slate-500 mt-1">Define properties and hierarchy for your catalog.</p>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="bg-slate-50/50 border-b border-slate-100 flex px-8 flex-shrink-0">
                        {[
                            { id: 'basic', label: 'General Info', icon: FolderIcon },
                            { id: 'media', label: 'Visuals & Media', icon: PhotoIcon },
                            { id: 'seo', label: 'SEO & Meta', icon: GlobeAltIcon },
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
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-10 py-8 bg-white scrollbar-thin">
                            {/* Basic Info */}
                            {activeTab === 'basic' && (
                                <div className="grid grid-cols-12 gap-8">
                                    <div className="col-span-12 lg:col-span-8 space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Category Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg text-slate-900 placeholder:font-normal"
                                                placeholder="e.g. Summer Collection"
                                                autoFocus
                                            />
                                            {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Slug</label>
                                                <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                                                    <span className="bg-slate-50 px-4 py-3 text-slate-500 text-sm font-mono border-r border-slate-200">store.com/</span>
                                                    <input
                                                        type="text"
                                                        value={formData.slug}
                                                        onChange={handleSlugChange}
                                                        className="flex-1 px-4 py-3 bg-white border-none focus:ring-0 font-mono text-sm text-slate-900 font-medium"
                                                        placeholder="summer-collection"
                                                    />
                                                </div>
                                                {errors.slug && <p className="mt-1 text-xs font-bold text-red-500">{errors.slug}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                rows={4}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none text-slate-600"
                                                placeholder="Briefly describe this category for your customers..."
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-12 lg:col-span-4 space-y-6">
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                            <h4 className="font-bold text-slate-900 mb-4">Organization</h4>

                                            <div className="mb-6 relative">
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parent Category</label>

                                                {/* Custom Select Trigger */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsParentOpen(!isParentOpen)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-left focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FolderIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                                                        <span className={`text-sm font-medium truncate ${!selectedParent ? 'text-slate-900' : 'text-slate-700'}`}>
                                                            {selectedParent ? selectedParent.name : 'Root Category (No Parent)'}
                                                        </span>
                                                    </div>
                                                    <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isParentOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Backdrop to close */}
                                                {isParentOpen && (
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsParentOpen(false)} />
                                                )}

                                                {/* Dropdown Menu */}
                                                {isParentOpen && (
                                                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar flex flex-col p-1 animate-fade-in">
                                                        {/* Root Option */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleParentSelect('')}
                                                            className={`
                                                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors mb-1
                                                                ${formData.parentId === '' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}
                                                            `}
                                                        >
                                                            <div className="w-5 h-5 flex items-center justify-center">
                                                                <span className="text-lg leading-none">🚫</span>
                                                            </div>
                                                            <span className="flex-1">Root Category</span>
                                                            {formData.parentId === '' && <CheckIcon className="w-4 h-4 ml-auto" />}
                                                        </button>

                                                        {/* Separator */}
                                                        {allCategories.length > 0 && <div className="h-px bg-slate-100 my-1 mx-2" />}

                                                        {/* Categories Tree */}
                                                        <div className="space-y-0.5">
                                                            {allCategories.map(cat => renderDropdownItem(cat))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority Order</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.priority}
                                                    onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1.5">Lower numbers appear first</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Media Tab */}
                            {activeTab === 'media' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        {[
                                            { id: 'image', label: 'Thumbnail Image', desc: 'Used in grids and lists', ratio: 'Square / Portrait' },
                                            { id: 'banner', label: 'Header Banner', desc: 'Featured at top of category page', ratio: 'Wide (3:1)' }
                                        ].map(field => (
                                            <div key={field.id} className="col-span-2 sm:col-span-1">
                                                <div className="flex justify-between items-baseline mb-2">
                                                    <label className="block text-sm font-bold text-slate-700">{field.label}</label>
                                                    <span className="text-xs text-slate-400">{field.ratio}</span>
                                                </div>

                                                <div
                                                    className={`
                                                        relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all h-64 flex items-center justify-center overflow-hidden
                                                        ${formData[`${field.id}Preview`] ? 'border-indigo-500/50 bg-indigo-50' : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50'}
                                                    `}
                                                >
                                                    <input type="file" onChange={(e) => handleImageChange(field.id, e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />

                                                    {formData[`${field.id}Preview`] ? (
                                                        <div className="relative w-full h-full">
                                                            <img src={formData[`${field.id}Preview`]} className="w-full h-full object-cover" alt="Preview" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveImage(field.id); }}
                                                                    className="bg-white text-red-600 px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform"
                                                                >
                                                                    Remove Image
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center p-6">
                                                            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                                <CloudArrowUpIcon className="w-8 h-8" />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-900 mb-1">Click to upload</p>
                                                            <p className="text-xs text-slate-400">{field.desc}</p>
                                                            <p className="text-[10px] text-slate-300 mt-2 uppercase tracking-wide">PNG, JPG up to 5MB</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SEO Tab */}
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
                                                placeholder={formData.name || 'Category Name'}
                                            />
                                            <p className="text-xs text-slate-400 mt-1.5 flex justify-between">
                                                <span>Recommended length: 50-60 chars</span>
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
                                                <span>Recommended length: 150-160 chars</span>
                                                <span className={`${formData.metaDescription.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>{formData.metaDescription.length} chars</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-12 lg:col-span-5">
                                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                                            <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-4 text-sm">
                                                <GlobeAltIcon className="w-4 h-4 text-indigo-500" />
                                                Search Result Preview
                                            </h4>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm select-none">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px]">🌐</div>
                                                    <div className="text-xs text-slate-700">example.com › {formData.slug || 'category'}</div>
                                                </div>
                                                <h3 className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-medium mb-1 truncate">
                                                    {formData.metaTitle || formData.name || 'Category Title'}
                                                </h3>
                                                <p className="text-sm text-[#4d5156] line-clamp-2">
                                                    {formData.metaDescription || formData.description || 'This description will appear in search results. Make it compelling to attract clicks.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'advanced' && (
                                <div className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            {
                                                id: 'isVisible',
                                                title: 'Category Visibility',
                                                desc: 'Hidden categories are not shown in store menus',
                                                icon: EyeIcon,
                                                color: 'emerald'
                                            },
                                            {
                                                id: 'isFeatured',
                                                title: 'Featured Collection',
                                                desc: 'Highlight this category in homepage sections',
                                                icon: StarIcon,
                                                color: 'amber'
                                            },
                                            {
                                                id: 'showInNav',
                                                title: 'Show in Navigation',
                                                desc: 'Include in main header menu',
                                                icon: TagIcon,
                                                color: 'indigo'
                                            }
                                        ].map(setting => (
                                            <label key={setting.id} className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-full bg-${setting.color}-50 text-${setting.color}-600 group-hover:scale-110 transition-transform`}>
                                                        <setting.icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{setting.title}</p>
                                                        <p className="text-sm text-slate-500">{setting.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData[setting.id]}
                                                        onChange={(e) => handleChange(setting.id, e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-slate-100 px-8 py-5 flex justify-between items-center z-10 flex-shrink-0">
                            <div className="text-xs text-slate-400 hidden sm:block">
                                <span className="font-bold text-slate-900">*</span> Required fields
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 sm:flex-none px-8 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        mode === 'create' ? 'Create Category' : 'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CategoryModal;
