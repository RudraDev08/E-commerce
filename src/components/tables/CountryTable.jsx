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
  UserGroupIcon,
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      4000
    );
  };

  // Fetch countries
  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCountries();
      setCountries(res.data || []);
    } catch (error) {
      showNotification("Failed to load countries", "error");
      console.log(error);
    } finally {
      setTimeout(() => setLoading(false), 800); // Simulate loading for better UX
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Add country
  const addCountryHandler = async () => {
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

  // Toggle active status
  const toggleActive = async (country) => {
    try {
      await updateCountry(country._id, { active: !country.active });
      await fetchCountries();
      showNotification(`${country.name} status updated`, "success");
    } catch {
      showNotification("Failed to update status", "error");
    }
  };

  // Edit country
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

  // Delete country
  const removeCountry = async (id) => {
    const country = countries.find((c) => c.id === id);
    if (
      window.confirm(
        `Are you sure you want to delete "${country?.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteCountry(id);
        await fetchCountries();
        showNotification("Country deleted successfully", "success");
      } catch {
        showNotification("Failed to delete country", "error");
      }
    }
  };

  // Filter, sort, and paginate
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
      if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "status") {
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
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCountries = filteredCountries.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive]);

  // Export CSV
  const exportCSV = () => {
    try {
      const csv = [
        "ID,Name,Status,Created At",
        ...countries.map(
          (country) =>
            `${country._id},${country.name},${
              country.active ? "Active" : "Inactive"
            },"${new Date(country.createdAt).toLocaleDateString()}"`
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

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addCountryHandler();
    }
  };

  // Stats
  const activeCount = countries.filter((c) => c.active).length;
  const inactiveCount = countries.filter((c) => !c.active).length;
  const totalCount = countries.length;

  // Sort handler
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Skeleton loader for table rows
  const TableSkeleton = () => (
    <>
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <tr key={index} className="animate-pulse border-b border-gray-100">
          <td className="py-5 px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-24"></div>
              </div>
            </div>
          </td>
          <td className="py-5 px-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
          </td>
          <td className="py-5 px-6">
            <div className="flex gap-2">
              <div className="h-9 w-9 bg-gray-200 rounded-lg"></div>
              <div className="h-9 w-9 bg-gray-200 rounded-lg"></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-linear-to-br p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                <GlobeAltIconSolid className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent">
                  Country Management
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4" />
                  Manage and organize country data efficiently
                </p>
              </div>
            </div>
            <button
              onClick={exportCSV}
              className="group inline-flex items-center gap-3 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <DocumentArrowDownIcon className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              Export Data
            </button>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Countries
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totalCount}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 bg-gray-200 rounded-full flex-1">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="h-12 w-12 bg-linear-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
                  <GlobeAltIcon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Active Countries
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {activeCount}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 bg-gray-200 rounded-full flex-1">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${
                            totalCount > 0
                              ? (activeCount / totalCount) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-green-600">
                      {totalCount > 0
                        ? Math.round((activeCount / totalCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-linear-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <CheckCircleIconSolid className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Inactive Countries
                  </p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">
                    {inactiveCount}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 bg-gray-200 rounded-full flex-1">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${
                            totalCount > 0
                              ? (inactiveCount / totalCount) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-amber-600">
                      {totalCount > 0
                        ? Math.round((inactiveCount / totalCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-linear-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Filtered Results
                  </p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {filteredCountries.length}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 bg-gray-200 rounded-full flex-1">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${
                            totalCount > 0
                              ? (filteredCountries.length / totalCount) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="h-12 w-12 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <FunnelIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div
            className={`mb-6 animate-slide-down ${
              notification.type === "error"
                ? "bg-linear-to-r from-red-50 to-red-100 border-red-200"
                : "bg-linear-to-r from-green-50 to-emerald-100 border-emerald-200"
            } p-4 rounded-2xl border shadow-lg`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  notification.type === "error"
                    ? "bg-red-100"
                    : "bg-emerald-100"
                }`}
              >
                {notification.type === "error" ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    notification.type === "error"
                      ? "text-red-800"
                      : "text-emerald-800"
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() =>
                  setNotification({ show: false, message: "", type: "" })
                }
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Add Country Card */}
        <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add New Country
              </h2>
              <p className="text-gray-600 mt-1">
                Enter details to add a new country
              </p>
            </div>
            <div className="h-12 w-12 bg-linear-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
              <PlusIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country Name
              </label>
              <div className="relative">
                <GlobeAltIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter country name (e.g., United States)"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-gray-400"
                  disabled={actionLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Initial Status
              </label>
              <div className="relative">
                <FunnelIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value === "true")}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all hover:border-gray-400"
                  disabled={actionLoading}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={addCountryHandler}
              disabled={!name.trim() || actionLoading}
              className="group relative overflow-hidden bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                {actionLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding Country...</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Add Country</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Filter & Sort Countries
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Countries
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  placeholder="Search by country name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status Filter
              </label>
              <div className="relative">
                <FunnelIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all hover:border-gray-400"
                >
                  <option value="all">All Countries</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort Options
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort("name")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <ArrowsUpDownIcon className="h-4 w-4" />
                  <span>Name</span>
                  {sortBy === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUpIcon className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-indigo-600" />
                    ))}
                </button>
                <button
                  onClick={() => handleSort("status")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Status</span>
                  {sortBy === "status" &&
                    (sortDirection === "asc" ? (
                      <ChevronUpIcon className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-indigo-600" />
                    ))}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Countries Table */}
        <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
          {/* Table Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Countries List
                </h2>
                <p className="text-gray-600 mt-1">
                  Showing{" "}
                  <span className="font-semibold text-indigo-600">
                    {filteredCountries.length}
                  </span>{" "}
                  of {totalCount} countries
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="text-sm text-gray-600">
                  Page{" "}
                  <span className="font-bold text-gray-900">{currentPage}</span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-900">{totalPages}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-linear-to-r from-gray-50 to-gray-100">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="h-4 w-4" />
                      Country Details
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : paginatedCountries.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="h-24 w-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                          <GlobeAltIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          {searchTerm || filterActive !== "all"
                            ? "No matching countries found"
                            : "No countries added yet"}
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {searchTerm || filterActive !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : "Start by adding your first country using the form above"}
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setFilterActive("all");
                            }}
                            className="px-6 py-3 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCountries.map((country) => (
                    <tr
                      key={country._id}
                      className="group hover:bg-linear-to-r hover:from-indigo-50/30 hover:to-blue-50/30 transition-all duration-200 border-b border-gray-100 last:border-0"
                    >
                      <td className="py-5 px-6">
                        {editId === country._id ? (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-linear-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center">
                              <GlobeAltIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 px-4 py-2.5 bg-white border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              onKeyPress={(e) =>
                                e.key === "Enter" && saveEdit(country._id)
                              }
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                                country.active
                                  ? "bg-linear-to-br from-green-100 to-emerald-100"
                                  : "bg-linear-to-br from-gray-100 to-gray-200"
                              }`}
                            >
                              <GlobeAltIcon
                                className={`h-6 w-6 ${
                                  country.active
                                    ? "text-green-600"
                                    : "text-gray-500"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {country.name}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                  ID: {country._id}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                Last updated:{" "}
                                {new Date(
                                  country.updatedAt || Date.now()
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleActive(country)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                                ${
                                  country.active
                                    ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                                }`}
                          >
                            {country.active ? "Active" : "Inactive"}
                          </button>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          {editId === country._id ? (
                            <>
                              <button
                                onClick={() => saveEdit(country._id)}
                                className="p-2.5 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                                title="Save changes"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditId(null);
                                  setEditName("");
                                }}
                                className="p-2.5 bg-linear-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg"
                                title="Cancel edit"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditId(country._id);
                                  setEditName(country.name);
                                }}
                                disabled={editId !== null}
                                className="p-2.5 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit country"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => removeCountry(country._id)}
                                disabled={editId !== null}
                                className="p-2.5 bg-linear-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete country"
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

          {/* Pagination */}
          {filteredCountries.length > 0 && (
            <div className="px-6 py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="text-sm text-gray-600 mb-4 md:mb-0">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredCountries.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredCountries.length}
                  </span>{" "}
                  countries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-gray-400"
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
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
                            : "border border-gray-300 hover:bg-gray-100 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-gray-400"
                  >
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Footer */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Tips for managing countries
              </h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                  Use the search bar to quickly find specific countries
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                  Toggle status switches to activate or deactivate countries
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                  Click column headers to sort by name or status
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                  Export data as CSV for external use
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CountryTable;
