import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    XMarkIcon,
    PhotoIcon,
    TagIcon,
    CurrencyDollarIcon,
    CubeIcon,
    GlobeAltIcon,
    InformationCircleIcon,
    SparklesIcon,
    TruckIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

// API Imports
import categoryApi from '../../Api/Category/categoryApi';
import brandApi from '../../Api/Brands/brandApi';
import productApi from '../../Api/Product/productApi';

// Tab Components
import {
    BasicInfoTab,
    DescriptionsTab,
    PricingTab,
    MediaTab,
    SEOTab,
    MarketingTab,
    PhysicalTab
} from './ProductFormTabs';

const TABS = [
    { id: 'basic', name: 'Basic Info', icon: InformationCircleIcon },
    { id: 'descriptions', name: 'Descriptions', icon: TagIcon },
    { id: 'pricing', name: 'Pricing', icon: CurrencyDollarIcon },
    { id: 'media', name: 'Media', icon: PhotoIcon },
    { id: 'seo', name: 'SEO', icon: GlobeAltIcon },
    { id: 'marketing', name: 'Marketing', icon: SparklesIcon },
    { id: 'physical', name: 'Physical', icon: CubeIcon }
];

const EnhancedProductForm = ({ isOpen, onClose, onProductAdded, initialData }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        // Basic Info
        name: '',
        sku: '',
        category: '',
        subCategories: [],
        brand: '',
        department: '',
        status: 'draft',

        // Descriptions
        shortDescription: '',
        description: '',
        keyFeatures: [''],
        technicalSpecifications: [],

        // Pricing
        price: '',
        basePrice: '',
        costPrice: '',
        discount: 0,
        tax: 18,

        // Media
        image: null,
        imagePreview: '',
        gallery: [],
        galleryPreviews: [],
        videos: [],

        // SEO
        seo: {
            metaTitle: '',
            metaDescription: '',
            metaKeywords: [],
            canonicalUrl: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: ''
        },

        // Marketing
        badges: [],
        tags: [],
        searchKeywords: [],
        featured: false,
        displayPriority: 0,
        publishStatus: 'draft',
        visibility: {
            website: true,
            mobileApp: true,
            pos: false,
            marketplace: false
        },

        // Physical
        dimensions: {
            length: '',
            width: '',
            height: '',
            unit: 'cm'
        },
        weight: {
            value: '',
            unit: 'kg'
        },
        material: []
    });

    // Fetch categories and brands
    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchBrands();
            if (initialData) {
                populateForm(initialData);
            }
        }
    }, [isOpen, initialData]);

    const fetchCategories = async () => {
        try {
            const response = await categoryApi.getAll();
            // Handle response structure: response.data.data
            const categoryData = response.data?.data || response.data || [];
            setCategories(Array.isArray(categoryData) ? categoryData : []);
        } catch (error) {
            toast.error('Failed to load categories');
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await brandApi.getAll();
            // Handle response structure: response.data.data
            const brandData = response.data?.data || response.data || [];
            setBrands(Array.isArray(brandData) ? brandData : []);
        } catch (error) {
            toast.error('Failed to load brands');
        }
    };

    const populateForm = (data) => {
        setFormData({
            ...formData,
            ...data,
            // Handle populated fields (extract IDs)
            category: data.category?._id || data.category || '',
            brand: data.brand?._id || data.brand || '',
            subCategories: Array.isArray(data.subCategories)
                ? data.subCategories.map(cat => cat._id || cat)
                : [],
            // Deconstruct complex objects to avoid overwriting with merged data if structure differs
            seo: data.seo || formData.seo,
            visibility: data.visibility || formData.visibility,
            dimensions: data.dimensions || formData.dimensions,
            weight: data.weight || formData.weight,
            // Handle Gallery
            gallery: data.gallery || [],
            galleryPreviews: data.gallery?.map(img => img.url) || []
        });
    };

    const handleChange = (field, value) => {
        setFormData(prev => {
            const updates = { ...prev, [field]: value };

            // Special handling: Reset subcategories when category changes
            if (field === 'category' && value !== prev.category) {
                updates.subCategories = [];
            }

            return updates;
        });
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    const handleArrayAdd = (field, value = '') => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], value]
        }));
    };

    const handleArrayUpdate = (field, index, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item)
        }));
    };

    const handleArrayRemove = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => URL.createObjectURL(file));

        setFormData(prev => ({
            ...prev,
            gallery: [...prev.gallery, ...files],
            galleryPreviews: [...prev.galleryPreviews, ...previews]
        }));
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index),
            galleryPreviews: prev.galleryPreviews.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e, publishStatusOverride = null) => {
        if (e) e.preventDefault(); // Handle optional event
        setLoading(true);

        try {
            const formDataToSend = new FormData();

            // Determine effective status
            const effectivePublishStatus = publishStatusOverride || formData.publishStatus;

            // Basic fields
            formDataToSend.append('name', formData.name);
            formDataToSend.append('sku', formData.sku);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('brand', formData.brand);
            formDataToSend.append('status', formData.status);
            if (formData.version) formDataToSend.append('version', formData.version);

            // Handle Subcategories
            if (formData.subCategories && formData.subCategories.length > 0) {
                formDataToSend.append('subCategories', JSON.stringify(formData.subCategories));
            }

            // Pricing
            formDataToSend.append('price', formData.price);
            formDataToSend.append('basePrice', formData.basePrice);
            formDataToSend.append('costPrice', formData.costPrice);
            formDataToSend.append('discount', formData.discount);
            formDataToSend.append('tax', formData.tax);

            // Descriptions
            formDataToSend.append('shortDescription', formData.shortDescription);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('keyFeatures', JSON.stringify(formData.keyFeatures.filter(f => f.trim())));

            // SEO
            formDataToSend.append('seo', JSON.stringify(formData.seo));

            // Marketing
            formDataToSend.append('badges', JSON.stringify(formData.badges));
            formDataToSend.append('tags', JSON.stringify(formData.tags));
            formDataToSend.append('featured', formData.featured);
            formDataToSend.append('displayPriority', formData.displayPriority);
            formDataToSend.append('publishStatus', effectivePublishStatus);
            formDataToSend.append('visibility', JSON.stringify(formData.visibility));

            // Physical
            formDataToSend.append('dimensions', JSON.stringify(formData.dimensions));
            formDataToSend.append('weight', JSON.stringify(formData.weight));
            formDataToSend.append('material', JSON.stringify(formData.material));

            // Images
            if (formData.image instanceof File) {
                formDataToSend.append('image', formData.image);
            }
            else if (typeof formData.image === 'string' && formData.image.trim() !== '') {
                formDataToSend.append('image', formData.image);
            }

            // Handle Gallery: Split into existing (JSON) and new (Files)
            const existingGallery = [];

            formData.gallery.forEach(item => {
                if (item instanceof File) {
                    formDataToSend.append('gallery', item); // New file
                } else {
                    existingGallery.push(item); // Existing DB object
                }
            });

            // Send existing gallery items as JSON
            if (existingGallery.length > 0) {
                formDataToSend.append('gallery', JSON.stringify(existingGallery));
            }

            const response = initialData
                ? await productApi.update(initialData._id, formDataToSend)
                : await productApi.create(formDataToSend);

            toast.success(response.data?.message || 'Product saved successfully!');
            onProductAdded?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Container - Centered */}
            <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 animate-slideUp">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <CubeIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">
                                    {initialData ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="mt-1 text-sm text-indigo-100">
                                    Fill in the details below to {initialData ? 'update' : 'create'} your product
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="group p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 hover:rotate-90"
                        >
                            <XMarkIcon className="h-6 w-6 text-white" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="mt-6 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-white text-indigo-600 shadow-xl scale-105'
                                        : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{tab.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {/* Tab: Basic Info */}
                        {activeTab === 'basic' && (
                            <BasicInfoTab
                                formData={formData}
                                categories={categories}
                                brands={brands}
                                onChange={handleChange}
                            />
                        )}

                        {/* Tab: Descriptions */}
                        {activeTab === 'descriptions' && (
                            <DescriptionsTab
                                formData={formData}
                                onChange={handleChange}
                                onArrayAdd={handleArrayAdd}
                                onArrayUpdate={handleArrayUpdate}
                                onArrayRemove={handleArrayRemove}
                            />
                        )}

                        {/* Tab: Pricing */}
                        {activeTab === 'pricing' && (
                            <PricingTab
                                formData={formData}
                                onChange={handleChange}
                            />
                        )}

                        {/* Tab: Media */}
                        {activeTab === 'media' && (
                            <MediaTab
                                formData={formData}
                                onImageChange={handleImageChange}
                                onGalleryChange={handleGalleryChange}
                                onGalleryRemove={removeGalleryImage}
                            />
                        )}

                        {/* Tab: SEO */}
                        {activeTab === 'seo' && (
                            <SEOTab
                                formData={formData}
                                onNestedChange={handleNestedChange}
                            />
                        )}

                        {/* Tab: Marketing */}
                        {activeTab === 'marketing' && (
                            <MarketingTab
                                formData={formData}
                                onChange={handleChange}
                                onNestedChange={handleNestedChange}
                                onArrayAdd={handleArrayAdd}
                                onArrayUpdate={handleArrayUpdate}
                                onArrayRemove={handleArrayRemove}
                            />
                        )}

                        {/* Tab: Physical */}
                        {activeTab === 'physical' && (
                            <PhysicalTab
                                formData={formData}
                                onChange={handleChange}
                                onNestedChange={handleNestedChange}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-gray-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={(e) => handleSubmit(e, 'draft')}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={(e) => handleSubmit(e, 'published')}
                                    className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedProductForm;
