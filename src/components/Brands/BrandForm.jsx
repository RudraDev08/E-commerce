import { useState } from "react";

const BrandForm = ({ initialData = {}, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    description: initialData.description || "",
    categories: initialData.categories || [],
    isFeatured: initialData.isFeatured || false,
    showOnHomepage: initialData.showOnHomepage ?? true,
    status: initialData.status ?? true,
  });

  const [logo, setLogo] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = new FormData();
    Object.keys(formData).forEach((key) => {
      payload.append(key, formData[key]);
    });

    if (logo) payload.append("logo", logo);

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} id="brand-form" className="space-y-8">
      {/* Brand Information Section */}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Brand Information</h3>
          <p className="text-sm text-gray-500 mt-1">Basic details about your brand</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter brand name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-gray-400"
            />
            <p className="mt-1.5 text-sm text-gray-500">The official name of your brand</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Enter brand description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-gray-400 resize-none"
            />
            <p className="mt-1.5 text-sm text-gray-500">A brief overview of your brand</p>
          </div>
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Logo & Media</h3>
          <p className="text-sm text-gray-500 mt-1">Upload your brand logo</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Brand Logo
            </label>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Preview */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                  {logo ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-emerald-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500 mt-2">Preview</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-2">Logo Preview</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      onChange={(e) => setLogo(e.target.files[0])}
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                    />
                    <div className="inline-flex items-center px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Logo
                    </div>
                  </label>
                  <p className="mt-2 text-sm text-gray-500">Recommended: 300x300px PNG, JPG or SVG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status & Visibility Section */}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Visibility & Status</h3>
          <p className="text-sm text-gray-500 mt-1">Configure brand visibility settings</p>
        </div>

        <div className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
          {/* Toggle Switch Styles */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                Featured Brand
              </label>
              <p className="text-xs text-gray-500 mt-0.5">Highlight this brand in featured sections</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <label htmlFor="showOnHomepage" className="text-sm font-medium text-gray-700">
                Show on Homepage
              </label>
              <p className="text-xs text-gray-500 mt-0.5">Display this brand on the homepage</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="showOnHomepage"
                name="showOnHomepage"
                checked={formData.showOnHomepage}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <label htmlFor="status" className="text-sm font-medium text-gray-700">
                Active Status
              </label>
              <p className="text-xs text-gray-500 mt-0.5">Enable or disable the brand</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="status"
                name="status"
                checked={formData.status}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
};

export default BrandForm;