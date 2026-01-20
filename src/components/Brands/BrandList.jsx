// import { useEffect, useState } from "react";
// import { getBrands, deleteBrand } from "../../Api/Brands/brandApi";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";

// const BrandList = () => {
//   const [brands, setBrands] = useState([]);
//   const navigate = useNavigate();

//   // Environment-safe Base URL
//   const API_URL = "http://localhost:5000";

//   const fetchBrands = async () => {
//     try {
//       const res = await getBrands();
//       // Ensure we target the correct data path from your API response
//       setBrands(res.data.data || []);
//     } catch (error) {
//       toast.error("Failed to load brands catalog");
//       console.error("Fetch Error:", error);
//     }
//   };

//   useEffect(() => {
//     fetchBrands();
//   }, []);

//   const handleDelete = async (id) => {
//     if (window.confirm("Are you sure you want to remove this brand? This action cannot be undone.")) {
//       try {
//         await deleteBrand(id);
//         toast.success("Brand removed successfully");
//         fetchBrands();
//       } catch (error) {
//         toast.error("Failed to delete brand");
//       }
//     }
//   };

//   // ✅ Fixed Helper: Handles both 'logo' and 'image' keys
//   const getImageUrl = (brand) => {
//     const fileName = brand.logo || brand.image;
//     if (!fileName) return null;
//     return `${API_URL}/uploads/brands/${fileName}`;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 md:p-10 font-sans antialiased">
//       {/* Header Section - UI IMPROVEMENT: Added subtle gradient and improved spacing */}
//       <div className="max-w-[1600px] mx-auto mb-12">
//         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
//           <div>
//             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
//               Catalog Brands
//             </h1>
//             <p className="text-slate-600 mt-3 text-lg font-medium max-w-2xl leading-relaxed">
//               Manage your brand ecosystem, visual identity, and visibility settings.
//             </p>
//           </div>
//           <button
//             onClick={() => navigate("/brands/add")}
//             className="inline-flex items-center justify-center px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-xl hover:shadow-xl hover:shadow-emerald-200/50 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97] shadow-lg shadow-emerald-200/40 border border-emerald-500/20"
//           >
//             <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
//             </svg>
//             Register New Brand
//           </button>
//         </div>
//       </div>

//       <div className="max-w-[1600px] mx-auto space-y-8">
//         {/* Table Card - UI IMPROVEMENT: Enhanced card styling with better shadow and border */}
//         <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-200/30 overflow-hidden backdrop-blur-sm">
//           <div className="overflow-x-auto">
//             {/* UI IMPROVEMENT: Sticky header with glass effect */}
//             <table className="w-full border-collapse">
//               <thead className="sticky top-0 z-10">
//                 <tr className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 shadow-sm">
//                   <th className="text-left py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
//                     <div className="flex items-center">
//                       <span>Brand Identity</span>
//                       <svg className="w-3.5 h-3.5 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
//                       </svg>
//                     </div>
//                   </th>
//                   <th className="text-left py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em] w-48">
//                     Status
//                   </th>
//                   <th className="text-left py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em] w-48">
//                     Visibility
//                   </th>
//                   <th className="text-right py-6 px-8 text-xs font-black text-slate-500 uppercase tracking-[0.15em] w-56">
//                     Management
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100/80">
//                 {brands.length > 0 ? (
//                   brands.map((b) => (
//                     <tr 
//                       key={b._id} 
//                       className="group hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-white transition-all duration-300"
//                     >
//                       <td className="py-7 px-8">
//                         <div className="flex items-center gap-6">
//                           {/* UI IMPROVEMENT: Enhanced logo container with better styling */}
//                           <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-slate-50 border-2 border-slate-100 shadow-lg shadow-slate-200/30 overflow-hidden group-hover:border-emerald-300/50 group-hover:shadow-emerald-100/50 transition-all duration-300">
//                             {getImageUrl(b) ? (
//                               <div className="relative w-full h-full">
//                                 <img
//                                   src={getImageUrl(b)}
//                                   alt={b.name}
//                                   className="w-full h-full object-contain p-2.5"
//                                   onError={(e) => {
//                                     e.currentTarget.style.display = 'none';
//                                     e.currentTarget.nextElementSibling.style.display = 'flex';
//                                   }}
//                                 />
//                                 {/* UI IMPROVEMENT: Better fallback logo */}
//                                 <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
//                                   <div className="text-center p-2">
//                                     <svg className="w-8 h-8 text-slate-400 mb-1 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                                     </svg>
//                                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No Logo</span>
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
//                                 <svg className="w-8 h-8 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                                 </svg>
//                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No Logo</span>
//                               </div>
//                             )}
//                           </div>
//                           {/* Typography - UI IMPROVEMENT: Better text hierarchy */}
//                           <div className="flex flex-col min-w-0">
//                             <span className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-300">
//                               {b.name}
//                             </span>
//                             <p className="text-sm text-slate-500 line-clamp-1 mt-1.5 font-medium leading-relaxed">
//                               {b.description?.trim() || "Institutional identity not described."}
//                             </p>
//                           </div>
//                         </div>
//                       </td>

//                       <td className="py-7 px-8">
//                         {/* UI IMPROVEMENT: Enhanced status badge with animation */}
//                         <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold tracking-wide border transition-all duration-300 ${
//                           b.status 
//                             ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/70 text-emerald-800 border-emerald-200/80 shadow-sm shadow-emerald-200/30' 
//                             : 'bg-gradient-to-r from-rose-50 to-rose-50/70 text-rose-800 border-rose-200/80 shadow-sm shadow-rose-200/30'
//                         }`}>
//                           <span className={`relative w-2 h-2 rounded-full mr-2.5 ${
//                             b.status 
//                               ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' 
//                               : 'bg-rose-500'
//                           }`}>
//                             <span className={`absolute inset-0 rounded-full animate-ping ${
//                               b.status ? 'bg-emerald-400/40' : 'bg-rose-400/40'
//                             }`}></span>
//                           </span>
//                           {b.status ? "ACTIVE" : "INACTIVE"}
//                         </span>
//                       </td>

//                       <td className="py-7 px-8">
//                         {b.isFeatured ? (
//                           <div className="inline-flex items-center text-amber-700 bg-gradient-to-r from-amber-50 to-amber-50/70 px-4 py-2 rounded-xl border border-amber-200/80 shadow-sm shadow-amber-200/30 group-hover:shadow-amber-200/50 transition-all duration-300">
//                             <svg className="w-4 h-4 mr-2.5 fill-current" viewBox="0 0 20 20">
//                               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                             </svg>
//                             <span className="text-[11px] font-black uppercase tracking-tighter">Featured</span>
//                           </div>
//                         ) : (
//                           <span className="text-[11px] font-bold text-slate-500 bg-gradient-to-r from-slate-50 to-slate-50/70 px-4 py-2 rounded-xl border border-slate-200/80 uppercase tracking-tighter">
//                             Standard
//                           </span>
//                         )}
//                       </td>

//                       <td className="py-7 px-8">
//                         {/* UI IMPROVEMENT: Enhanced action buttons with better visibility */}
//                         <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-all duration-300">
//                           <button
//                             onClick={() => navigate(`/brands/edit/${b._id}`)}
//                             className="p-3 text-slate-500 hover:text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-50/50 rounded-xl transition-all duration-300 border border-transparent hover:border-emerald-200/80 hover:shadow-sm hover:shadow-emerald-200/30"
//                             title="Edit"
//                             aria-label={`Edit ${b.name}`}
//                           >
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                             </svg>
//                           </button>
//                           <button
//                             onClick={() => handleDelete(b._id)}
//                             className="p-3 text-slate-500 hover:text-rose-700 hover:bg-gradient-to-r hover:from-rose-50 hover:to-rose-50/50 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-200/80 hover:shadow-sm hover:shadow-rose-200/30"
//                             title="Delete"
//                             aria-label={`Delete ${b.name}`}
//                           >
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                             </svg>
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   // UI IMPROVEMENT: Enhanced empty state
//                   <tr>
//                     <td colSpan="4" className="py-36 px-6 text-center">
//                       <div className="max-w-md mx-auto">
//                         <div className="w-28 h-28 bg-gradient-to-br from-slate-100 to-white rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-slate-200/50 border-8 border-white">
//                           <svg className="w-14 h-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//                           </svg>
//                         </div>
//                         <h3 className="text-2xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
//                           Brand Vault Empty
//                         </h3>
//                         <p className="text-slate-600 mb-8 font-medium text-lg leading-relaxed">
//                           No brands found in the database. Start by adding your first brand identity.
//                         </p>
//                         <button
//                           onClick={() => navigate("/brands/add")}
//                           className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
//                         >
//                           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
//                           </svg>
//                           Add First Brand
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Footer Metadata - UI IMPROVEMENT: Enhanced footer styling */}
//           <div className="px-8 py-6 bg-gradient-to-r from-slate-50/80 to-white border-t border-slate-200/80">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
//                   System Registry:
//                 </span>
//                 <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-sm">
//                   {brands.length} {brands.length === 1 ? 'Record' : 'Records'}
//                 </span>
//               </div>
//               <div className="flex gap-2">
//                 <button 
//                   disabled 
//                   className="px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 cursor-not-allowed transition-colors shadow-sm"
//                   aria-label="Previous page"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
//                   </svg>
//                 </button>
//                 <button 
//                   disabled 
//                   className="px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 cursor-not-allowed transition-colors shadow-sm"
//                   aria-label="Next page"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
//                   </svg>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BrandList;

import { useEffect, useState } from "react";
import { getBrands, deleteBrand } from "../../Api/Brands/brandApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BrandList = () => {
  const [brands, setBrands] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const navigate = useNavigate();

  const API_URL = "http://localhost:5000";

  const fetchBrands = async () => {
    try {
      const res = await getBrands();
      setBrands(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load brands catalog", {
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff' }
      });
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openDeleteModal = (id) => {
    setSelectedBrandId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteBrand(selectedBrandId);
      toast.success("Brand permanently removed", {
        icon: '🗑️',
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff' }
      });
      fetchBrands();
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const getImageUrl = (brand) => {
    const fileName = brand.logo || brand.image;
    return fileName ? `${API_URL}/uploads/brands/${fileName}` : null;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 lg:p-12 font-sans selection:bg-emerald-100">
      
      {/* --- PREMIUM DELETE MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 transform transition-all scale-100">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">This will permanently delete the brand identity. This action is irreversible.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
              >
                Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Brands <span className="text-slate-400 font-light">/ Catalog</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Curate and oversee your ecosystem of visual identities.</p>
        </div>
        <button
          onClick={() => navigate("/brands/add")}
          className="group relative flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl overflow-hidden hover:pr-10 transition-all duration-300"
        >
          <span className="text-sm font-bold">New Identity</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity</th>
                <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Tier</th>
                <th className="px-10 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {brands.map((b) => (
                <tr key={b._id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="relative w-14 h-14 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-2 shadow-sm group-hover:shadow-md transition-shadow">
                        {getImageUrl(b) ? (
                          <img src={getImageUrl(b)} alt={b.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-slate-50 rounded-lg flex items-center justify-center text-slate-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">{b.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{b.description || "No description provided"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${b.status ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${b.status ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {b.status ? 'ACTIVE' : 'ARCHIVED'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-xs font-bold ${b.isFeatured ? 'text-amber-500' : 'text-slate-400'}`}>
                      {b.isFeatured ? '✦ Premium' : 'Standard'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => navigate(`/brands/edit/${b._id}`)}
                        className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => openDeleteModal(b._id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* --- EMPTY STATE --- */}
          {brands.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </div>
              <p className="text-slate-900 font-bold">No brands found</p>
              <p className="text-slate-400 text-sm mt-1">Start your catalog by adding a new brand.</p>
            </div>
          )}
        </div>
        
        {/* --- FOOTER INFO --- */}
        <div className="mt-8 flex justify-between items-center px-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing {brands.length} Identit{brands.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandList;