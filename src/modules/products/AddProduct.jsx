import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  CubeIcon,
  GlobeAltIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

// API Imports
import categoryApi from '../../Api/Category/categoryApi';
import brandApi from '../../Api/Brands/brandApi';
import productApi from '../../Api/Product/productApi';

const AddProductModal = ({ isOpen, onClose, onProductAdded, initialData }) => {
  // ----------------------------------------------------------------------
  // State
  // ----------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  // Selectors Data
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productTypes, setProductTypes] = useState([]); // Placeholder for now

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    brand: '',
    productType: '',
    description: '',
    shortDescription: '',
    price: '',
    basePrice: '',
    currency: 'USD',
    taxClass: 'standard',
    stock: '',
    minStock: 5,
    stockStatus: 'in_stock',
    hasVariants: false,
    image: null,
    imagePreview: null,
    gallery: [],
    galleryPreviews: [],
    tags: '',
    metaTitle: '',
    metaDescription: '',
    status: 'active'
  });

  // ----------------------------------------------------------------------
  // Effects
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      setupForm();
    }
  }, [isOpen, initialData]);

  const setupForm = async () => {
    // Fetch Dependencies
    try {
      const [catRes, brandRes] = await Promise.all([
        categoryApi.getAll({ status: 'active', limit: 1000 }), // Get all active categories
        brandApi.getAll({ status: 'active', limit: 1000 })     // Get all active brands
      ]);
      setCategories(catRes.data.data || []);
      setBrands(brandRes.data.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load dependency data");
    }

    // Initialize Data
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        category: initialData.category?._id || initialData.category || '',
        brand: initialData.brand?._id || initialData.brand || '',
        productType: initialData.productType?._id || initialData.productType || '',
        description: initialData.description || '',
        shortDescription: initialData.shortDescription || '',
        price: initialData.price || '',
        basePrice: initialData.basePrice || '',
        currency: initialData.currency || 'USD',
        taxClass: initialData.taxClass || 'standard',
        stock: initialData.stock || '',
        minStock: initialData.minStock || 5,
        stockStatus: initialData.stockStatus || 'in_stock',
        hasVariants: initialData.hasVariants || false,
        variantType: initialData.variantType || 'SINGLE_COLOR',
        image: initialData.image || null,
        imagePreview: initialData.image ? `http://localhost:5000/uploads/${initialData.image.split(/[/\\]/).pop()}` : null,
        gallery: initialData.gallery || [],
        galleryPreviews: (initialData.gallery || []).map(g => `http://localhost:5000/uploads/${g.split(/[/\\]/).pop()}`),
        tags: (initialData.tags || []).join(', '),
        metaTitle: initialData.metaTitle || '',
        metaDescription: initialData.metaDescription || '',
        status: initialData.status || 'active'
      });
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', sku: '', category: '', brand: '', productType: '',
      description: '', shortDescription: '',
      price: '', basePrice: '', currency: 'USD', taxClass: 'standard',
      stock: '', minStock: 5, stockStatus: 'in_stock', hasVariants: false, variantType: 'SINGLE_COLOR',
      image: null, imagePreview: null,
      gallery: [], galleryPreviews: [],
      tags: '', metaTitle: '', metaDescription: '', status: 'active'
    });
    setActiveTab('general');
  };

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
    if (files.length > 0) {
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...files],
        galleryPreviews: [...prev.galleryPreviews, ...newPreviews]
      }));
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
      galleryPreviews: prev.galleryPreviews.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    if (!formData.name) return "Product name is required";
    if (!formData.category) return "Category is required";
    if (!formData.brand) return "Brand is required";
    if (Number(formData.price) < 0) return "Price cannot be negative";
    if (!formData.hasVariants && Number(formData.stock) < 0) return "Stock cannot be negative";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) { toast.error(error); return; }

    setLoading(true);
    try {
      const submitData = new FormData();

      // Append simple fields
      Object.keys(formData).forEach(key => {
        if (key === 'gallery' || key === 'image' || key.includes('Preview')) return;

        if (key === 'tags') {
          // Split tags by comma and trim
          formData.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(tag => {
            submitData.append('tags', tag);
          });
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Append Files & Existing Images
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      formData.gallery.forEach(item => {
        submitData.append('gallery', item);
      });

      if (initialData) {
        await productApi.update(initialData._id, submitData);
        toast.success("Product updated successfully");
      } else {
        await productApi.create(submitData);
        toast.success("Product created successfully");
      }

      onProductAdded();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto font-sans">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">

          {/* Header */}
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {initialData ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Configure product details, inventory and media.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <XMarkIcon className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-slate-50/80 border-b border-slate-100 px-8 flex gap-6 overflow-x-auto">
            {[
              { id: 'general', label: 'General Info', icon: InformationCircleIcon },
              { id: 'pricing', label: 'Pricing', icon: CurrencyDollarIcon },
              { id: 'inventory', label: 'Inventory', icon: CubeIcon },
              { id: 'media', label: 'Media', icon: PhotoIcon },
              { id: 'seo', label: 'SEO & Meta', icon: GlobeAltIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
            <form id="product-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">

              {/* --- TAB: General --- */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-2">
                    <label className="label">Product Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="input-field text-lg font-bold"
                      placeholder="e.g. Wireless Noise Cancelling Headphones"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="label">Category <span className="text-red-500">*</span></label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Brand <span className="text-red-500">*</span></label>
                    <select
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value)}
                      className="input-field font-mono"
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div>
                    <label className="label">Product Type (Variant Spec)</label>
                    <select
                      value={formData.productType}
                      onChange={(e) => handleChange('productType', e.target.value)}
                      className="input-field"
                      disabled // Until integrated with types
                    >
                      <option value="">Default Type</option>
                      {/* Future: Product Types */}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="label">Description</label>
                    <textarea
                      rows={5}
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="input-field resize-y"
                      placeholder="Detailed product description..."
                    />
                  </div>
                </div>
              )}

              {/* --- TAB: Pricing --- */}
              {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-2">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-emerald-500" />
                      Product Pricing
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="label">Selling Price <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                            <select
                              value={formData.currency}
                              onChange={(e) => handleChange('currency', e.target.value)}
                              className="bg-slate-100 border-none rounded-md text-sm font-bold text-slate-700 py-1 pl-2 pr-1 cursor-pointer hover:bg-slate-200 outline-none focus:ring-2 focus:ring-indigo-100"
                              style={{ appearance: 'none', WebkitAppearance: 'none', textAlign: 'center' }}
                            >
                              <option value="USD">$</option>
                              <option value="EUR">€</option>
                              <option value="INR">₹</option>
                              <option value="GBP">£</option>
                            </select>
                          </div>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleChange('price', e.target.value)}
                            className="input-field !pl-20 font-bold text-lg"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Compare at Price (MRP)</label>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                            <span className="bg-slate-100 border-none rounded-md text-sm font-bold text-slate-500 py-1 px-3 select-none">
                              {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'INR' ? '₹' : '£'}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={formData.basePrice}
                            onChange={(e) => handleChange('basePrice', e.target.value)}
                            className="input-field !pl-20 text-slate-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: Inventory --- */}
              {activeTab === 'inventory' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg">Has Variants?</h4>
                      <p className="text-slate-400 text-sm mt-1">Enable if product has multiple options like Size or Color.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasVariants}
                        onChange={(e) => handleChange('hasVariants', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {formData.hasVariants && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <label className="label">Variant Configuration Strategy</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          onClick={() => handleChange('variantType', 'SINGLE_COLOR')}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.variantType === 'SINGLE_COLOR' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                            <span className="font-bold text-slate-900">Single Color</span>
                          </div>
                          <p className="text-xs text-slate-500">Best for T-Shirts, Mobiles. (e.g. Red, Blue, Black)</p>
                        </div>

                        <div
                          onClick={() => handleChange('variantType', 'COLORWAY')}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.variantType === 'COLORWAY' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className="flex items-center gap-1 mb-2">
                            <div className="w-4 h-4 rounded-full bg-red-500 border border-white -mr-2 z-10"></div>
                            <div className="w-4 h-4 rounded-full bg-black border border-white -mr-2 z-0"></div>
                            <div className="w-4 h-4 rounded-full bg-white border border-slate-200 z-0"></div>
                            <span className="font-bold text-slate-900 ml-2">Colorway</span>
                          </div>
                          <p className="text-xs text-slate-500">Best for Sneakers. (e.g. Chicago, Bred, Panda)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!formData.hasVariants && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-2 gap-6">
                      <div>
                        <label className="label">Current Stock <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => handleChange('stock', e.target.value)}
                          className="input-field font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="label">Low Stock Threshold</label>
                        <input
                          type="number"
                          value={formData.minStock}
                          onChange={(e) => handleChange('minStock', e.target.value)}
                          className="input-field font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Stock Status</label>
                        <select
                          value={formData.stockStatus}
                          onChange={(e) => handleChange('stockStatus', e.target.value)}
                          className="input-field"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="pre_order">Pre-Order</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB: Media --- */}
              {activeTab === 'media' && (
                <div className="space-y-8">
                  {/* Primary Image */}
                  <div>
                    <label className="label">Primary Image</label>
                    <div className="flex gap-6 items-start">
                      <div className="w-48 h-48 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center relative overflow-hidden group hover:border-indigo-500 transition-colors">
                        <input
                          type="file"
                          onChange={handleImageChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {formData.imagePreview ? (
                          <img src={formData.imagePreview} className="w-full h-full object-contain p-2" alt="Primary" />
                        ) : (
                          <PhotoIcon className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 pt-4">
                        <h4 className="font-bold text-slate-900">Main Product Shot</h4>
                        <p className="text-sm text-slate-500 mt-1">Used on cards, cleaner, and cart.</p>
                      </div>
                    </div>
                  </div>

                  {/* Gallery */}
                  <div>
                    <label className="label">Gallery Images</label>
                    <div className="grid grid-cols-5 gap-4">
                      {formData.galleryPreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square bg-white border border-slate-200 rounded-xl overflow-hidden group">
                          <img src={src} className="w-full h-full object-cover" alt="Gallery" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(i)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:border-indigo-400 cursor-pointer transition-all">
                        <input
                          type="file"
                          multiple
                          onChange={handleGalleryChange}
                          className="hidden"
                        />
                        <span className="text-3xl text-slate-300">+</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: SEO --- */}
              {activeTab === 'seo' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <label className="label">Meta Title</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => handleChange('metaTitle', e.target.value)}
                      className="input-field"
                      placeholder={formData.name}
                    />
                  </div>
                  <div>
                    <label className="label">Meta Description</label>
                    <textarea
                      rows={3}
                      value={formData.metaDescription}
                      onChange={(e) => handleChange('metaDescription', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Tags (Comma separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleChange('tags', e.target.value)}
                      className="input-field"
                      placeholder="summer, new arrival, best seller"
                    />
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="bg-slate-100 border-none rounded-lg text-sm font-bold text-slate-700 py-2 px-3 outline-none"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Hidden</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                form="product-form"
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (initialData ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
                .label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.5rem;
                }
                .input-field {
                    width: 100%;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    font-weight: 500;
                    color: #1e293b;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    outline: none;
                    background-color: #ffffff;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }
            `}</style>
    </div>
  );
};

export default AddProductModal;