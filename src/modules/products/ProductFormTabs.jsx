/**
 * Product Form Tab Components
 * Individual tab content for the Enhanced Product Form
 */
import SearchableSelect from '../../components/common/SearchableSelect';


// ============================================================================
// TAB 1: BASIC INFO
// ============================================================================
export const BasicInfoTab = ({ formData, categories, brands, onChange }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Enter product name"
                    required
                />
            </div>

            {/* SKU */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => onChange('sku', e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="PROD-001"
                    required
                />
                <p className="mt-1 text-xs text-gray-500">Auto-generated if left empty</p>
            </div>

            {/* Status */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                </label>
                <select
                    value={formData.status}
                    onChange={(e) => onChange('status', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                </select>
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.category}
                    onChange={(e) => onChange('category', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    required
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Brand */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.brand}
                    onChange={(e) => onChange('brand', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    required
                >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                        <option key={brand._id} value={brand._id}>
                            {brand.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Department */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                </label>
                <select
                    value={formData.department}
                    onChange={(e) => onChange('department', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                    <option value="">Select Department</option>
                    <option value="mens">Men's</option>
                    <option value="womens">Women's</option>
                    <option value="kids">Kids</option>
                    <option value="unisex">Unisex</option>
                    <option value="home">Home</option>
                    <option value="electronics">Electronics</option>
                    <option value="other">Other</option>
                </select>
            </div>
        </div>
    </div>
);

// ============================================================================
// TAB 2: DESCRIPTIONS
// ============================================================================
export const DescriptionsTab = ({ formData, onChange, onArrayAdd, onArrayUpdate, onArrayRemove }) => (
    <div className="space-y-6">
        {/* Short Description */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
            </label>
            <textarea
                value={formData.shortDescription}
                onChange={(e) => onChange('shortDescription', e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Brief description for listing pages (max 500 characters)"
            />
            <p className="mt-1 text-xs text-gray-500">
                {formData.shortDescription.length}/500 characters
            </p>
        </div>

        {/* Long Description */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description
            </label>
            <textarea
                value={formData.description}
                onChange={(e) => onChange('description', e.target.value)}
                rows={8}
                maxLength={5000}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Detailed product description (supports HTML)"
            />
            <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/5000 characters
            </p>
        </div>

        {/* Key Features */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Features
            </label>
            <div className="space-y-2">
                {formData.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex space-x-2">
                        <input
                            type="text"
                            value={feature}
                            onChange={(e) => onArrayUpdate('keyFeatures', index, e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            placeholder={`Feature ${index + 1}`}
                        />
                        <button
                            type="button"
                            onClick={() => onArrayRemove('keyFeatures', index)}
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                        >
                            Remove
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => onArrayAdd('keyFeatures', '')}
                    className="rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-indigo-500 hover:text-indigo-600 w-full"
                >
                    + Add Feature
                </button>
            </div>
        </div>
    </div>
);

// ============================================================================
// TAB 3: PRICING
// ============================================================================
export const PricingTab = ({ formData, onChange }) => {
    const calculatedDiscountPrice = formData.basePrice && formData.discount
        ? Number(formData.basePrice) * (1 - Number(formData.discount) / 100)
        : Number(formData.price) || 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                {/* Selling Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => onChange('price', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="999"
                        required
                    />
                </div>

                {/* Base Price (MRP) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Price / MRP (₹)
                    </label>
                    <input
                        type="number"
                        value={formData.basePrice}
                        onChange={(e) => onChange('basePrice', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="1499"
                    />
                </div>

                {/* Cost Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost Price (₹)
                    </label>
                    <input
                        type="number"
                        value={formData.costPrice}
                        onChange={(e) => onChange('costPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="500"
                    />
                    <p className="mt-1 text-xs text-gray-500">For margin calculation</p>
                </div>

                {/* Discount % */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount (%)
                    </label>
                    <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => onChange('discount', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="0"
                    />
                </div>

                {/* GST % */}
                <div>
                    <SearchableSelect
                        label="GST Rate (%)"
                        options={[
                            { _id: '0', name: '0%' },
                            { _id: '5', name: '5%' },
                            { _id: '12', name: '12%' },
                            { _id: '18', name: '18%' },
                            { _id: '28', name: '28%' }
                        ]}
                        value={String(formData.tax)}
                        onChange={(val) => onChange('tax', val)}
                    />
                </div>
            </div>

            {/* Pricing Summary */}
            {formData.basePrice && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                    <h4 className="font-medium text-indigo-900 mb-3">Pricing Summary</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Base Price (MRP):</span>
                            <span className="font-medium">₹{parseFloat(formData.basePrice || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Discount ({formData.discount || 0}%):</span>
                            <span className="font-medium text-red-600">
                                -₹{(Number(formData.basePrice || 0) * Number(formData.discount || 0) / 100).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-indigo-200 pt-2">
                            <span className="font-medium text-gray-900">Final Price:</span>
                            <span className="font-bold text-indigo-600 text-lg">
                                ₹{calculatedDiscountPrice.toFixed(2)}
                            </span>
                        </div>
                        {formData.costPrice && (
                            <div className="flex justify-between text-green-600">
                                <span>Profit Margin:</span>
                                <span className="font-medium">
                                    ₹{(calculatedDiscountPrice - Number(formData.costPrice || 0)).toFixed(2)} (
                                    {((calculatedDiscountPrice - Number(formData.costPrice || 0)) / calculatedDiscountPrice * 100).toFixed(1)}%)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// TAB 4: MEDIA
// ============================================================================
export const MediaTab = ({ formData, onImageChange, onGalleryChange, onGalleryRemove }) => (
    <div className="space-y-6">
        {/* Featured Image */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start space-x-4">
                {formData.imagePreview && (
                    <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover border-2 border-gray-200"
                    />
                )}
                <div className="flex-1">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onImageChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        Recommended: 800x800px, Max 5MB, JPG/PNG
                    </p>
                </div>
            </div>
        </div>

        {/* Gallery */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Gallery
            </label>
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={onGalleryChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <p className="mt-2 text-xs text-gray-500">
                Upload multiple images (Max 10 images)
            </p>

            {formData.galleryPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                    {formData.galleryPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={preview}
                                alt={`Gallery ${index + 1}`}
                                className="h-24 w-full rounded-lg object-cover border-2 border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={() => onGalleryRemove(index)}
                                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

// ============================================================================
// TAB 5: SEO
// ============================================================================
export const SEOTab = ({ formData, onNestedChange }) => (
    <div className="space-y-6">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-1">SEO Best Practices</h4>
            <ul className="text-sm text-blue-700 space-y-1">
                <li>• Meta Title: 50-60 characters</li>
                <li>• Meta Description: 150-160 characters</li>
                <li>• Use relevant keywords naturally</li>
                <li>• Make it compelling for click-through</li>
            </ul>
        </div>

        {/* Meta Title */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
            </label>
            <input
                type="text"
                value={formData.seo.metaTitle}
                onChange={(e) => onNestedChange('seo', 'metaTitle', e.target.value)}
                maxLength={60}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Buy Premium Product Online - Best Price"
            />
            <p className="mt-1 text-xs text-gray-500">
                {formData.seo.metaTitle.length}/60 characters
            </p>
        </div>

        {/* Meta Description */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
            </label>
            <textarea
                value={formData.seo.metaDescription}
                onChange={(e) => onNestedChange('seo', 'metaDescription', e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Shop premium products at best price. Free shipping, COD available."
            />
            <p className="mt-1 text-xs text-gray-500">
                {formData.seo.metaDescription.length}/160 characters
            </p>
        </div>

        {/* Canonical URL */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Canonical URL
            </label>
            <input
                type="url"
                value={formData.seo.canonicalUrl}
                onChange={(e) => onNestedChange('seo', 'canonicalUrl', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="https://example.com/products/product-name"
            />
        </div>

        {/* Open Graph */}
        <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Open Graph (Social Media)</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Title
                    </label>
                    <input
                        type="text"
                        value={formData.seo.ogTitle}
                        onChange={(e) => onNestedChange('seo', 'ogTitle', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="Premium Product - Amazing Deal"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Description
                    </label>
                    <textarea
                        value={formData.seo.ogDescription}
                        onChange={(e) => onNestedChange('seo', 'ogDescription', e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="Get the best product online"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Image URL
                    </label>
                    <input
                        type="url"
                        value={formData.seo.ogImage}
                        onChange={(e) => onNestedChange('seo', 'ogImage', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="https://example.com/images/product-og.jpg"
                    />
                </div>
            </div>
        </div>
    </div>
);

// ============================================================================
// TAB 6: MARKETING
// ============================================================================
export const MarketingTab = ({ formData, onChange, onNestedChange, onArrayAdd, onArrayUpdate, onArrayRemove }) => {
    const BADGE_OPTIONS = ['new', 'sale', 'bestseller', 'featured', 'limited', 'exclusive', 'trending'];

    const toggleBadge = (badge) => {
        const badges = formData.badges.includes(badge)
            ? formData.badges.filter(b => b !== badge)
            : [...formData.badges, badge];
        onChange('badges', badges);
    };

    return (
        <div className="space-y-6">
            {/* Badges */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Badges
                </label>
                <div className="flex flex-wrap gap-2">
                    {BADGE_OPTIONS.map((badge) => (
                        <button
                            key={badge}
                            type="button"
                            onClick={() => toggleBadge(badge)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.badges.includes(badge)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {badge.charAt(0).toUpperCase() + badge.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                </label>
                <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => onChange('tags', e.target.value.split(',').map(t => t.trim()))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="casual, summer, trending (comma separated)"
                />
            </div>

            {/* Featured */}
            <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => onChange('featured', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Mark as Featured Product
                </label>
            </div>

            {/* Display Priority */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Priority
                </label>
                <input
                    type="number"
                    value={formData.displayPriority}
                    onChange={(e) => onChange('displayPriority', e.target.value)}
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">Higher number = shown first</p>
            </div>

            {/* Visibility */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Visibility
                </label>
                <div className="space-y-3">
                    {[
                        { key: 'website', label: 'Website' },
                        { key: 'mobileApp', label: 'Mobile App' },
                        { key: 'pos', label: 'POS' },
                        { key: 'marketplace', label: 'Marketplace' }
                    ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id={`visibility-${key}`}
                                checked={formData.visibility[key]}
                                onChange={(e) => onNestedChange('visibility', key, e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={`visibility-${key}`} className="text-sm text-gray-700">
                                {label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Publish Status */}
            <div>
                <SearchableSelect
                    label="Publish Status"
                    options={[
                        { _id: 'draft', name: 'Draft' },
                        { _id: 'published', name: 'Published' },
                        { _id: 'scheduled', name: 'Scheduled' },
                        { _id: 'archived', name: 'Archived' }
                    ]}
                    value={formData.publishStatus}
                    onChange={(val) => onChange('publishStatus', val)}
                />
            </div>
        </div>
    );
};

// ============================================================================
// TAB 7: PHYSICAL ATTRIBUTES
// ============================================================================
export const PhysicalTab = ({ formData, onChange, onNestedChange }) => (
    <div className="space-y-6">
        {/* Dimensions */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Dimensions
            </label>
            <div className="grid grid-cols-4 gap-4">
                <div>
                    <input
                        type="number"
                        value={formData.dimensions.length}
                        onChange={(e) => onNestedChange('dimensions', 'length', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="Length"
                    />
                </div>
                <div>
                    <input
                        type="number"
                        value={formData.dimensions.width}
                        onChange={(e) => onNestedChange('dimensions', 'width', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="Width"
                    />
                </div>
                <div>
                    <input
                        type="number"
                        value={formData.dimensions.height}
                        onChange={(e) => onNestedChange('dimensions', 'height', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="Height"
                    />
                </div>
                <div>
                    <SearchableSelect
                        label=""
                        options={[
                            { _id: 'cm', name: 'cm' },
                            { _id: 'inch', name: 'inch' },
                            { _id: 'm', name: 'm' }
                        ]}
                        value={formData.dimensions.unit}
                        onChange={(val) => onNestedChange('dimensions', 'unit', val)}
                    />
                </div>
            </div>
        </div>

        {/* Weight */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Weight
            </label>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <input
                        type="number"
                        value={formData.weight.value}
                        onChange={(e) => onNestedChange('weight', 'value', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="Weight"
                    />
                </div>
                <div>
                    <SearchableSelect
                        label=""
                        options={[
                            { _id: 'kg', name: 'kg' },
                            { _id: 'g', name: 'g' },
                            { _id: 'lb', name: 'lb' }
                        ]}
                        value={formData.weight.unit}
                        onChange={(val) => onNestedChange('weight', 'unit', val)}
                    />
                </div>
            </div>
        </div>

        {/* Material */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
            </label>
            <input
                type="text"
                value={formData.material.join(', ')}
                onChange={(e) => onChange('material', e.target.value.split(',').map(m => m.trim()))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Cotton, Polyester (comma separated)"
            />
        </div>
    </div>
);
