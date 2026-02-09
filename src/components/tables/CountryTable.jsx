import { useEffect, useState, useCallback } from "react";
import {
  getCountries,
  addCountry,
  updateCountry,
  deleteCountry,
} from "../../Api/CountryApi";
import {
  GlobeAltIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import {
  GlobeAltIcon as GlobeAltIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from "@heroicons/react/24/solid";

const CountryTable = () => {
  // ---------------------------------------------------------------------------
  // LOGIC SECTION (UNCHANGED)
  // ---------------------------------------------------------------------------
  const [countries, setCountries] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSystemTip, setShowSystemTip] = useState(false);
  const itemsPerPage = 4;

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      4000
    );
  };

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCountries();
      setCountries(res.data || []);
    } catch (error) {
      showNotification("Failed to load countries", "error");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const addCountryHandler = async () => {
    if (!name.trim()) {
      showNotification("Please enter a country name", "error");
      return;
    }
    setActionLoading(true);
    try {
      await addCountry({ name: name.trim(), active: status });
      setName("");
      setStatus(true);
      await fetchCountries();
      showNotification("Country added successfully", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to add country",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = async (country) => {
    try {
      await updateCountry(country._id, { active: !country.active });
      await fetchCountries();
      showNotification(`${country.name} status updated`, "success");
    } catch {
      showNotification("Failed to update status", "error");
    }
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) {
      showNotification("Country name cannot be empty", "error");
      return;
    }
    try {
      await updateCountry(String(id), { name: editName.trim() });
      setEditId(null);
      setEditName("");
      await fetchCountries();
      showNotification("Country updated successfully", "success");
    } catch {
      showNotification("Failed to update country", "error");
    }
  };

  const removeCountry = async (id) => {
    try {
      await deleteCountry(id);
      await fetchCountries();
      showNotification("Country deleted successfully", "success");
    } catch {
      showNotification("Failed to delete country", "error");
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addCountryHandler();
  };

  const filteredCountries = countries
    .filter((country) => {
      const matchesSearch = country.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterActive === "all" ||
        (filterActive === "active" && country.active) ||
        (filterActive === "inactive" && !country.active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name")
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      if (sortBy === "status")
        return sortDirection === "asc"
          ? a.active === b.active
            ? 0
            : a.active
              ? -1
              : 1
          : a.active === b.active
            ? 0
            : a.active
              ? 1
              : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCountries = filteredCountries.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive]);

  const exportCSV = () => {
    try {
      const csv = [
        "ID,Name,Status,Created At",
        ...countries.map(
          (c) =>
            `${c._id},${c.name},${c.active ? "Active" : "Inactive"
            },"${new Date(c.createdAt).toLocaleDateString()}"`
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `countries_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      showNotification("CSV exported successfully", "success");
    } catch {
      showNotification("Failed to export CSV", "error");
    }
  };

  const activeCount = countries.filter((c) => c.active).length;
  const inactiveCount = countries.filter((c) => !c.active).length;
  const totalCount = countries.length;

  const TableSkeleton = () => (
    <>
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <tr key={index} className="animate-pulse border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
          <td className="px-7 py-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gray-200 shrink-0"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-100 rounded w-20"></div>
              </div>
            </div>
          </td>
          <td className="px-7 py-5">
            <div className="flex items-center gap-4">
              <div className="h-7 w-14 rounded-full bg-gray-200"></div>
              <div className="h-6 w-20 rounded-full bg-gray-100"></div>
            </div>
          </td>
          <td className="px-7 py-5">
            <div className="h-8 w-24 bg-gray-100 rounded-lg border border-gray-200"></div>
          </td>
          <td className="px-7 py-5 text-right">
            <div className="flex items-center justify-end gap-3">
              <div className="h-9 w-9 rounded-xl bg-gray-200"></div>
              <div className="h-9 w-9 rounded-xl bg-gray-200"></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  // ---------------------------------------------------------------------------
  // ENHANCED UI SECTION - PRODUCTION READY
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)' }}>
      <div className="w-full space-y-8">

        {/* System Tip Modal */}
        {showSystemTip && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setShowSystemTip(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                style={{ border: '2px solid #FEF3C7' }}
              >
                {/* Modal Header */}
                <div className="px-6 py-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#D97706' }}>
                    <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold" style={{ color: '#78350F' }}>System Tip</h3>
                    <p className="text-sm" style={{ color: '#92400E' }}>Important information</p>
                  </div>
                  <button
                    onClick={() => setShowSystemTip(false)}
                    className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    style={{ color: '#92400E' }}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-6">
                  <p className="text-base leading-relaxed" style={{ color: '#475569' }}>
                    <span className="font-semibold" style={{ color: '#1E293B' }}>System Tip:</span><br />
                    Toggling a country's status affects the frontend visibility immediately.
                    Deletions are permanent and cannot be undone.
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 flex justify-end" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    onClick={() => setShowSystemTip(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
                <GlobeAltIconSolid className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Country Management
                </h1>
                <p className="mt-1 text-sm md:text-base" style={{ color: '#64748B' }}>
                  Configure and manage global regions for your platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Tip Button */}
            <button
              onClick={() => setShowSystemTip(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '2px solid #FCD34D',
                color: '#92400E'
              }}
            >
              <ExclamationTriangleIcon className="h-5 w-5" style={{ color: '#D97706' }} />
              <span className="text-sm font-semibold">System Tip</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={exportCSV}
              className="group flex items-center gap-3 px-5 py-3 rounded-xl font-medium shadow-md transition-all duration-300 hover:shadow-lg active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                border: '2px solid #E2E8F0',
                color: '#475569'
              }}
            >
              <DocumentArrowDownIcon className="h-5 w-5 group-hover:scale-110 transition-transform" style={{ color: '#64748B' }} />
              <span className="text-sm font-semibold">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: "Total Countries",
              value: totalCount,
              icon: GlobeAltIcon,
              iconColor: "#4F46E5",
              bgGradient: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
              borderColor: "#C7D2FE",
              textColor: "#3730A3"
            },
            {
              label: "Active Regions",
              value: activeCount,
              icon: CheckCircleIconSolid,
              iconColor: "#16A34A",
              bgGradient: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
              borderColor: "#BBF7D0",
              textColor: "#15803D"
            },
            {
              label: "Inactive Regions",
              value: inactiveCount,
              icon: ClockIcon,
              iconColor: "#D97706",
              bgGradient: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
              borderColor: "#FDE68A",
              textColor: "#B45309"
            },
            {
              label: "Filtered View",
              value: filteredCountries.length,
              icon: FunnelIcon,
              iconColor: "#2563EB",
              bgGradient: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
              borderColor: "#BFDBFE",
              textColor: "#1E40AF"
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="relative group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 overflow-hidden"
              style={{ border: `2px solid ${stat.borderColor}` }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: stat.bgGradient }} />

              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>{stat.label}</p>
                  <p className="text-3xl font-bold" style={{ color: stat.textColor }}>{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-12 duration-300" style={{ background: stat.bgGradient }}>
                  <stat.icon className="h-6 w-6" style={{ color: stat.iconColor }} />
                </div>
              </div>

              {/* Decorative accent */}
              <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500" style={{ background: stat.bgGradient }} />
            </div>
          ))}
        </div>

        {/* Notification Toast */}
        {notification.show && (
          <div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm"
            style={{
              background: notification.type === "error"
                ? 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)'
                : 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
              border: notification.type === "error"
                ? '2px solid #FECACA'
                : '2px solid #BBF7D0',
              color: notification.type === "error" ? '#B91C1C' : '#15803D'
            }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: notification.type === "error" ? '#FEE2E2' : '#DCFCE7' }}
            >
              {notification.type === "error"
                ? <ExclamationTriangleIcon className="h-5 w-5" style={{ color: '#DC2626' }} />
                : <CheckCircleIcon className="h-5 w-5" style={{ color: '#16A34A' }} />}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Content Layout - Stacked Vertical Flow */}
        <div className="flex flex-col gap-8">

          {/* Top Section: Controls Row (Add & Filter Side-by-Side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

            {/* Add Country Card */}
            <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)', border: '2px solid #E2E8F0' }}>
              <div className="p-6" style={{ borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
                    <PlusIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: '#1E293B' }}>Add New Country</h3>
                    <p className="text-sm" style={{ color: '#64748B' }}>Create a new region entry</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>Country Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter country name..."
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all disabled:opacity-60"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #CBD5E1',
                      color: '#1E293B'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4F46E5';
                      e.target.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                    disabled={actionLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#475569' }}>Initial Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStatus(true)}
                      className="flex flex-col items-center p-4 rounded-xl transition-all duration-300"
                      style={{
                        border: status ? '2px solid #16A34A' : '2px solid #E2E8F0',
                        background: status ? 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)' : '#FFFFFF'
                      }}
                    >
                      <div className="h-3 w-3 rounded-full mb-2" style={{ backgroundColor: status ? '#16A34A' : '#CBD5E1' }} />
                      <span className="font-medium" style={{ color: status ? '#15803D' : '#64748B' }}>Active</span>
                      <span className="text-xs mt-1" style={{ color: '#94A3B8' }}>Visible</span>
                    </button>
                    <button
                      onClick={() => setStatus(false)}
                      className="flex flex-col items-center p-4 rounded-xl transition-all duration-300"
                      style={{
                        border: !status ? '2px solid #D97706' : '2px solid #E2E8F0',
                        background: !status ? 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)' : '#FFFFFF'
                      }}
                    >
                      <div className="h-3 w-3 rounded-full mb-2" style={{ backgroundColor: !status ? '#D97706' : '#CBD5E1' }} />
                      <span className="font-medium" style={{ color: !status ? '#B45309' : '#64748B' }}>Inactive</span>
                      <span className="text-xs mt-1" style={{ color: '#94A3B8' }}>Hidden</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={addCountryHandler}
                  disabled={!name.trim() || actionLoading}
                  className="w-full py-3.5 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                    boxShadow: '0 4px 14px rgba(30, 41, 59, 0.2)'
                  }}
                >
                  {actionLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF' }} />
                      Processing...
                    </span>
                  ) : "Add Country"}
                </button>
              </div>
            </div>

            {/* Filter Card */}
            <div className="rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)', border: '2px solid #E2E8F0' }}>
              <div className="p-6 rounded-t-2xl" style={{ borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}>
                    <FunnelIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: '#1E293B' }}>Filter & Search</h3>
                    <p className="text-sm" style={{ color: '#64748B' }}>Narrow down results</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Search Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: '#475569' }}>Search Countries</label>
                  <div className="relative group">
                    <MagnifyingGlassIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors"
                      style={{ color: '#94A3B8' }}
                    />
                    <input
                      placeholder="Type to search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #CBD5E1',
                        color: '#1E293B'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#2563EB';
                        e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#CBD5E1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Status Filter Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Filter by Status
                  </label>

                  <div className="relative">
                    {/* Click Outside Overlay */}
                    {isFilterOpen && (
                      <div className="fixed inset-0 z-20" onClick={() => setIsFilterOpen(false)} />
                    )}

                    {/* Dropdown Trigger */}
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="w-full h-12 flex items-center justify-between px-4 bg-white rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 relative z-30"
                      style={{
                        border: '2px solid #4F46E5',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <FunnelIcon className="h-5 w-5 text-[#4F46E5]" />
                        <span className="font-semibold text-[#1E293B]">
                          {filterActive === 'all' && "Show All Countries"}
                          {filterActive === 'active' && "Active Only"}
                          {filterActive === 'inactive' && "Inactive Only"}
                        </span>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 text-[#64748B] transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Panel */}
                    <div
                      className={`
                        absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 transform transition-all duration-200 origin-top overflow-hidden
                        ${isFilterOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}
                      `}
                      style={{ boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.2)' }}
                    >
                      <div className="divide-y divide-slate-100">
                        {[
                          { value: 'all', label: 'Show All Countries', icon: '🌍', baseClass: 'text-slate-700 hover:bg-slate-50' },
                          { value: 'active', label: 'Active Countries Only', icon: '✓', baseClass: 'bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/50' },
                          { value: 'inactive', label: 'Inactive Countries Only', icon: '⚠', baseClass: 'bg-amber-50/50 text-amber-700 hover:bg-amber-100/50' }
                        ].map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              setFilterActive(option.value);
                              setIsFilterOpen(false);
                            }}
                            className={`
                              flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200
                              ${filterActive === option.value
                                ? 'bg-[#1E63D5] text-white font-semibold shadow-inner'
                                : `${option.baseClass} font-medium`}
                            `}
                          >
                            <span className={`text-lg ${filterActive === option.value ? 'text-white' : 'opacity-80'}`}>
                              {option.icon}
                            </span>
                            <span>{option.label}</span>

                            {filterActive === option.value && (
                              <CheckIcon className="h-4 w-4 ml-auto text-white stroke-[3px]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Full Width Table */}
          <div className="w-full">
            <div className="rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px]" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)', border: '2px solid #E2E8F0' }}>

              {/* Table Toolbar */}
              <div className="px-7 py-5 flex flex-wrap items-center justify-between gap-4" style={{ borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)' }}>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#1E293B' }}>Registered Countries</h2>
                  <p className="text-sm mt-1" style={{ color: '#64748B' }}>{filteredCountries.length} countries found</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300"
                    style={{
                      background: sortBy === "name"
                        ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'
                        : '#FFFFFF',
                      border: sortBy === "name"
                        ? '2px solid #C7D2FE'
                        : '2px solid #CBD5E1',
                      color: sortBy === "name" ? '#4338CA' : '#64748B',
                      boxShadow: sortBy === "name" ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    Name
                    {sortBy === "name" ? (
                      sortDirection === "asc"
                        ? <ChevronUpIcon className="h-4 w-4" />
                        : <ChevronDownIcon className="h-4 w-4" />
                    ) : <ArrowsUpDownIcon className="h-4 w-4" style={{ opacity: 0.5 }} />}
                  </button>
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300"
                    style={{
                      background: sortBy === "status"
                        ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'
                        : '#FFFFFF',
                      border: sortBy === "status"
                        ? '2px solid #C7D2FE'
                        : '2px solid #CBD5E1',
                      color: sortBy === "status" ? '#4338CA' : '#64748B',
                      boxShadow: sortBy === "status" ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    Status
                    {sortBy === "status" ? (
                      sortDirection === "asc"
                        ? <ChevronUpIcon className="h-4 w-4" />
                        : <ChevronDownIcon className="h-4 w-4" />
                    ) : <ArrowsUpDownIcon className="h-4 w-4" style={{ opacity: 0.5 }} />}
                  </button>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', borderBottom: '1px solid #E2E8F0' }}>
                      <th className="px-7 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Country</th>
                      <th className="px-7 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Status</th>
                      <th className="px-7 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Reference ID</th>
                      <th className="px-7 py-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: '#475569' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <TableSkeleton />
                    ) : paginatedCountries.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-20 text-center">
                          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                            <MagnifyingGlassIcon className="h-10 w-10 text-gray-300" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-700">No countries found</h3>
                          <p className="text-gray-500 mt-2 max-w-md mx-auto">
                            {searchTerm || filterActive !== "all"
                              ? "Try adjusting your search or filter criteria"
                              : "Start by adding your first country using the form on the left"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCountries.map((country) => (
                        <tr key={country._id} className="group hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-white transition-all duration-300">
                          <td className="px-7 py-5 align-middle">
                            {editId === country._id ? (
                              <div className="relative">
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full px-4 py-3 bg-white border-2 border-indigo-500 rounded-xl text-gray-900 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                  <GlobeAltIcon className="h-6 w-6" />
                                </div>
                                <div>
                                  <span className="text-base font-semibold text-gray-900">{country.name}</span>
                                  <p className="text-xs text-gray-400 mt-1">Added {new Date(country.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="px-7 py-5 align-middle">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => toggleActive(country)}
                                className={`group/toggle relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-offset-1 ${country.active
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 focus:ring-emerald-500/30'
                                  : 'bg-gradient-to-r from-gray-300 to-gray-400 focus:ring-gray-400/30'}`}
                              >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-500 ${country.active ? 'translate-x-8' : 'translate-x-1'}`} />
                              </button>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${country.active
                                ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200'}`}>
                                {country.active ? (
                                  <>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <div className="h-2 w-2 rounded-full bg-gray-400 mr-2"></div>
                                    Inactive
                                  </>
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-7 py-5 align-middle">
                            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200">
                              <span className="text-xs font-mono text-gray-500">ID:</span>
                              <span className="text-sm font-medium text-gray-700">#{country._id.slice(-8).toUpperCase()}</span>
                            </div>
                          </td>

                          <td className="px-7 py-5 align-middle text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                              {editId === country._id ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(country._id)}
                                    className="p-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg rounded-xl transition-all duration-300 active:scale-95"
                                    title="Save"
                                  >
                                    <CheckIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => { setEditId(null); setEditName(""); }}
                                    className="p-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg rounded-xl transition-all duration-300 active:scale-95"
                                    title="Cancel"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => { setEditId(country._id); setEditName(country.name) }}
                                    className="p-2.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:shadow-sm rounded-xl transition-all duration-300"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => removeCountry(country._id)}
                                    className="p-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:bg-red-200 hover:shadow-sm rounded-xl transition-all duration-300"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-5 w-5" />
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

              {/* Enhanced Pagination */}
              <div className="px-7 py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-2xl">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredCountries.length > 0 ? startIndex + 1 : 0}</span> to{" "}
                  <span className="font-semibold text-gray-900">{Math.min(startIndex + itemsPerPage, filteredCountries.length)}</span> of{" "}
                  <span className="font-semibold text-gray-900">{filteredCountries.length}</span> entries
                </p>
                <div className="flex items-center gap-3">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 :
                        currentPage >= totalPages - 2 ? totalPages - 4 + i :
                          currentPage - 2 + i;
                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-10 w-10 rounded-xl font-medium transition-all duration-300 ${currentPage === pageNum
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Helper Info */}
            <div className="mt-6 flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50/50 border border-blue-100 text-sm text-blue-800">
              <ExclamationTriangleIcon className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Quick Guide</p>
                <p className="text-blue-700/80 leading-relaxed">
                  Toggle the switch to change country visibility. Click the edit icon to rename a country.
                  Use filters to narrow down the list. Export feature downloads all countries as CSV.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default CountryTable;