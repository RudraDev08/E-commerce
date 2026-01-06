import { useEffect, useState } from "react";
import { getStates } from "../../Api/StateApi";
import { getCities, addCity, updateCity, deleteCity } from "../../Api/CityApi";
import LocationDropdown from "../LocationDropdown";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpDownIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const CityTable = () => {
  const [stateId, setStateId] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [sortDirection, setSortDirection] = useState("asc");

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Load states
  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const res = await getStates("");
      setStates(res.data || []);
    } catch {
      showNotification("Failed to load states", "error");
    }
  };

  // Load cities when state changes
  useEffect(() => {
    if (stateId) {
      loadCities();
    } else {
      setCities([]);
    }
  }, [stateId]);

  const loadCities = async () => {
    setLoading(true);
    try {
      const res = await getCities(stateId);
      setCities(res.data || []);
      showNotification("Cities loaded successfully", "success");
    } catch {
      showNotification("Failed to load cities", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add city
  const add = async () => {
    if (!name.trim()) {
      showNotification("Please enter a city name", "error");
      return;
    }

    if (!stateId) {
      showNotification("Please select a state first", "error");
      return;
    }

    setActionLoading(true);
    try {
      await addCity({ name: name.trim(), stateId, active: true });
      setName("");
      await loadCities();
      showNotification("City added successfully", "success");
    } catch {
      showNotification("Failed to add city", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit city
  const startEdit = (city) => {
    setEditId(city.id);
    setEditName(city.name);
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) {
      showNotification("City name cannot be empty", "error");
      return;
    }

    try {
      await updateCity(id, { name: editName.trim() });
      setEditId(null);
      setEditName("");
      await loadCities();
      showNotification("City updated successfully", "success");
    } catch {
      showNotification("Failed to update city", "error");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  // Toggle active status
  const toggleActive = async (city) => {
    try {
      await updateCity(city.id, { active: !city.active });
      await loadCities();
      showNotification(
        `${city.name} marked as ${!city.active ? "active" : "inactive"}`,
        "success"
      );
    } catch {
      showNotification("Failed to update status", "error");
    }
  };

  // Delete city
  const remove = async (id) => {
    const city = cities.find(c => c.id === id);
    if (window.confirm(`Are you sure you want to delete "${city?.name}"? This action cannot be undone.`)) {
      try {
        await deleteCity(id);
        await loadCities();
        showNotification("City deleted successfully", "success");
      } catch {
        showNotification("Failed to delete city", "error");
      }
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
      const matchStatus =
        filterActive === "all" ||
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

  // Stats
  const activeCities = cities.filter(c => c.active).length;
  const inactiveCities = cities.filter(c => !c.active).length;
  const selectedState = states.find(s => s.id === stateId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
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
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Cities</p>
                    <p className="text-2xl font-bold text-gray-900">{cities.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{activeCities}</p>
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
                    <p className="text-2xl font-bold text-red-600">{inactiveCities}</p>
                  </div>
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Filtered</p>
                    <p className="text-2xl font-bold text-blue-600">{filteredCities.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FunnelIcon className="h-5 w-5 text-blue-600" />
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* State Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-emerald-600" />
                Select State
              </h2>
              <div className="mb-4">
                <LocationDropdown
                  label="State"
                  data={states}
                  value={stateId}
                  onChange={setStateId}
                  className="w-full"
                />
              </div>
              {selectedState && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700">
                    Selected: <span className="font-semibold">{selectedState.name}</span>
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {cities.length} cities in this state
                  </p>
                </div>
              )}
            </div>

            {/* Add City Card */}
            {stateId && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PlusIcon className="h-5 w-5 text-emerald-600" />
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={actionLoading}
                      autoFocus={stateId}
                    />
                  </div>

                  <button
                    onClick={add}
                    disabled={!name.trim() || actionLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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

                {/* Quick Tips */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Tips</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                      Press Enter to quickly add
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Click status toggle to activate/deactivate
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Quick Actions Card */}
            {stateId && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={loadCities}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh Cities
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterActive("all");
                      setSortDirection("asc");
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Cities Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
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
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search cities..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-48"
                        />
                      </div>

                      {/* Filter */}
                      <div className="relative">
                        <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          value={filterActive}
                          onChange={(e) => setFilterActive(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none w-full sm:w-auto"
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
                    <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 mb-2">
                      No State Selected
                    </h3>
                    <p className="text-gray-400">
                      Please select a state to view its cities
                    </p>
                  </div>
                ) : loading ? (
                  // Loading skeleton
                  <div className="p-6">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="animate-pulse flex items-center justify-between mb-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredCities.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PlusIcon className="h-6 w-6 text-gray-400" />
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
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
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
                      {filteredCities.map((city) => (
                        <tr 
                          key={city.id} 
                          className="hover:bg-gray-50 transition-colors duration-150 group"
                        >
                          <td className="py-4 px-6">
                            {editId === city.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full"
                                  onKeyPress={(e) => e.key === "Enter" && saveEdit(city.id)}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <BuildingOfficeIcon className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900 block">{city.name}</span>
                                  <span className="text-xs text-gray-500">
                                    Added: {new Date().toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleActive(city)}
                                className={`h-6 w-11 rounded-full transition-colors duration-200 flex items-center p-1 ${
                                  city.active ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                                }`}
                                title={city.active ? "Click to deactivate" : "Click to activate"}
                              >
                                <div className="h-4 w-4 bg-white rounded-full shadow-sm" />
                              </button>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                city.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {city.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                              #{city.id}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {editId === city.id ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(city.id)}
                                    className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                                    title="Save"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
                                    className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => remove(city.id)}
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
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Footer */}
              {stateId && filteredCities.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500">
                    <div>
                      Showing <span className="font-medium">{filteredCities.length}</span> of{' '}
                      <span className="font-medium">{cities.length}</span> cities
                      {searchTerm && (
                        <span className="ml-2 text-emerald-600">
                          • Searching for: "{searchTerm}"
                        </span>
                      )}
                    </div>
                    {(searchTerm || filterActive !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterActive('all');
                          setSortDirection('asc');
                        }}
                        className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors mt-2 md:mt-0 flex items-center gap-1"
                      >
                        <FunnelIcon className="h-4 w-4" />
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            {stateId && (
              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-800">
                      <span className="font-semibold">Pro Tip:</span> You can quickly edit city names by clicking the edit icon. 
                      Use the toggle switch to activate or deactivate cities. Cities are linked to the selected state.
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

export default CityTable;