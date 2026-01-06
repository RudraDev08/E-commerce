import { useEffect, useState, useCallback } from "react";
import {
  getCountries,
  addCountry,
  updateCountry,
  deleteCountry,
} from "../../api/countryApi";
import ToggleSwitch from "../ToggleSwitch";
import {
  GlobeAltIcon,
  ChevronUpDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
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
} from "@heroicons/react/24/outline";

const CountryTable = () => {
  const [countries, setCountries] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch
  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCountries();
      setCountries(res.data || []);
    } catch {
      showNotification("Failed to load countries", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // ADD
  const add = async () => {
    if (!name.trim()) {
      showNotification("Please enter a country name", "error");
      return;
    }

    setActionLoading(true);
    try {
      await addCountry({
        name: name.trim(),
        active: status,
      });
      setName("");
      setStatus(true);
      fetchCountries();
      showNotification("Country added successfully", "success");
    } catch {
      showNotification("Failed to add country", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // TOGGLE
  const toggleActive = async (c) => {
    try {
      await updateCountry(c.id, { active: !c.active });
      fetchCountries();
      showNotification(`${c.name} status updated`, "success");
    } catch {
      showNotification("Failed to update status", "error");
    }
  };

  // EDIT
  const saveEdit = async (id) => {
    if (!editName.trim()) {
      showNotification("Country name cannot be empty", "error");
      return;
    }

    try {
      await updateCountry(String(id), { name: editName.trim() });
      setEditId(null);
      setEditName("");
      fetchCountries();
      showNotification("Country updated successfully", "success");
    } catch {
      showNotification("Failed to update country", "error");
    }
  };

  // DELETE
  const remove = async (id) => {
    const country = countries.find(c => c.id === id);
    if (window.confirm(`Are you sure you want to delete "${country?.name}"? This action cannot be undone.`)) {
      try {
        await deleteCountry(id);
        fetchCountries();
        showNotification("Country deleted successfully", "success");
      } catch {
        showNotification("Failed to delete country", "error");
      }
    }
  };

  // FILTER + SORT
  const filtered = countries
    .filter((c) => {
      const countryName = (c.name || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchSearch = countryName.includes(search);
      const matchStatus =
        filterActive === "all" ||
        (filterActive === "active" && c.active) ||
        (filterActive === "inactive" && !c.active);

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const x = (a.name || "").toLowerCase();
      const y = (b.name || "").toLowerCase();
      return sortDirection === "asc"
        ? x.localeCompare(y)
        : y.localeCompare(x);
    });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive]);

  // Export CSV
  const exportCSV = () => {
    try {
      const csv = [
        "ID,Name,Status",
        ...countries.map(
          (c) => `${c.id},${c.name},${c.active ? "Active" : "Inactive"}`
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `countries_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showNotification("CSV exported successfully", "success");
    } catch {
      showNotification("Failed to export CSV", "error");
    }
  };

  // Handle Enter key for add
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      add();
    }
  };

  // Stats
  const activeCount = countries.filter(c => c.active).length;
  const inactiveCount = countries.filter(c => !c.active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <GlobeAltIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Country Management</h1>
                <p className="text-gray-600 mt-1">Manage country names and status</p>
              </div>
            </div>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export CSV
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Countries</p>
                  <p className="text-2xl font-bold text-gray-900">{countries.length}</p>
                </div>
                <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <GlobeAltIcon className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Inactive</p>
                  <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
                </div>
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Filtered</p>
                  <p className="text-2xl font-bold text-indigo-600">{filtered.length}</p>
                </div>
                <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FunnelIcon className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`mb-6 p-4 rounded-xl border ${notification.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
            <div className="flex items-center gap-2">
              {notification.type === "error" ? (
                <ExclamationTriangleIcon className="h-5 w-5" />
              ) : (
                <CheckCircleIcon className="h-5 w-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Add Country Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-indigo-600" />
            Add New Country
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter country name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                disabled={actionLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value === "true")}
                className="w-full sm:w-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                disabled={actionLoading}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={add}
                disabled={!name.trim() || actionLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {actionLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5" />
                    Add Country
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter & Sort</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Countries
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  placeholder="Search country name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="w-full md:w-48 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <ChevronUpDownIcon className="h-5 w-5" />
                Sort {sortDirection === "asc" ? "A-Z" : "Z-A"}
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Countries List ({filtered.length})
              </h2>
              <div className="text-sm text-gray-600 mt-1 md:mt-0">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                      </td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <GlobeAltIcon className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">
                          No countries found
                        </h3>
                        <p className="text-gray-400">
                          {searchTerm || filterActive !== "all"
                            ? "Try adjusting your filters"
                            : "Add your first country above"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        {editId === c.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full"
                              onKeyPress={(e) => e.key === "Enter" && saveEdit(c.id)}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <GlobeAltIcon className="h-4 w-4 text-indigo-600" />
                            </div>
                            <span className="font-medium text-gray-900">{c.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <ToggleSwitch
                            value={c.active}
                            onToggle={() => toggleActive(c)}
                          />
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {c.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {editId === c.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(c.id)}
                                className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                                title="Save"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditId(null);
                                  setEditName("");
                                }}
                                className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditId(c.id);
                                  setEditName(c.name);
                                }}
                                disabled={editId !== null}
                                className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => remove(c.id)}
                                disabled={editId !== null}
                                className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete"
                              >
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

          {/* Pagination Footer */}
          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="text-sm text-gray-600 mb-4 md:mb-0">
                  Showing {start + 1} to {Math.min(start + itemsPerPage, filtered.length)} of {filtered.length} countries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg ${currentPage === pageNum
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 hover:bg-gray-100"
                          } transition-colors`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700">
                You can sort by clicking the column headers, filter by status, and search by name. 
                Use the pagination controls to navigate through the list.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryTable;