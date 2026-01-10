import { useState, useEffect, useCallback } from "react";
import { getCountries } from "../../Api/CountryApi";
import { getStates } from "../../Api/StateApi";
import { getCitiesByState, addCity, updateCity, deleteCity } from "../../Api/CityApi";
import LocationDropdown from "../LocationDropdown";
import {
  PlusIcon,
  GlobeAltIcon,
  MapIcon,
  BuildingOfficeIcon,
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

const CityTable = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
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

    switch(type) {
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
      setStateId("");
      setCities([]);
    }
  }, [countryId]);

  const loadStates = async () => {
    if (!countryId) return;
    
    try {
      const res = await getStates(countryId);
      const statesData = res.data || [];
      setStates(statesData);
    } catch {
      showToast("Failed to load states", "error");
      setStates([]);
    }
  };

  // Load cities when state changes
  const loadCities = useCallback(async () => {
    if (!stateId) {
      setCities([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await getCitiesByState(stateId);
      const citiesData = res.data || res.data?.data || res || [];
      setCities(citiesData);
      
      if (citiesData.length > 0) {
        showToast(`Loaded ${citiesData.length} cities`, "success");
      }
    } catch {
      showToast("Failed to load cities", "error");
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, [stateId]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  // ADD
  const add = async () => {
    if (!name.trim()) {
      showToast("Please enter a city name", "error");
      return;
    }

    if (!stateId) {
      showToast("Please select a state first", "error");
      return;
    }

    setActionLoading(true);
    try {
      await addCity({
        name: name.trim(),
        stateId,
      });
      
      setName("");
      await loadCities();
      showToast("City added successfully", "success");
      
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to add city", 
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // EDIT
  const startEdit = (city) => {
    const id = city._id || city._id;
    setEditId(id);
    setEditName(city.name);
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) {
      showToast("City name cannot be empty", "error");
      return;
    }

    try {
      await updateCity(id, { name: editName.trim() });
      setEditId(null);
      setEditName("");
      await loadCities();
      showToast("City updated successfully", "success");
    } catch {
      showToast("Failed to update city", "error");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  // DELETE
  const remove = async (id) => {
    const city = cities.find(c => (c._id === id) || (c.id === id));
    
    // Use a custom confirmation dialog with toast notification
    const confirmed = await new Promise((resolve) => {
      const toastId = toast.warning(
        <div>
          <p className="font-medium">Delete "{city?.name}"?</p>
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
      await deleteCity(id);
      await loadCities();
      showToast("City deleted successfully", "success");
    } catch {
      showToast("Failed to delete city", "error");
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      add();
    }
  };

  // Filter and sort cities
  const filteredCities = cities
    .filter((city) => {
      const cityName = (city.name || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchSearch = cityName.includes(search);
      const matchStatus = filterActive === "all" || 
                         (filterActive === "active" && city.active) || 
                         (filterActive === "inactive" && !city.active);

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const x = (a.name || "").toLowerCase();
      const y = (b.name || "").toLowerCase();
      return sortDirection === "asc"
        ? x.localeCompare(y)
        : y.localeCompare(x);
    });

  // Get selected country and state
  const selectedCountry = countries.find(c => c._id === countryId || c.id === countryId);
  const selectedState = states.find(s => s._id === stateId || s.id === stateId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Toast Container */}
      <ToastContainer />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <BuildingOfficeIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">City Management</h1>
              <p className="text-gray-600 mt-1">Manage cities within selected states</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stateId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Cities</p>
                    <p className="text-2xl font-bold text-gray-900">{cities.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center group hover:bg-indigo-200 transition-colors">
                    <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-green-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{cities.filter(c => c.active).length}</p>
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
                    <p className="text-2xl font-bold text-red-600">{cities.filter(c => !c.active).length}</p>
                  </div>
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center group hover:bg-red-200 transition-colors">
                    <XCircleIcon className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Filtered</p>
                    <p className="text-2xl font-bold text-purple-600">{filteredCities.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center group hover:bg-purple-200 transition-colors">
                    <FunnelIcon className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`mb-6 p-4 rounded-xl border ${
            notification.type === "error" 
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

        {/* REFACTORED: Control Cards in Single Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 1️⃣ Select Country Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GlobeAltIcon className="h-5 w-5 text-indigo-600" />
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
              <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg hover:border-indigo-300 transition-colors">
                <p className="text-sm text-indigo-700">
                  Selected: <span className="font-semibold">{selectedCountry.name}</span>
                </p>
              </div>
            )}
          </div>

          {/* 2️⃣ Select State Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-indigo-600" />
              Select State
            </h2>
            <div className="mb-4">
              <LocationDropdown
                label="State"
                data={states}
                value={stateId}
                onChange={setStateId}
                className="w-full"
                disabled={!countryId}
              />
            </div>
            {selectedState && (
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:border-blue-300 transition-colors">
                <p className="text-sm text-blue-700">
                  Selected: <span className="font-semibold">{selectedState.name}</span>
                </p>
              </div>
            )}
          </div>

          {/* 3️⃣ Add New City Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-indigo-600" />
              Add New City
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter city name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-gray-400"
                  disabled={actionLoading}
                />
              </div>

              <button
                onClick={add}
                disabled={!name.trim() || actionLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {actionLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5" />
                    Add City
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4️⃣ Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={loadCities}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 hover:from-indigo-100 hover:to-indigo-200 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Refresh Cities
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
        </div>

        {/* Right Panel - Cities Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {stateId ? `Cities in ${selectedState?.name}` : 'Cities'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {loading ? 'Loading...' : `${filteredCities.length} cities found`}
                  </p>
                </div>
                
                {stateId && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative group">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search cities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-48 transition-all hover:border-gray-400"
                      />
                    </div>

                    {/* Filter */}
                    <div className="relative group">
                      <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      <select
                        value={filterActive}
                        onChange={(e) => setFilterActive(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none w-full sm:w-auto transition-all hover:border-gray-400"
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
              {!stateId ? (
                <div className="py-16 text-center">
                  <div className="h-20 w-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform">
                    <BuildingOfficeIcon className="h-10 w-10 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No State Selected
                  </h3>
                  <p className="text-gray-400">
                    Please select a state to view its cities
                  </p>
                </div>
              ) : loading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="mt-4 text-gray-500">Loading cities...</p>
                  </div>
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform">
                    <PlusIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No Cities Found
                  </h3>
                  <p className="text-gray-400">
                    {searchTerm || filterActive !== 'all'
                      ? 'Try adjusting your search or filter'
                      : 'Add the first city for this state'}
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
                          City Name
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
                    {filteredCities.map((city) => {
                      const id = city._id || city._id;
                      return (
                        <tr 
                          key={id} 
                          className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 group"
                        >
                          <td className="py-4 px-6">
                            {editId === id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all hover:border-gray-400"
                                  onKeyPress={(e) => e.key === "Enter" && saveEdit(id)}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-all duration-200">
                                  <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{city.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  // Toggle active status if your API supports it
                                  const newActiveStatus = !city.active;
                                  updateCity(id, { active: newActiveStatus })
                                    .then(() => {
                                      loadCities();
                                      showToast(`${city.name} marked as ${newActiveStatus ? "active" : "inactive"}`, "success");
                                    })
                                    .catch(() => showToast("Failed to update status", "error"));
                                }}
                                className={`h-6 w-11 rounded-full transition-all duration-300 flex items-center p-1 ${
                                  city.active 
                                    ? 'bg-gradient-to-r from-green-400 to-green-500 justify-end hover:from-green-500 hover:to-green-600' 
                                    : 'bg-gradient-to-r from-gray-300 to-gray-400 justify-start hover:from-gray-400 hover:to-gray-500'
                                }`}
                              >
                                <div className="h-4 w-4 bg-white rounded-full shadow-sm hover:shadow transition-shadow" />
                              </button>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                city.active 
                                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300' 
                                  : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300'
                              }`}>
                                {city.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-500 font-mono bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200">
                              #{id.substring(0, 8)}...
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {editId === id ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(id)}
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
                                    onClick={() => startEdit(city)}
                                    disabled={editId !== null}
                                    className="p-2.5 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 hover:from-indigo-200 hover:to-indigo-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => remove(id)}
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
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer */}
            {stateId && filteredCities.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500">
                  <div>
                    Showing <span className="font-medium">{filteredCities.length}</span> of{' '}
                    <span className="font-medium">{cities.length}</span> cities
                  </div>
                  {(searchTerm || filterActive !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterActive('all');
                        setSortDirection('asc');
                        showToast("Filters cleared", "info");
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors mt-2 md:mt-0 hover:scale-105 transform transition-transform"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          {stateId && (
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-sm text-indigo-700">
                    Cities are linked to the selected state. To manage cities for a different state, please select another state from the dropdown.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityTable;