import { useState } from "react";
import { addProduct } from "../../Api/Product/productApi";

const AddProduct = () => {
  const [form, setForm] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    await addProduct(fd);
    alert("Product Added");
  };

  return (
    // UI ONLY CHANGE: Improved container with professional styling
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 flex items-center justify-center p-4 md:p-8 font-sans antialiased">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
            Add New Product
          </h1>
          <p className="text-slate-600 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Register a new product to your inventory. Fill in all required details for proper catalog management.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-200/30 p-8 md:p-10">
          <div className="space-y-8">
            {/* Basic Information Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">Product Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Input - UI ONLY CHANGE: Enhanced styling */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    placeholder="Enter product name"
                    onChange={(e)=>setForm({...form,name:e.target.value})}
                    className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 text-slate-900 font-medium placeholder:text-slate-400 hover:border-slate-300"
                    aria-label="Product name"
                    required
                  />
                </div>

                {/* Price Input - UI ONLY CHANGE: Enhanced styling */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Price <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input 
                      placeholder="0.00"
                      type="number" 
                      step="0.01"
                      min="0"
                      onChange={(e)=>setForm({...form,price:e.target.value})}
                      className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 text-slate-900 font-medium placeholder:text-slate-400 hover:border-slate-300"
                      aria-label="Product price"
                      required
                    />
                  </div>
                </div>

                {/* Brand ID Input - UI ONLY CHANGE: Enhanced styling */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Brand ID <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    placeholder="Enter brand identifier"
                    onChange={(e)=>setForm({...form,brandId:e.target.value})}
                    className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 text-slate-900 font-medium placeholder:text-slate-400 hover:border-slate-300"
                    aria-label="Brand ID"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">Product Image</h2>
              </div>

              {/* File Upload Area - UI ONLY CHANGE: Premium file input styling */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                  Upload Product Image <span className="text-rose-500">*</span>
                </label>
                
                <div className="relative group">
                  <div className="border-3 border-dashed border-slate-300 rounded-2xl bg-gradient-to-br from-white to-slate-50/50 p-10 text-center transition-all duration-300 group-hover:border-emerald-400 group-hover:bg-emerald-50/20 group-hover:shadow-lg group-hover:shadow-emerald-100/50">
                    {/* Upload Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-white border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-300 group-hover:shadow-lg group-hover:shadow-blue-100 transition-all duration-300">
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    {/* Upload Text */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Drop your product image here</h3>
                      <p className="text-slate-500 font-medium">Supports JPG, PNG, WebP • Max 5MB</p>
                    </div>
                    
                    {/* Custom File Input - UI ONLY CHANGE: Enhanced button */}
                    <div className="relative inline-block">
                      <input 
                        type="file"
                        onChange={(e)=>setForm({...form,image:e.target.files[0]})}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        id="file-upload"
                        aria-label="Upload product image"
                        accept="image/*"
                        required
                      />
                      <div className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200/50 transition-all duration-300 group-hover:shadow-blue-300/50 group-hover:-translate-y-0.5">
                        <svg className="w-5 h-5 inline mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Browse Files
                      </div>
                    </div>
                    
                    {/* Helper Text */}
                    <p className="text-sm text-slate-400 mt-4 font-medium">
                      Or drag and drop your file anywhere in this area
                    </p>
                  </div>
                </div>

                {/* File Requirements */}
                <div className="mt-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="font-bold">Note:</span> Upload a high-quality product image (recommended: 800x800px, PNG or JPG format)
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <p className="text-slate-600 font-medium">
                    <span className="text-rose-500 font-bold">*</span> Required fields
                  </p>
                </div>
                
                <div className="flex gap-4">
                  {/* Cancel Button - UI ONLY CHANGE: Added for better UX (logic unchanged) */}
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-8 py-3.5 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  
                  {/* Submit Button - UI ONLY CHANGE: Enhanced styling */}
                  <button
                    type="submit"
                    className="px-10 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-emerald-200/50 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97] shadow-lg shadow-emerald-200/40"
                  >
                    <svg className="w-5 h-5 inline mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Product to Catalog
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Your product will be added to the inventory and available for management immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;