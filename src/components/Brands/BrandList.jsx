import { useEffect, useState } from "react";
import { getBrands, deleteBrand } from "../../Api/Brands/brandApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BrandList = () => {
  const [brands, setBrands] = useState([]);
  const navigate = useNavigate();

  // Environment-safe Base URL
  const API_URL = "http://localhost:5000";

  const fetchBrands = async () => {
    try {
      const res = await getBrands();
      // Ensure we target the correct data path from your API response
      setBrands(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load brands catalog");
      console.error("Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this brand? This action cannot be undone.")) {
      try {
        await deleteBrand(id);
        toast.success("Brand removed successfully");
        fetchBrands();
      } catch (error) {
        toast.error("Failed to delete brand");
      }
    }
  };

  // ✅ Fixed Helper: Handles both 'logo' and 'image' keys
  const getImageUrl = (brand) => {
    const fileName = brand.logo || brand.image;
    if (!fileName) return null;
    return `${API_URL}/uploads/brands/${fileName}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans antialiased">
      {/* Header Section */}
      <div className="max-w-[1600px] mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Catalog Brands</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">
              Manage your brand ecosystem, visual identity, and visibility settings.
            </p>
          </div>
          <button
            onClick={() => navigate("/brands/add")}
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-[0.97]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Register New Brand
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="text-left py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">
                    Brand Identity
                  </th>
                  <th className="text-left py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em] w-48">
                    Status
                  </th>
                  <th className="text-left py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em] w-48">
                    Visibility
                  </th>
                  <th className="text-right py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em] w-56">
                    Management
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brands.length > 0 ? (
                  brands.map((b) => (
                    <tr key={b._id} className="group hover:bg-slate-50/30 transition-all">
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-5">
                          {/* Image Thumbnail with Fallback */}
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-slate-100 bg-white shadow-sm overflow-hidden group-hover:border-emerald-200 transition-colors">
                            {getImageUrl(b) ? (
                              <img
                                src={getImageUrl(b)}
                                alt={b.name}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=No+Logo")}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {/* Typography */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                              {b.name}
                            </span>
                            <p className="text-sm text-slate-400 line-clamp-1 mt-1 font-medium">
                              {b.description?.trim() || "Institutional identity not described."}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-8">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border ${
                          b.status 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${b.status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
                          {b.status ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>

                      <td className="py-5 px-8">
                        {b.isFeatured ? (
                          <div className="inline-flex items-center text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm shadow-amber-100/50">
                            <svg className="w-3.5 h-3.5 mr-2 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[11px] font-black uppercase tracking-tighter">Featured</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-tighter">Standard</span>
                        )}
                      </td>

                      <td className="py-5 px-8">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/brands/edit/${b._id}`)}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(b._id)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-32 px-6 text-center">
                      <div className="max-w-xs mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 mx-auto ring-8 ring-slate-50/50">
                          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Brand Vault Empty</h3>
                        <p className="text-slate-500 mt-2 font-medium">No brands found matching your database records.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Metadata */}
          <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                System Registry: <span className="text-slate-900">{brands.length} Total Records</span>
              </span>
              <div className="flex gap-2">
                <button disabled className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-300 cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button disabled className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-300 cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandList;