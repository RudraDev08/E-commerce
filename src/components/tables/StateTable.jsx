import { useState, useEffect } from "react";
import { getCountries } from "../../Api/CountryApi";
import {
  getStates,
  addState,
  updateState,
  deleteState,
} from "../../Api/StateApi";
import LocationDropdown from "../LocationDropdown";
import {
  PlusIcon,
  GlobeAltIcon,
  MapIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronUpDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StateTable = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [countryId, setCountryId] = useState("");
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [sortDirection, setSortDirection] = useState("asc");

  // Show toast notification
  const showToast = (message, type = "info") => {
    const options = {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    };

    switch (type) {
      case "success":
        toast.success(message, options);
        break;
      case "error":
        toast.error(message, options);
        break;
      case "warning":
        toast.warning(message, options);
        break;
      default:
        toast.info(message, options);
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Load countries
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const res = await getCountries();
      setCountries(res.data || []);
    } catch {
      showToast("Failed to load countries", "error");
    }
  };

  // Load states when country changes
  useEffect(() => {
    if (countryId) {
      loadStates();
    } else {
      setStates([]);
    }
  }, [countryId]);

  const loadStates = async () => {
    if (!countryId) return;

    setLoading(true);
    try {
      const res = await getStates(countryId);
      const statesData = res.data || [];
      setStates(statesData);

      if (statesData.length > 0) {
        showToast(`Loaded ${statesData.length} states`, "success");
      }
    } catch {
      showToast("Failed to load states", "error");
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  // ADD
  const add = async () => {
    if (!name.trim()) {
      showToast("Please enter a state name", "error");
      return;
    }

    if (!countryId) {
      showToast("Please select a country first", "error");
      return;
    }

    setActionLoading(true);
    try {
      await addState({
        name: name.trim(),
        countryId,
        active: true,
      });

      setName("");
      await loadStates();
      showToast("State added successfully", "success");

    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to add state",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // EDIT
  const startEdit = (state) => {
    setEditId(state._id || state._id);
    setEditName(state.name);
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) {
      showToast("State name cannot be empty", "error");
      return;
    }

    try {
      await updateState(id, { name: editName.trim() });
      setEditId(null);
      setEditName("");
      await loadStates();
      showToast("State updated successfully", "success");
    } catch {
      showToast("Failed to update state", "error");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  // TOGGLE ACTIVE
  const toggleActive = async (state) => {
    const newActiveStatus = !state.active;

    try {
      await updateState(state._id || state._id, { active: newActiveStatus });
      await loadStates();
      showToast(
        `${state.name} marked as ${newActiveStatus ? "active" : "inactive"}`,
        "success"
      );
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  // DELETE
  const remove = async (id) => {
    const state = states.find(s => (s._id === id) || (s.id === id));

    // Use a custom confirmation dialog with toast notification
    const confirmed = await new Promise((resolve) => {
      const toastId = toast.warning(
        <div>
          <p className="font-medium">Delete "{state?.name}"?</p>
          <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                resolve(true);
                toast.dismiss(toastId);
              }}
              className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => {
                resolve(false);
                toast.dismiss(toastId);
              }}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>,
        {
          position: "top-center",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
        }
      );
    });

    if (!confirmed) return;

    try {
      await deleteState(id);
      await loadStates();
      showToast("State deleted successfully", "success");
    } catch {
      showToast("Failed to delete state", "error");
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      add();
    }
  };

  // Filter and sort states
  const filteredStates = states
    .filter((state) => {
      const stateName = (state.name || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchSearch = stateName.includes(search);
      const matchStatus =
        filterActive === "all" ||
        (filterActive === "active" && state.active) ||
        (filterActive === "inactive" && !state.active);

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const x = (a.name || "").toLowerCase();
      const y = (b.name || "").toLowerCase();
      return sortDirection === "asc"
        ? x.localeCompare(y)
        : y.localeCompare(x);
    });

  // Stats
  const selectedCountry = countries.find(c => c._id === countryId || c.id === countryId);
  const activeStates = states.filter(s => s.active).length;
  const inactiveStates = states.filter(s => !s.active).length;

  return (
    <div className="min-h-screen px-8 py-6">{/* UI LAYOUT FIX: Changed from p-4 md:p-8 to px-8 py-6 for consistency */}
      {/* Toast Container */}
      <ToastContainer />

      {/* UI LAYOUT FIX: Removed max-w-7xl mx-auto container */}
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <MapIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">State Management</h1>
              <p className="text-gray-600 mt-1">Manage states within selected countries</p>
            </div>
          </div>

          {/* Stats Cards */}
          {countryId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total States</p>
                    <p className="text-2xl font-bold text-gray-900">{states.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center group hover:bg-blue-200 transition-colors">
                    <MapIcon className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-green-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{activeStates}</p>
                  </div>
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center group hover:bg-green-200 transition-colors">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-red-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Inactive</p>
                    <p className="text-2xl font-bold text-red-600">{inactiveStates}</p>
                  </div>
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center group hover:bg-red-200 transition-colors">
                    <XCircleIcon className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Filtered</p>
                    <p className="text-2xl font-bold text-indigo-600">{filteredStates.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center group hover:bg-indigo-200 transition-colors">
                    <FunnelIcon className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`mb-6 p-4 rounded-xl border ${notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
            }`}>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Country Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-blue-600" />
                Select Country
              </h2>
              <div className="mb-4">
                <LocationDropdown
                  label="Country"
                  data={countries}
                  value={countryId}
                  onChange={setCountryId}
                  className="w-full"
                />
              </div>
              {selectedCountry && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:border-blue-300 transition-colors">
                  <p className="text-sm text-blue-700">
                    Selected: <span className="font-semibold">{selectedCountry.name}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Add State Card */}
            {countryId && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PlusIcon className="h-5 w-5 text-blue-600" />
                  Add New State
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter state name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                      disabled={actionLoading}
                    />
                  </div>

                  <button
                    onClick={add}
                    disabled={!name.trim() || actionLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {actionLoading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5" />
                        Add State
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions Card */}
            {countryId && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={loadStates}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Refresh States
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterActive("all");
                      setSortDirection("asc");
                    }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - States Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {countryId ? `States in ${selectedCountry?.name}` : 'States'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {loading ? 'Loading...' : `${filteredStates.length} states found`}
                    </p>
                  </div>

                  {countryId && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        <input
                          type="text"
                          placeholder="Search states..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-48 transition-all hover:border-gray-400"
                        />
                      </div>

                      {/* Filter */}
                      <div className="relative group">
                        <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        <select
                          value={filterActive}
                          onChange={(e) => setFilterActive(e.target.value)}
                          className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none w-full sm:w-auto transition-all hover:border-gray-400"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active Only</option>
                          <option value="inactive">Inactive Only</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                {!countryId ? (
                  <div className="py-16 text-center">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform">
                      <MapIcon className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-500 mb-2">
                      No Country Selected
                    </h3>
                    <p className="text-gray-400">
                      Please select a country to view its states
                    </p>
                  </div>
                ) : loading ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-10 w-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                      <p className="mt-4 text-gray-500">Loading states...</p>
                    </div>
                  </div>
                ) : filteredStates.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform">
                      <PlusIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-500 mb-2">
                      No States Found
                    </h3>
                    <p className="text-gray-400">
                      {searchTerm || filterActive !== 'all'
                        ? 'Try adjusting your search or filter'
                        : 'Add the first state for this country'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th
                          className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                        >
                          <div className="flex items-center gap-2">
                            State Name
                            <ChevronUpDownIcon className="h-4 w-4" />
                            <span className="text-xs">
                              {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                            </span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStates.map((state) => (
                        <tr
                          key={state._id}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
                        >
                          <td className="py-4 px-6">
                            {editId === state._id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition-all hover:border-gray-400"
                                  onKeyPress={(e) => e.key === "Enter" && saveEdit(state._id)}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200">
                                  <MapIcon className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{state.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleActive(state)}
                                className={`h-6 w-11 rounded-full transition-all duration-300 flex items-center p-1 ${state.active
                                    ? 'bg-gradient-to-r from-green-400 to-green-500 justify-end hover:from-green-500 hover:to-green-600'
                                    : 'bg-gradient-to-r from-gray-300 to-gray-400 justify-start hover:from-gray-400 hover:to-gray-500'
                                  }`}
                              >
                                <div className="h-4 w-4 bg-white rounded-full shadow-sm hover:shadow transition-shadow" />
                              </button>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${state.active
                                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300'
                                  : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300'
                                }`}>
                                {state.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-500 font-mono bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200">
                              #{state._id.substring(0, 8)}...
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {editId === state._id ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(state._id)}
                                    className="p-2.5 bg-gradient-to-r from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                                    title="Save"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                                    title="Cancel"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(state)}
                                    disabled={editId !== null}
                                    className="p-2.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => remove(state._id)}
                                    disabled={editId !== null}
                                    className="p-2.5 bg-gradient-to-r from-red-100 to-red-200 text-red-700 hover:from-red-200 hover:to-red-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Footer */}
              {countryId && filteredStates.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500">
                    <div>
                      Showing <span className="font-medium">{filteredStates.length}</span> of{' '}
                      <span className="font-medium">{states.length}</span> states
                    </div>
                    {(searchTerm || filterActive !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterActive('all');
                          setSortDirection('asc');
                          showToast("Filters cleared", "info");
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors mt-2 md:mt-0 hover:scale-105 transform transition-transform"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            {countryId && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700">
                      States are linked to the selected country. To manage states for a different country, please select another country from the dropdown.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateTable;