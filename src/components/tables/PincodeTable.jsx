import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Check,
  X,
  Plus,
  Globe,
  Map,
  Building2,
  Hash,
  Download,
  Layers,
} from "lucide-react";

// API imports remain unchanged
import { getPincodes, deletePincode, updatePincode, addPincode } from "../../api/PincodeApi";
import { getCountries, getStates, getCities } from "../../api/locationApi";

const PincodeTable = () => {
  /* ================= STATE & LOGIC (UNCHANGED) ================= */
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPincodes(page, search);
      setData(res.data.data || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, search]);
  useEffect(() => { getCountries().then(res => setCountries(res.data || [])); }, []);
  useEffect(() => { if (countryId) getStates(countryId).then(res => setStates(res.data || [])); }, [countryId]);
  useEffect(() => { if (stateId) getCities(stateId).then(res => setCities(res.data || [])); }, [stateId]);

  const handleDelete = async (id) => {
    if (window.confirm("Remove this entry?")) {
      try { await deletePincode(id); fetchData(); } catch (err) { toast.error("Restriction active"); }
    }
  };

  const saveEdit = async (id) => {
    try { await updatePincode(id, { pincode: editValue }); setEditingId(null); fetchData(); } 
    catch (err) { toast.error("Failed"); }
  };

  const handleAdd = async () => {
    try { await addPincode({ pincode, cityId }); setPincode(""); fetchData(); } 
    catch (err) { toast.error("Submission failed"); }
  };

  return (
    <div className="min-h-screen bg-[#e2e8f0] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-200 via-slate-300 to-indigo-100 text-slate-900 font-sans antialiased p-6 flex flex-col gap-6">
      
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar toastClassName="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl" />

      {/* FLOATING TOP BAR */}
      <nav className="w-full max-w-7xl mx-auto h-14 bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl flex items-center justify-between px-6 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Layers size={18} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-800">Spatial Console</span>
          <span className="text-slate-300 text-xs">/</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Global Pincode Registry</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <button className="px-3 py-1.5 hover:bg-slate-900/5 rounded-lg transition-colors flex items-center gap-2">
            <Download size={14} /> Export
          </button>
        </div>
      </nav>

      {/* MAIN SPATIAL GRID */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CONTROL PANEL */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 shadow-xl shadow-slate-900/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                className="w-full h-10 pl-10 pr-4 bg-slate-900/5 border border-transparent rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-500/20 transition-all"
                placeholder="Search by code or region..."
                value={search}
                onChange={e => {setSearch(e.target.value); setPage(1);}}
              />
            </div>
          </section>

          <section className="bg-white/75 backdrop-blur-xl border border-white/50 rounded-[24px] p-6 shadow-xl shadow-slate-900/5 flex flex-col gap-5">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Add New Location</h2>
            
            <div className="space-y-4">
              {[
                { label: "Country", value: countryId, setter: setCountryId, options: countries, icon: Globe, disabled: false },
                { label: "State", value: stateId, setter: setStateId, options: states, icon: Map, disabled: !countryId },
                { label: "City", value: cityId, setter: setCityId, options: cities, icon: Building2, disabled: !stateId }
              ].map((f, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 px-1 uppercase tracking-tight">{f.label}</label>
                  <div className="relative">
                    <f.icon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      className="w-full h-10 pl-9 pr-3 bg-slate-900/5 border border-transparent rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-500/20 transition-all appearance-none"
                      value={f.value}
                      onChange={e => f.setter(e.target.value)}
                      disabled={f.disabled}
                    >
                      <option value="">Select...</option>
                      {f.options.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 px-1 uppercase tracking-tight">Pincode</label>
                <div className="relative">
                  <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="w-full h-10 pl-9 pr-3 bg-slate-900/5 border border-transparent rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-500/20 transition-all"
                    placeholder="000 000"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                  />
                </div>
              </div>

              <button 
                onClick={handleAdd}
                className="w-full h-11 bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-[0.97] mt-2"
              >
                <Plus size={16} /> Register Entry
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: PRIMARY DATA TABLE */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <section className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[24px] shadow-2xl shadow-slate-900/5 overflow-hidden min-h-[600px] relative">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900/[0.02] border-b border-slate-900/[0.05]">
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[20%]">Code</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geography (City / State / Country)</th>
                  <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/[0.03]">
                <AnimatePresence mode="popLayout">
                  {data.map((p) => (
                    <motion.tr 
                      key={p._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-white/40 transition-all"
                    >
                      <td className="px-8 py-5">
                        {editingId === p._id ? (
                          <input 
                            className="h-8 bg-white border border-indigo-200 rounded-lg px-2 w-full outline-none text-xs font-bold"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <span className="font-mono text-sm font-semibold text-slate-700">{p.pincode}</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-semibold text-slate-800">{p.cityId?.name}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-[12px] font-medium text-slate-500">{p.cityId?.stateId?.name}</span>
                          <span className="text-slate-300">/</span>
                          {/* COUNTRY DISPLAYED HERE */}
                          <div className="flex items-center gap-1.5 bg-indigo-50/50 px-2 py-0.5 rounded-full border border-indigo-100">
                            <Globe size={10} className="text-indigo-400" />
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">
                                {p.cityId?.stateId?.countryId?.name || "Global"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                          {editingId === p._id ? (
                            <>
                              <button onClick={() => saveEdit(p._id)} className="p-1.5 text-indigo-600 hover:bg-white rounded-lg shadow-sm transition-all"><Check size={16}/></button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-white rounded-lg shadow-sm transition-all"><X size={16}/></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => {setEditingId(p._id); setEditValue(p.pincode);}} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm transition-all"><Edit3 size={16}/></button>
                              <button onClick={() => handleDelete(p._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg shadow-sm transition-all"><Trash2 size={16}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            
            {loading && (
              <div className="absolute inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center">
                 <div className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
          </section>

          {/* FLOATING PAGINATION */}
          <div className="self-center bg-white/80 backdrop-blur-xl border border-white/40 px-6 py-2 rounded-full shadow-xl shadow-slate-900/5 flex items-center gap-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {page} of {pages}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(page-1)} className="p-1.5 hover:bg-slate-900/5 rounded-full disabled:opacity-20 transition-all">
                <ChevronLeft size={16} />
              </button>
              <button disabled={page === pages} onClick={() => setPage(page + 1)} className="p-1.5 hover:bg-slate-900/5 rounded-full disabled:opacity-20 transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PincodeTable;