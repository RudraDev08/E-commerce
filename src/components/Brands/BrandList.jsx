import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon,
  PhotoIcon,
  StarIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUturnLeftIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import brandApi from "../../Api/Brands/brandApi";
import BrandModal from "./BrandModal";

const BrandList = () => {
  // ----------------------------------------------------------------------
  // State
  // ----------------------------------------------------------------------
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, featured: 0 });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    isFeatured: "",
    isDeleted: "false", // 'false' | 'true' | 'all'
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState(null);

  // Modal
  const [modal, setModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    data: null
  });

  // ----------------------------------------------------------------------
  // API Callbacks
  // ----------------------------------------------------------------------
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        brandApi.getAll(filters),
        brandApi.getStats()
      ]);

      if (listRes.data.success) {
        setBrands(listRes.data.data);
        setPagination(listRes.data.pagination);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      toast.error("Failed to load brands");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleCreate = () => {
    setModal({ isOpen: true, mode: 'create', data: null });
  };

  const handleEdit = (brand) => {
    setModal({ isOpen: true, mode: 'edit', data: brand });
  };

  const handleSubmit = async (formData) => {
    try {
      if (modal.mode === 'create') {
        await brandApi.create(formData);
        toast.success("Brand created successfully");
      } else {
        await brandApi.update(modal.data._id, formData);
        toast.success("Brand updated successfully");
      }
      fetchBrands();
    } catch (error) {
      throw error; // Re-throw for modal to handle
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-4 min-w-[300px]">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">Move to Trash?</h3>
          <p className="text-xs text-slate-500 mt-1">You can restore it later.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await brandApi.delete(id);
                toast.success("Brand moved to trash");
                fetchBrands();
              } catch (e) { toast.error("Failed to delete"); }
            }}
            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: 4000, style: { borderRadius: '16px', border: '1px solid #f1f5f9' } });
  };

  const handleRestore = async (id) => {
    try {
      await brandApi.restore(id);
      toast.success("Brand restored");
      fetchBrands();
    } catch (e) { toast.error("Failed to restore"); }
  };

  const toggleStatus = async (id) => {
    try {
      await brandApi.toggleStatus(id);
      toast.success("Status updated");
      fetchBrands();
    } catch (e) { toast.error("Failed to update status"); }
  };

  // ----------------------------------------------------------------------
  // Render Helpers
  // ----------------------------------------------------------------------
  const getLogoUrl = (pathOrFilename) => {
    if (!pathOrFilename) return null;
    const filename = pathOrFilename.split(/[/\\]/).pop();
    return `http://localhost:5000/uploads/${filename}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Brand Catalog</h1>
          <p className="text-slate-500 mt-2 font-medium max-w-2xl">Manage your brand identities, presence, and visual assets.</p>
        </div>
        <button
          onClick={handleCreate}
          className="group flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>Add Brand</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Brands', value: stats.total, color: 'text-slate-700', bg: 'bg-white' },
          { label: 'Active', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Featured', value: stats.featured, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Inactive', value: stats.inactive, color: 'text-slate-400', bg: 'bg-slate-50' }
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border border-slate-100 ${stat.bg} shadow-sm`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-20 backdrop-blur-md bg-white/90">
        <div className="relative w-full md:w-96 group">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search brands..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {/* Filter: Status */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Filter: Deleted */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleFilterChange('isDeleted', 'false')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.isDeleted === 'false' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Live
            </button>
            <button
              onClick={() => handleFilterChange('isDeleted', 'true')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.isDeleted === 'true' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Trash
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-20">Rank</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <ArrowPathIcon className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">Loading catalog...</p>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <ArchiveBoxIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-900 font-bold">No brands found</p>
                    <p className="text-slate-400 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <span className="font-mono text-xs font-bold text-slate-300">#{brand.priority}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 p-2 flex items-center justify-center shadow-sm">
                          {getLogoUrl(brand.logo) ? (
                            <img src={getLogoUrl(brand.logo)} alt={brand.name} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <PhotoIcon className="w-6 h-6 text-slate-200" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{brand.name}</span>
                            {brand.isFeatured && <StarIconSolid className="w-4 h-4 text-amber-400" />}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5 max-w-[200px] truncate">
                            /{brand.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {filters.isDeleted === 'true' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 uppercase tracking-wide">
                          Deleted
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleStatus(brand._id)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${brand.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${brand.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {brand.status}
                        </button>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {filters.isDeleted === 'true' ? (
                          <button
                            onClick={() => handleRestore(brand._id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            <ArrowUturnLeftIcon className="w-4 h-4" />
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(brand)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(brand._id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Trash"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Previous
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <BrandModal
        isOpen={modal.isOpen}
        mode={modal.mode}
        brand={modal.data}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default BrandList;