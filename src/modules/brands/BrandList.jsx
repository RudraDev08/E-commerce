import { useState, useEffect, useCallback, useRef } from "react";
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
  ArrowUturnLeftIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import brandApi from "../../Api/Brands/brandApi";
import BrandModal from "./BrandModal";

const CustomDropdown = ({ label, value, options, onChange, icon: Icon, color = "indigo" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorStyles = {
    purple: "text-purple-600 ring-purple-500/20 group-hover:ring-purple-500/40",
    pink: "text-pink-600 ring-pink-500/20 group-hover:ring-pink-500/40",
    indigo: "text-indigo-600 ring-indigo-500/20 group-hover:ring-indigo-500/40"
  };

  const activeColor = colorStyles[color] || colorStyles.indigo;

  return (
    <div className="flex flex-col h-full justify-end min-w-[220px]" ref={containerRef}>
      {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 ml-1">
        {label}
      </label>}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full relative flex items-center gap-3 pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 ${isOpen ? 'ring-4 ring-slate-100 border-slate-300' : 'shadow-sm'}`}
        >
          {Icon && <Icon className={`w-5 h-5 transition-colors ${isOpen ? activeColor.split(' ')[0] : 'text-slate-400'}`} />}
          <span className="truncate">{selectedOption?.label}</span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-slate-600' : ''}`} />
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 focus:outline-none overflow-hidden origin-top right-0"
            >
              {options.map((option) => (
                <li key={option.value} className="px-2">
                  <button
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${value === option.value
                      ? 'bg-slate-50 text-slate-900'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      {option.icon && <span className="text-slate-400">{option.icon}</span>}
                      {option.label}
                    </span>
                    {value === option.value && (
                      <div className={`w-1.5 h-1.5 rounded-full ${color === 'purple' ? 'bg-purple-500' : color === 'pink' ? 'bg-pink-500' : 'bg-indigo-500'}`} />
                    )}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

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
    limit: 5
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
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl pointer-events-auto flex gap-2 p-1.5`}>
            <div className="flex-1 w-0 p-2.5 pl-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Brand Created</p>
                  <p className="mt-1 text-sm text-gray-500">Successfully added to your catalog.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 4500 });
      } else {
        await brandApi.update(modal.data._id, formData);
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl pointer-events-auto flex gap-2 p-1.5`}>
            <div className="flex-1 w-0 p-2.5 pl-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Changes Saved</p>
                  <p className="mt-1 text-sm text-gray-500">Brand details updated successfully.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 4500 });
      }
      fetchBrands();
    } catch (error) {
      throw error; // Re-throw for modal to handle
    }
  };

  const handleDelete = (id) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl pointer-events-auto overflow-hidden`}>
        <div className="p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <ArchiveBoxIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-bold text-gray-900">Move to Trash?</h3>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">Are you sure you want to remove this brand? You can restore it later from the trash.</p>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    try {
                      await brandApi.delete(id);
                      toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl pointer-events-auto flex gap-2 p-1.5`}>
                          <div className="flex-1 w-0 p-2.5 pl-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 pt-0.5">
                                <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center">
                                  <TrashIcon className="h-5 w-5 text-rose-500" aria-hidden="true" />
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-semibold text-gray-900">Moved to Trash</p>
                                <p className="mt-1 text-sm text-gray-500">Brand removed from active list.</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col justify-center">
                            <button
                              onClick={() => toast.dismiss(t.id)}
                              className="px-4 py-2 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      ), { duration: 3000 });
                      fetchBrands();
                    } catch (e) { toast.error("Failed to delete"); }
                  }}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 shadow-md shadow-rose-200 transition-all flex-1"
                >
                  Move to Trash
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleRestore = async (id) => {
    try {
      await brandApi.restore(id);
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl pointer-events-auto flex gap-2 p-1.5`}>
          <div className="flex-1 w-0 p-2.5 pl-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ArrowUturnLeftIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900">Restored Successfully</p>
                <p className="mt-1 text-sm text-gray-500">Brand is now active again.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 4000 });
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
            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {/* Filter: Status */}
          <div className="h-11">
            <CustomDropdown
              label=""
              value={filters.status}
              options={[
                { value: "", label: "All Status", icon: <FunnelIcon className="w-4 h-4" /> },
                { value: "active", label: "Active", icon: <div className="w-2 h-2 rounded-full bg-emerald-500" /> },
                { value: "inactive", label: "Inactive", icon: <div className="w-2 h-2 rounded-full bg-slate-400" /> }
              ]}
              onChange={(val) => handleFilterChange('status', val)}
              icon={CheckCircleIcon}
              color="indigo"
            />
          </div>

          {/* Filter: Deleted */}
          <div className="flex bg-slate-100 p-1 rounded-xl h-11 items-center">
            <button
              onClick={() => handleFilterChange('isDeleted', 'false')}
              className={`px-4 h-full rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filters.isDeleted === 'false' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filters.isDeleted === 'false' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              Live
            </button>
            <button
              onClick={() => handleFilterChange('isDeleted', 'true')}
              className={`px-4 h-full rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filters.isDeleted === 'true' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filters.isDeleted === 'true' ? 'bg-rose-500' : 'bg-slate-400'}`} />
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
        {/* Pagination */}
        {pagination && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>Rows per page:</span>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                  className="h-8 pl-2 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {[5, 10, 25, 50, 100].map(limit => (
                    <option key={limit} value={limit}>{limit}</option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-bold text-slate-900">{((pagination.page - 1) * filters.limit) + 1}</span>
                <span>-</span>
                <span className="font-bold text-slate-900">{Math.min(pagination.page * filters.limit, pagination.total || (pagination.page * filters.limit))}</span>
                <span> of </span>
                <span className="font-bold text-slate-900">{pagination.total || (pagination.pages * filters.limit)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs uppercase tracking-wider shadow-sm group hover:border-slate-300"
              >
                <ChevronLeftIcon className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                Prev
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pagination.pages > 5 && pagination.page > 3) {
                    pageNum = pagination.page - 2 + i;
                    if (pageNum > pagination.pages) pageNum = pagination.pages - (4 - i);
                  }
                  if (pageNum <= 0) pageNum = i + 1;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${pagination.page === pageNum
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs uppercase tracking-wider shadow-sm group hover:border-slate-300"
              >
                Next
                <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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