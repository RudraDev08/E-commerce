import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search, ChevronLeft, ChevronRight, Edit3, Trash2, Check, X, Plus,
  Globe, Map, Building2, Hash, Layers, RefreshCw, Download, Upload,
  CheckCircle, XCircle, Filter
} from "lucide-react";

import { getPincodes, deletePincode, updatePincode, addPincode } from "../../api/PincodeApi";
import { getCountries, getStates, getCities } from "../../api/locationApi";
import LocationDropdown from "../LocationDropdown";

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
  const [filterActive, setFilterActive] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getCountries().then(res => setCountries(res.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    if (countryId) {
      getStates(countryId).then(res => setStates(res.data || [])).catch(() => { });
      setStateId("");
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

    const confirmed = await new Promise((resolve) => {
      const toastId = toast.warning(
        <div>
          <p className="font-medium">Delete this pincode?</p>
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
      await deletePincode(id);
      toast.success("Deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
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
      await addPincode({ pincode: pincode.trim(), cityId, active: true });
      setPincode("");
      fetchData();
      toast.success("Added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  const toggleStatus = async (p) => {
    try {
      const newStatus = !p.active;
      setData(prev => prev.map(item => item._id === p._id ? { ...item, active: newStatus } : item));
      await updatePincode(p._id, { active: newStatus });
      toast.success(`Pincode ${newStatus ? 'Activated' : 'Deactivated'}`);
    } catch (err) {
      setData(prev => prev.map(item => item._id === p._id ? { ...item, active: !p.active } : item));
      toast.error("Status update failed");
    }
  };

  const filteredData = data.filter((item) => {
    const matchStatus =
      filterActive === "all" ||
      (filterActive === "active" && item.active) ||
      (filterActive === "inactive" && !item.active);
    return matchStatus;
  });

  const selectedCountry = countries.find(c => c._id === countryId);
  const selectedState = states.find(s => s._id === stateId);
  const selectedCity = cities.find(c => c._id === cityId);
  const activeCount = data.filter(p => p.active).length;
  const inactiveCount = data.filter(p => !p.active).length;

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-8 py-6">
      <ToastContainer />

      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-2xl shadow-[0_10px_25px_-10px_rgba(124,58,237,0.4)] hover:shadow-[0_15px_35px_-12px_rgba(124,58,237,0.5)] transition-all duration-300">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#111827]">Pincode Management</h1>
                <p className="text-[#6B7280] mt-1">Manage pincodes within selected cities</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="px-4 py-2.5 bg-white border border-[#E5E7EB] text-[#374151] rounded-xl hover:bg-[#F3F4F6] hover:border-[#C4B5FD] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button className="px-4 py-2.5 bg-white border border-[#E5E7EB] text-[#374151] rounded-xl hover:bg-[#F3F4F6] hover:border-[#C4B5FD] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="px-4 py-2.5 bg-white border border-[#E5E7EB] text-[#374151] rounded-xl hover:bg-[#F3F4F6] hover:border-[#C4B5FD] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow">
                <Upload className="h-4 w-4" />
                Import
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {cityId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 15px 35px -12px rgba(124, 58, 237, 0.25)" }}
                className="bg-white rounded-2xl p-6 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] border border-[#E5E7EB] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6B7280] mb-1">Total Pincodes</p>
                    <p className="text-3xl font-bold text-[#111827]">{data.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-xl flex items-center justify-center">
                    <Hash className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, boxShadow: "0 15px 35px -12px rgba(34, 197, 94, 0.25)" }}
                className="bg-white rounded-2xl p-6 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] border border-[#E5E7EB] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6B7280] mb-1">Active</p>
                    <p className="text-3xl font-bold text-[#22C55E]">{activeCount}</p>
                  </div>
                  <div className="h-12 w-12 bg-[#DCFCE7] rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-[#22C55E]" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, boxShadow: "0 15px 35px -12px rgba(156, 163, 175, 0.25)" }}
                className="bg-white rounded-2xl p-6 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] border border-[#E5E7EB] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6B7280] mb-1">Inactive</p>
                    <p className="text-3xl font-bold text-[#9CA3AF]">{inactiveCount}</p>
                  </div>
                  <div className="h-12 w-12 bg-[#F3F4F6] rounded-xl flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-[#9CA3AF]" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, boxShadow: "0 15px 35px -12px rgba(124, 58, 237, 0.25)" }}
                className="bg-white rounded-2xl p-6 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] border border-[#E5E7EB] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6B7280] mb-1">Selected City</p>
                    <p className="text-lg font-bold text-[#111827] truncate">{selectedCity?.name || "None"}</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-[#7C3AED]" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Filter Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Country Filter */}
          <div className="bg-white rounded-2xl shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] p-6 border border-[#E5E7EB] hover:shadow-[0_15px_35px_-12px_rgba(124,58,237,0.25)] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 rounded-xl flex items-center justify-center">
                <Globe className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Country</h3>
                <p className="text-xs text-[#6B7280]">Select country</p>
              </div>
            </div>
            <LocationDropdown
              data={countries}
              value={countryId}
              onChange={setCountryId}
              placeholder="Select Country"
            />
          </div>

          {/* State Filter */}
          <div className="bg-white rounded-2xl shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] p-6 border border-[#E5E7EB] hover:shadow-[0_15px_35px_-12px_rgba(124,58,237,0.25)] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 rounded-xl flex items-center justify-center">
                <Map className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">State</h3>
                <p className="text-xs text-[#6B7280]">{countryId ? "Select state" : "Select country first"}</p>
              </div>
            </div>
            <LocationDropdown
              data={states}
              value={stateId}
              onChange={setStateId}
              placeholder="Select State"
            />
          </div>

          {/* City Filter */}
          <div className="bg-white rounded-2xl shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] p-6 border border-[#E5E7EB] hover:shadow-[0_15px_35px_-12px_rgba(124,58,237,0.25)] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">City</h3>
                <p className="text-xs text-[#6B7280]">{stateId ? "Select city" : "Select state first"}</p>
              </div>
            </div>
            <LocationDropdown
              data={cities}
              value={cityId}
              onChange={setCityId}
              placeholder="Select City"
            />
          </div>

          {/* Add Pincode Card - Dark Theme */}
          <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] rounded-2xl shadow-[0_10px_25px_-10px_rgba(0,0,0,0.3)] p-6 border border-[#374151] hover:shadow-[0_15px_35px_-12px_rgba(124,58,237,0.4)] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-xl flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Add Pincode</h3>
                <p className="text-xs text-[#9CA3AF]">Create new entry</p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                className="w-full px-4 py-3 bg-[#374151] border border-[#4B5563] text-white placeholder-[#9CA3AF] rounded-xl focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED] outline-none transition-all"
                placeholder="Enter pincode"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
              />
              <button
                onClick={handleAdd}
                disabled={!cityId || !pincode.trim()}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                Add Pincode
              </button>
            </div>
          </div>
        </motion.div>

        {/* Table Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] overflow-hidden border border-[#E5E7EB]"
        >
          {/* Table Header */}
          <div className="px-6 py-5 border-b border-[#E5E7EB] bg-gradient-to-r from-[#F9FAFB] to-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">
                  {cityId ? `Pincodes - ${selectedCity?.name}` : "Pincodes"}
                </h2>
                <p className="text-sm text-[#6B7280] mt-1">
                  {loading ? "Loading..." : `${filteredData.length} of ${data.length} records`}
                </p>
              </div>

              {cityId && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors" />
                    <input
                      type="text"
                      placeholder="Search pincodes..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-10 pr-4 py-2.5 border border-[#D1D5DB] rounded-xl focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED] outline-none w-full sm:w-56 transition-all hover:border-[#C4B5FD]"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="w-full sm:w-48">
                    <LocationDropdown
                      data={[
                        { _id: "active", name: "Active Only" },
                        { _id: "inactive", name: "Inactive Only" },
                      ]}
                      value={filterActive === 'all' ? '' : filterActive}
                      onChange={(val) => setFilterActive(val || 'all')}
                      placeholder="All Status"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {!cityId ? (
              <div className="py-20 text-center">
                <div className="h-20 w-20 bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-10 w-10 text-[#7C3AED]" />
                </div>
                <h3 className="text-lg font-semibold text-[#374151] mb-2">No City Selected</h3>
                <p className="text-[#9CA3AF]">Please select a city to view and manage pincodes</p>
              </div>
            ) : loading ? (
              <div className="py-16 flex justify-center">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin" />
                  <p className="mt-4 text-[#6B7280] font-medium">Loading pincodes...</p>
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="py-16 text-center">
                <div className="h-20 w-20 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="h-10 w-10 text-[#9CA3AF]" />
                </div>
                <h3 className="text-lg font-semibold text-[#374151] mb-2">No Pincodes Found</h3>
                <p className="text-[#9CA3AF]">
                  {search || filterActive !== 'all'
                    ? "Try adjusting your search or filter"
                    : "Add the first pincode for this city"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#F9FAFB] to-white sticky top-0">
                  <tr className="text-left text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    <th className="py-4 px-6">Pincode</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Geography</th>
                    <th className="py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((p, index) => (
                      <motion.tr
                        key={p._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gradient-to-r hover:from-[#7C3AED]/5 hover:to-[#4F46E5]/5 transition-all duration-200 group"
                      >
                        <td className="py-4 px-6">
                          {editingId === p._id ? (
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="px-3 py-2 border border-[#D1D5DB] rounded-lg w-full focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED] outline-none"
                              onKeyPress={(e) => e.key === "Enter" && saveEdit(p._id)}
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 rounded-lg flex items-center justify-center group-hover:from-[#7C3AED]/20 group-hover:to-[#4F46E5]/20 transition-all">
                                <Hash className="h-5 w-5 text-[#7C3AED]" />
                              </div>
                              <span className="font-semibold text-[#111827] group-hover:text-[#7C3AED] transition-colors">{p.pincode}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleStatus(p)}
                              className={`relative flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/25 ${p.active
                                  ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A]'
                                  : 'bg-[#D1D5DB]'
                                }`}
                            >
                              <span className={`${p.active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300`} />
                            </button>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${p.active
                                ? 'bg-[#DCFCE7] text-[#166534] border border-[#22C55E]/20'
                                : 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]'
                              }`}>
                              {p.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <Building2 className="h-4 w-4 text-[#9CA3AF]" />
                            <span>{p.cityId?.name}</span>
                            <span className="text-[#D1D5DB]">/</span>
                            <span>{p.cityId?.stateId?.name}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {editingId === p._id ? (
                              <>
                                <button
                                  onClick={() => saveEdit(p._id)}
                                  className="p-2.5 bg-[#DCFCE7] text-[#166534] rounded-lg hover:bg-[#22C55E] hover:text-white transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                                  title="Save"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-2.5 bg-[#F3F4F6] text-[#374151] rounded-lg hover:bg-[#E5E7EB] transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingId(p._id); setEditValue(p.pincode); }}
                                  disabled={editingId !== null}
                                  className="p-2.5 bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 text-[#7C3AED] rounded-lg hover:from-[#7C3AED] hover:to-[#4F46E5] hover:text-white transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Edit"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(p._id)}
                                  disabled={editingId !== null}
                                  className="p-2.5 bg-[#FEE2E2] text-[#991B1B] rounded-lg hover:bg-[#EF4444] hover:text-white transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {cityId && filteredData.length > 0 && (
            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-gradient-to-r from-[#F9FAFB] to-white flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="text-sm text-[#6B7280]">
                Page <span className="font-semibold text-[#111827]">{page}</span> of <span className="font-semibold text-[#111827]">{pages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2.5 border border-[#D1D5DB] rounded-lg hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#6B7280] transition-all duration-200"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  disabled={page === pages}
                  onClick={() => setPage(page + 1)}
                  className="p-2.5 border border-[#D1D5DB] rounded-lg hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#6B7280] transition-all duration-200"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PincodeTable;