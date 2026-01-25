import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search, ChevronLeft, ChevronRight, Edit3, Trash2, Check, X, Plus,
  Globe, Map, Building2, Hash, Layers,
} from "lucide-react";

import { getPincodes, deletePincode, updatePincode, addPincode } from "../../api/PincodeApi";
import { getCountries, getStates, getCities } from "../../api/locationApi";

const PincodeTable = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [pincode, setPincode] = useState("");

  // 1. Fixed fetchData to actually use cityId in the API call
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Pass cityId to API to let backend handle filtering (Fixes 400 errors)
      const res = await getPincodes(page, search, cityId);
      setData(res.data.data || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Fetch Error:", err.response?.data);
      toast.error(err.response?.data?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [page, search, cityId]);

  // 2. Fixed Effects - Correct dependencies to prevent infinite loops
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getCountries().then(res => setCountries(res.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    if (countryId) {
      getStates(countryId).then(res => setStates(res.data || [])).catch(() => { });
      setStateId(""); // Reset children when parent changes
      setCityId("");
    }
  }, [countryId]);

  useEffect(() => {
    if (stateId) {
      getCities(stateId).then(res => setCities(res.data || [])).catch(() => { });
      setCityId("");
    }
  }, [stateId]);

  const handleDelete = async (id) => {
    if (!id) return;
    if (window.confirm("Remove this entry?")) {
      try {
        await deletePincode(id);
        toast.success("Deleted successfully");
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || "Delete failed");
      }
    }
  };

  const saveEdit = async (id) => {
    if (!editValue.trim()) return toast.error("Value cannot be empty");
    try {
      await updatePincode(id, { pincode: editValue.trim() });
      setEditingId(null);
      fetchData();
      toast.success("Updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleAdd = async () => {
    if (!pincode.trim() || !cityId) return toast.warning("Pincode and City required");
    try {
      await addPincode({ pincode: pincode.trim(), cityId });
      setPincode("");
      fetchData();
      toast.success("Added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  // 3. Logic fix: Use 'data' directly since API is now filtering by cityId
  const filteredData = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-8 py-6">{/* UI LAYOUT FIX: Changed from p-4 md:p-8 to px-8 py-6 for consistency */}
      <ToastContainer />
      {/* UI LAYOUT FIX: Removed max-w-7xl mx-auto container */}
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pincode Management</h1>
              <p className="text-gray-600 mt-1">Manage pincodes within selected cities</p>
            </div>
          </div>

          {cityId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pincodes Found</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center group hover:bg-purple-200 transition-colors">
                    <Hash className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
              {/* Other Stat Cards... */}
            </div>
          )}
        </div>

        {/* Control Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Select Country
            </h2>
            <div className="relative">
              <select
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none"
                value={countryId}
                onChange={e => setCountryId(e.target.value)}
              >
                <option value="">Select Country</option>
                {countries.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
              </select>
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Map className="h-5 w-5 text-purple-600" />
              Select State
            </h2>
            <div className="relative">
              <select
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none disabled:opacity-50"
                value={stateId}
                onChange={e => setStateId(e.target.value)}
                disabled={!countryId}
              >
                <option value="">Select State</option>
                {states.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
              </select>
              <Map className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Select City
            </h2>
            <div className="relative">
              <select
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none disabled:opacity-50"
                value={cityId}
                onChange={e => setCityId(e.target.value)}
                disabled={!stateId}
              >
                <option value="">Select City</option>
                {cities.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
              </select>
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Add New Pincode
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                />
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={handleAdd}
                disabled={!cityId || !pincode.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                Add Pincode
              </button>
            </div>
          </div>
        </div>

        {/* Table Panel */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{cityId ? "City Pincodes" : "Pincodes"}</h2>
              <p className="text-sm text-gray-600">{loading ? 'Loading...' : `${filteredData.length} records`}</p>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none w-full sm:w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {!cityId ? (
              <div className="py-16 text-center text-gray-400">Please select a city to view pincodes</div>
            ) : loading ? (
              <div className="py-12 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" /></div>
            ) : filteredData.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No Pincodes Found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Pincode</th>
                    <th className="py-4 px-6">Geography</th>
                    <th className="py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((p) => (
                      <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          {editingId === p._id ? (
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="px-2 py-1 border rounded w-full"
                              onKeyPress={(e) => e.key === "Enter" && saveEdit(p._id)}
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium">{p.pincode}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          {p.cityId?.name} / {p.cityId?.stateId?.name}
                        </td>
                        <td className="py-4 px-6 flex gap-2">
                          {editingId === p._id ? (
                            <>
                              <button onClick={() => saveEdit(p._id)} className="p-2 bg-green-100 text-green-600 rounded"><Check size={16} /></button>
                              <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-600 rounded"><X size={16} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingId(p._id); setEditValue(p.pincode); }} className="p-2 bg-purple-100 text-purple-600 rounded"><Edit3 size={16} /></button>
                              <button onClick={() => handleDelete(p._id)} className="p-2 bg-red-100 text-red-600 rounded"><Trash2 size={16} /></button>
                            </>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {cityId && filteredData.length > 0 && (
            <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50">
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 disabled:opacity-30"><ChevronLeft size={20} /></button>
                <button disabled={page === pages} onClick={() => setPage(page + 1)} className="p-2 disabled:opacity-30"><ChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PincodeTable;