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
  InformationCircleIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import {
  GlobeAltIcon as GlobeAltIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from "@heroicons/react/24/solid";

const CountryTable = () => {
  // Logic, State, and Handlers (UNCHANGED)
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
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 4000);
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

  useEffect(() => { fetchCountries(); }, [fetchCountries]);

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
      showNotification(error.response?.data?.message || "Failed to add country", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = async (country) => {
    try {
      await updateCountry(country._id, { active: !country.active });
      await fetchCountries();
      showNotification(`${country.name} status updated`, "success");
    } catch { showNotification("Failed to update status", "error"); }
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
    } catch { showNotification("Failed to update country", "error"); }
  };

  const removeCountry = async (id) => {
    if (window.confirm(`Are you sure you want to delete this country?`)) {
      try {
        await deleteCountry(id);
        await fetchCountries();
        showNotification("Country deleted successfully", "success");
      } catch { showNotification("Failed to delete country", "error"); }
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) { setSortDirection(sortDirection === "asc" ? "desc" : "asc"); }
    else { setSortBy(column); setSortDirection("asc"); }
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") addCountryHandler(); };

  const filteredCountries = countries
    .filter((country) => {
      const matchesSearch = country.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterActive === "all" || (filterActive === "active" && country.active) || (filterActive === "inactive" && !country.active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (sortBy === "status") return sortDirection === "asc" ? (a.active === b.active ? 0 : a.active ? -1 : 1) : (a.active === b.active ? 0 : a.active ? 1 : -1);
      return 0;
    });

  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCountries = filteredCountries.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterActive]);

  const exportCSV = () => {
    try {
      const csv = ["ID,Name,Status,Created At", ...countries.map(c => `${c._id},${c.name},${c.active ? "Active" : "Inactive"},"${new Date(c.createdAt).toLocaleDateString()}"`)].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `countries_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      showNotification("CSV exported successfully", "success");
    } catch { showNotification("Failed to export CSV", "error"); }
  };

  const activeCount = countries.filter((c) => c.active).length;
  const inactiveCount = countries.filter((c) => !c.active).length;
  const totalCount = countries.length;

  const TableSkeleton = () => (
    <>
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <tr key={index} className="animate-pulse border-b border-[#F1F5F9]">
          <td className="py-3 px-4"><div className="h-4 bg-[#F1F5F9] rounded w-32 mb-1"></div></td>
          <td className="py-3 px-4"><div className="h-5 w-10 bg-[#F1F5F9] rounded-full"></div></td>
          <td className="py-3 px-4"><div className="h-7 bg-[#F1F5F9] rounded w-16"></div></td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans text-[#475569]">
      <div className="w-full space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_10px_25px_rgba(15,23,42,0.08)]">
              <GlobeAltIconSolid className="h-6 w-6 text-[#4F46E5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Country Management</h1>
              <p className="text-sm text-[#475569] mt-1">Manage global locations and regional settings</p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] font-semibold rounded-xl hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          >
            <DocumentArrowDownIcon className="h-5 w-5 text-[#94A3B8] group-hover:text-[#475569]" />
            <span>Export Data</span>
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Countries", value: totalCount, icon: GlobeAltIcon, color: "text-[#4F46E5]", bg: "bg-[#EEF2FF]" },
            { label: "Active Regions", value: activeCount, icon: CheckCircleIconSolid, color: "text-[#22C55E]", bg: "bg-[#ECFDF5]" },
            { label: "Inactive Regions", value: inactiveCount, icon: ClockIcon, color: "text-[#F59E0B]", bg: "bg-[#FFFBEB]" },
            { label: "Filtered Results", value: filteredCountries.length, icon: FunnelIcon, color: "text-[#3B82F6]", bg: "bg-[#EFF6FF]" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.08)] border border-[#E2E8F0] flex items-center justify-between transition-transform hover:-translate-y-1">
              <div>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-extrabold text-[#0F172A] mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-sm animate-slide-down ${notification.type === "error" ? "bg-[#FEF2F2] border-[#EF4444] text-[#DC2626]" : "bg-[#ECFDF5] border-[#22C55E] text-[#16A34A]"
            }`}>
            {notification.type === "error" ? <ExclamationTriangleIcon className="h-5 w-5 text-[#EF4444]" /> : <CheckCircleIcon className="h-5 w-5 text-[#22C55E]" />}
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification({ ...notification, show: false })} className="ml-auto p-1 hover:bg-black/5 rounded-full">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Controls Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Add Country */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.08)] border border-[#E2E8F0] h-full">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
              <div className="p-2 bg-[#EEF2FF] rounded-lg text-[#4F46E5]">
                <PlusIcon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#0F172A]">Add New Country</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Country Name</label>
                <div className="relative">
                  <GlobeAltIcon className="absolute left-3.5 top-3 h-5 w-5 text-[#94A3B8]" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="e.g. United States"
                    className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-medium text-[#0F172A] placeholder:text-[#CBD5E1] focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all outline-none"
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Initial Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStatus(true)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${status ? "bg-[#ECFDF5] border-[#22C55E] text-[#16A34A] ring-2 ring-[#22C55E]/20" : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]"
                      }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatus(false)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${!status ? "bg-[#FFFBEB] border-[#F59E0B] text-[#D97706] ring-2 ring-[#F59E0B]/20" : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]"
                      }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={addCountryHandler}
                  disabled={!name.trim() || actionLoading}
                  className="w-full py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-bold shadow-lg shadow-[#4F46E5]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {actionLoading ? "Adding..." : "Add Country"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Filters & Sort */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.08)] border border-[#E2E8F0] h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
              <div className="p-2 bg-[#EFF6FF] rounded-lg text-[#3B82F6]">
                <FunnelIcon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#0F172A]">Filter & Sort</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-auto">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Search Countries</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3.5 top-3 h-5 w-5 text-[#94A3B8]" />
                  <input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-medium text-[#0F172A] placeholder:text-[#CBD5E1] focus:bg-white focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Filter By Status</label>
                <div className="relative">
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-medium text-[#0F172A] focus:bg-white focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all outline-none appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2394A3B8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                  >

                    <option value="all">Show All</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => handleSort("name")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${sortBy === "name" ? "bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5]" : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"}`}
              >
                Sort by Name
                {sortBy === "name" && (sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />)}
              </button>
              <button
                onClick={() => handleSort("status")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${sortBy === "status" ? "bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5]" : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"}`}
              >
                Sort by Status
                {sortBy === "status" && (sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />)}
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.08)] border border-[#E2E8F0] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#F1F5F9] flex justify-between items-center bg-[#F8FAFC]/50">
            <h2 className="font-bold text-[#0F172A]">Country List <span className="ml-2 text-xs py-1 px-2 bg-[#F1F5F9] text-[#475569] rounded-lg">{filteredCountries.length} entries</span></h2>
            <div className="flex gap-2">
              {/* Pagination Controls */}
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-[#E2E8F0] transition-all">
                <ArrowLeftIcon className="h-4 w-4 text-[#475569]" />
              </button>
              <span className="text-sm font-bold text-[#0F172A] py-2 px-1">Page {currentPage} of {totalPages || 1}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-[#E2E8F0] transition-all">
                <ArrowRightIcon className="h-4 w-4 text-[#475569]" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="px-8 py-5 text-xs font-bold text-[#94A3B8] uppercase tracking-wider w-1/3">Country Name</th>
                  <th className="px-8 py-5 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-8 py-5 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">ID</th>
                  <th className="px-8 py-5 text-xs font-bold text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {loading ? (
                  <TableSkeleton />
                ) : paginatedCountries.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4">
                        <MagnifyingGlassIcon className="h-8 w-8 text-[#CBD5E1]" />
                      </div>
                      <p className="text-[#0F172A] font-bold">No countries found</p>
                      <p className="text-[#94A3B8] text-sm mt-1">Adjust your filters or add a new country.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedCountries.map((country) => (
                    <tr key={country._id} className="group hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-8 py-4">
                        {editId === country._id ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border-2 border-[#4F46E5] rounded-lg text-sm font-bold text-[#0F172A] outline-none"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] group-hover:bg-white group-hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition-all">
                              <GlobeAltIcon className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-[#475569] group-hover:text-[#0F172A] transition-colors">{country.name}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleActive(country)} className={`relative flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 ${country.active ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'}`}>
                            <span className={`${country.active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                          </button>
                          {country.active ? (
                            <span className="px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#16A34A] text-xs font-bold border border-[#22C55E]/20">Active</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-[#F8FAFC] text-[#94A3B8] text-xs font-bold border border-[#E2E8F0]">Inactive</span>
                          )}
                        </div>
                      </td>

                      <td className="px-8 py-4">
                        <span className="font-mono text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E2E8F0]">#{country._id.slice(-6).toUpperCase()}</span>
                      </td>

                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          {editId === country._id ? (
                            <>
                              <button onClick={() => saveEdit(country._id)} className="p-2 bg-[#ECFDF5] hover:bg-[#22C55E] text-[#16A34A] hover:text-white rounded-lg transition-colors">
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setEditId(null); setEditName(""); }} className="p-2 bg-[#FEF2F2] hover:bg-[#EF4444] text-[#DC2626] hover:text-white rounded-lg transition-colors">
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditId(country._id); setEditName(country.name) }} className="p-2 hover:bg-[#EEF2FF] text-[#94A3B8] hover:text-[#4F46E5] rounded-lg transition-colors">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button onClick={() => removeCountry(country._id)} className="p-2 hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#DC2626] rounded-lg transition-colors">
                                <TrashIcon className="h-4 w-4" />
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
        </div>

        {/* Info Footer */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#EFF6FF] border border-[#3B82F6]/20 text-sm">
          <InformationCircleIcon className="h-5 w-5 text-[#3B82F6] shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[#1E3A8A]">
            <strong>Quick Tip:</strong> Use the toggle switch to instantly activate or deactivate a country for your customers. Edits are saved automatically upon confirmation.
          </p>
        </div>

      </div>

      <style>{`
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default CountryTable;