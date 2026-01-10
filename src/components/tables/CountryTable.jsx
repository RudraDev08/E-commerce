import { useEffect, useState, useCallback } from "react";
import {
  getCountries,
  addCountry,
  updateCountry,
  deleteCountry,
} from "../../api/CountryApi";
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
        <tr key={index} className="animate-pulse border-b border-gray-100">
          <td className="py-5 px-6"><div className="h-4 bg-gray-200 rounded w-32 mb-2"></div></td>
          <td className="py-5 px-6"><div className="h-6 w-12 bg-gray-200 rounded-full"></div></td>
          <td className="py-5 px-6"><div className="h-9 bg-gray-200 rounded-lg w-20"></div></td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-linear-to-br p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section (Unchanged) */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                <GlobeAltIconSolid className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent">Country Management</h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2"><ChartBarIcon className="h-4 w-4" />Manage country data efficiently</p>
              </div>
            </div>
            <button onClick={exportCSV} className="group inline-flex items-center gap-3 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
              <DocumentArrowDownIcon className="h-5 w-5 group-hover:rotate-12 transition-transform" /> Export Data
            </button>
          </div>

          {/* Stats Dashboard (Unchanged) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-500">Total Countries</p><p className="text-3xl font-bold text-gray-900 mt-2">{totalCount}</p></div>
                <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center"><GlobeAltIcon className="h-6 w-6 text-indigo-600" /></div>
              </div>
            </div>
            <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-500">Active</p><p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p></div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircleIconSolid className="h-6 w-6 text-green-600" /></div>
              </div>
            </div>
            <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-500">Inactive</p><p className="text-3xl font-bold text-amber-600 mt-2">{inactiveCount}</p></div>
                <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center"><ClockIcon className="h-6 w-6 text-amber-600" /></div>
              </div>
            </div>
            <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-500">Filtered</p><p className="text-3xl font-bold text-blue-600 mt-2">{filteredCountries.length}</p></div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center"><FunnelIcon className="h-6 w-6 text-blue-600" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Section (Unchanged) */}
        {notification.show && (
          <div className={`mb-6 animate-slide-down ${notification.type === "error" ? "bg-red-50 border-red-200" : "bg-green-50 border-emerald-200"} p-4 rounded-2xl border shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${notification.type === "error" ? "bg-red-100" : "bg-emerald-100"}`}>
                {notification.type === "error" ? <ExclamationTriangleIcon className="h-5 w-5 text-red-600" /> : <CheckCircleIcon className="h-5 w-5 text-emerald-600" />}
              </div>
              <div className="flex-1"><p className={`font-medium ${notification.type === "error" ? "text-red-800" : "text-emerald-800"}`}>{notification.message}</p></div>
              <button onClick={() => setNotification({ show: false, message: "", type: "" })} className="p-1"><XMarkIcon className="h-4 w-4 text-gray-500" /></button>
            </div>
          </div>
        )}

        {/* 1️⃣ LAYOUT CHANGE: SINGLE ROW PARENT CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* 2️⃣ LEFT COLUMN: ADD COUNTRY SECTION */}
          <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Country</h2>
                <p className="text-sm text-gray-600">Enter details to add country</p>
              </div>
              <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <PlusIcon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Country Name</label>
                <div className="relative">
                  <GlobeAltIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyPress} placeholder="e.g., United States" className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" disabled={actionLoading} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Initial Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value === "true")} className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all" disabled={actionLoading}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={addCountryHandler} disabled={!name.trim() || actionLoading} className="w-full sm:w-auto bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl shadow-md transition-all">
                {actionLoading ? "Adding..." : "Add Country"}
              </button>
            </div>
          </div>

          {/* 3️⃣ RIGHT COLUMN: FILTER & SORT SECTION */}
          <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-200 flex flex-col justify-between">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Filter & Sort</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Search</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input placeholder="Country name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Status</label>
                  <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all">
                    <option value="all">All Countries</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Sort List By</label>
                <div className="flex gap-2">
                  <button onClick={() => handleSort("name")} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl hover:border-indigo-500 transition-all text-sm font-medium">
                    <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" /> Name
                    {sortBy === "name" && (sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4 text-indigo-600" /> : <ChevronDownIcon className="h-4 w-4 text-indigo-600" />)}
                  </button>
                  <button onClick={() => handleSort("status")} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl hover:border-indigo-500 transition-all text-sm font-medium">
                    <CheckCircleIconSolid className="h-4 w-4 text-gray-400" /> Status
                    {sortBy === "status" && (sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4 text-indigo-600" /> : <ChevronDownIcon className="h-4 w-4 text-indigo-600" />)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Countries Table (Unchanged) */}
        <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Countries List</h2>
            <div className="text-sm text-gray-600">Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-linear-to-r from-gray-50 to-gray-100">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Country Details</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <TableSkeleton /> : paginatedCountries.map((country) => (
                  <tr key={country._id} className="group hover:bg-indigo-50/30 transition-all duration-200 border-b border-gray-100 last:border-0">
                    <td className="py-5 px-6">
                      {editId === country._id ? (
                        <div className="flex items-center gap-3">
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyPress={(e) => e.key === "Enter" && saveEdit(country._id)} className="flex-1 px-4 py-2 bg-white border-2 border-indigo-300 rounded-lg outline-none" autoFocus />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${country.active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}><GlobeAltIcon className="h-5 w-5" /></div>
                          <div><p className="font-semibold text-gray-900">{country.name}</p><p className="text-xs text-gray-400">ID: {country._id}</p></div>
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <button onClick={() => toggleActive(country)} className={`px-4 py-1 rounded-full text-xs font-medium border ${country.active ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {country.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        {editId === country._id ? (
                          <><button onClick={() => saveEdit(country._id)} className="p-2 bg-green-500 text-white rounded-lg"><CheckIcon className="h-4 w-4" /></button>
                          <button onClick={() => { setEditId(null); setEditName(""); }} className="p-2 bg-gray-500 text-white rounded-lg"><XMarkIcon className="h-4 w-4" /></button></>
                        ) : (
                          <><button onClick={() => { setEditId(country._id); setEditName(country.name); }} className="p-2 bg-blue-500 text-white rounded-lg shadow-sm"><PencilIcon className="h-4 w-4" /></button>
                          <button onClick={() => removeCountry(country._id)} className="p-2 bg-red-500 text-white rounded-lg shadow-sm"><TrashIcon className="h-4 w-4" /></button></>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls (Unchanged) */}
          {filteredCountries.length > 0 && (
            <div className="px-6 py-5 border-t border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <div className="text-sm text-gray-600">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCountries.length)} of {filteredCountries.length} countries</div>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50"><ArrowLeftIcon className="h-4 w-4" /></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50"><ArrowRightIcon className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>

        {/* Help Footer (Unchanged) */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
          <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div><h3 className="font-semibold text-blue-900 mb-1 text-sm">Quick Tips</h3><p className="text-xs text-blue-700 leading-relaxed">Search by name, filter by status, and sort to manage your country list efficiently. Exports are available in CSV format.</p></div>
        </div>
      </div>

      <style>{`
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default CountryTable;