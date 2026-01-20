import { useEffect, useState } from "react";
import { getProducts, deleteProduct } from "../../Api/Product/productApi";

const ProductList = () => {
  const [products, setProducts] = useState([]);

  const load = async () => {
    const res = await getProducts();
    setProducts(res.data.data);
  };

  useEffect(() => { load(); }, []);

  return (
    // UI ONLY CHANGE: Complete UI overhaul with professional styling
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 md:p-10 font-sans antialiased">
      {/* Header Section */}
      <div className="max-w-[1600px] mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Product Inventory
            </h1>
            <p className="text-slate-600 mt-3 text-lg font-medium max-w-2xl leading-relaxed">
              Manage your product catalog, pricing, and inventory details with enterprise-grade controls.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="search"
                placeholder="Search products..."
                className="pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 w-full md:w-64 placeholder:text-slate-400"
                aria-label="Search products"
              />
            </div>
            <button
              onClick={() => {}}
              className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-xl hover:shadow-xl hover:shadow-emerald-200/50 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97] shadow-lg shadow-emerald-200/40 border border-emerald-500/20"
            >
              <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="max-w-[1600px] mx-auto">
        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-200/30 overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            {/* Sticky Table Header */}
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 shadow-sm">
                  <th className="text-left py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                    <div className="flex items-center">
                      <span>Product Details</span>
                    </div>
                  </th>
                  <th className="text-left py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                    Brand
                  </th>
                  <th className="text-left py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                    Price
                  </th>
                  <th className="text-left py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                    Visual
                  </th>
                  <th className="text-right py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                    Actions
                  </th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100/80">
                {products.length > 0 ? (
                  products.map(p => (
                    <tr 
                      key={p._id} 
                      className="group hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-white transition-all duration-300"
                    >
                      {/* Product Name */}
                      <td className="py-7 px-8">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 mr-3"></div>
                          <span className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-300">
                            {p.name}
                          </span>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-7 px-8">
                        {p.brandId?.name ? (
                          <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-50/70 text-blue-800 text-sm font-bold rounded-xl border border-blue-200/80 shadow-sm shadow-blue-200/30">
                            {p.brandId.name}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 font-medium italic">No brand</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-7 px-8">
                        <div className="flex items-center">
                          <span className="text-sm font-bold text-slate-500 mr-1.5">$</span>
                          <span className="text-xl font-extrabold text-slate-900">
                            {typeof p.price === 'number' ? p.price.toFixed(2) : p.price}
                          </span>
                        </div>
                      </td>

                      {/* Image */}
                      <td className="py-7 px-8">
                        {p.image && (
                          <div className="relative group/image">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white to-slate-50 border-2 border-slate-100 shadow-lg shadow-slate-200/30 overflow-hidden hover:border-emerald-300/50 hover:shadow-emerald-100/50 transition-all duration-300">
                              <img 
                                src={`http://localhost:5000/uploads/products/${p.image}`}
                                alt={p.name}
                                className="w-full h-full object-cover p-1.5 hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.innerHTML = `
                                    <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                      <svg class="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Image</span>
                                    </div>
                                  `;
                                }}
                              />
                            </div>
                            <div className="absolute -top-2 -right-2 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                              <div className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg shadow-emerald-200">
                                View
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-7 px-8">
                        <div className="flex items-center justify-end gap-3 opacity-70 group-hover:opacity-100 transition-all duration-300">
                          {/* Edit Button - UI ONLY CHANGE: Added for completeness (no logic change) */}
                          <button
                            onClick={() => {}}
                            className="p-3 text-slate-500 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 rounded-xl transition-all duration-300 border border-transparent hover:border-blue-200/80 hover:shadow-sm hover:shadow-blue-200/30"
                            title="Edit product"
                            aria-label={`Edit ${p.name}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={()=>deleteProduct(p._id).then(load)}
                            className="p-3 text-slate-500 hover:text-rose-700 hover:bg-gradient-to-r hover:from-rose-50 hover:to-rose-50/50 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-200/80 hover:shadow-sm hover:shadow-rose-200/30"
                            title="Delete product"
                            aria-label={`Delete ${p.name}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          
                          {/* View Button - UI ONLY CHANGE: Added for completeness (no logic change) */}
                          <button
                            onClick={() => {}}
                            className="p-3 text-slate-500 hover:text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-50/50 rounded-xl transition-all duration-300 border border-transparent hover:border-emerald-200/80 hover:shadow-sm hover:shadow-emerald-200/30"
                            title="View details"
                            aria-label={`View ${p.name} details`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Empty State
                  <tr>
                    <td colSpan="5" className="py-36 px-6 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-28 h-28 bg-gradient-to-br from-slate-100 to-white rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-slate-200/50 border-8 border-white">
                          <svg className="w-14 h-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                          No Products Found
                        </h3>
                        <p className="text-slate-600 mb-8 font-medium text-lg leading-relaxed">
                          Your product catalog is empty. Start by adding your first product.
                        </p>
                        <button
                          onClick={() => {}}
                          className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-slate-600 to-slate-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Add First Product
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Metadata */}
          <div className="px-8 py-6 bg-gradient-to-r from-slate-50/80 to-white border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Inventory Summary:
                </span>
                <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-sm">
                  {products.length} {products.length === 1 ? 'Product' : 'Products'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600">
                  Total Value: <span className="font-bold text-slate-900">
                    ${products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0).toFixed(2)}
                  </span>
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled 
                    className="px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 cursor-not-allowed transition-colors shadow-sm"
                    aria-label="Previous page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    disabled 
                    className="px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 cursor-not-allowed transition-colors shadow-sm"
                    aria-label="Next page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/70 rounded-2xl border border-emerald-200/80 p-6 shadow-lg shadow-emerald-200/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Active Products</p>
                <p className="text-3xl font-extrabold text-emerald-900 mt-2">{products.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-50/70 rounded-2xl border border-blue-200/80 p-6 shadow-lg shadow-blue-200/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-800 uppercase tracking-wider">Unique Brands</p>
                <p className="text-3xl font-extrabold text-blue-900 mt-2">
                  {[...new Set(products.filter(p => p.brandId?.name).map(p => p.brandId.name))].length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-amber-50/70 rounded-2xl border border-amber-200/80 p-6 shadow-lg shadow-amber-200/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-amber-800 uppercase tracking-wider">Avg. Price</p>
                <p className="text-3xl font-extrabold text-amber-900 mt-2">
                  ${products.length > 0 ? (products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) / products.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;