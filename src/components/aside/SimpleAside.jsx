import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Globe,
  MapPin,
  Building,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Folder,
  Navigation,
  Circle
} from "lucide-react";
import { getCategoryTree } from "../../Api/Category/CategoryApi";

const ProfessionalAside = ({ isExpanded, setIsExpanded }) => {
  const [categoryTree, setCategoryTree] = useState([]);
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getCategoryTree()
      .then(res => setCategoryTree(res.data || []))
      .catch(err => console.error(err));
  }, []);

  const menuGroups = {
    main: [{ name: "Dashboard", icon: Home, path: "/" }],
    geographic: [
      { name: "Country", icon: Globe, path: "/country" },
      { name: "State", icon: MapPin, path: "/state" },
      { name: "City", icon: Building, path: "/city" },
      { name: "Pincode", icon: Hash, path: "/pincode" }
    ]
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 280 : 80 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    >
      {/* BRAND SECTION */}
      <div className="h-20 flex items-center px-5 gap-3 mb-2">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200/50 flex-shrink-0">
            <Navigation size={20} fill="currentColor" />
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col whitespace-nowrap overflow-hidden"
            >
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Nexus Admin</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise v2.0</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SCROLLABLE MENU */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar scroll-smooth">
        
        {/* DASHBOARD GROUP */}
        <div className="space-y-1">
          {menuGroups.main.map(item => (
            <MenuItem
              key={item.name}
              item={item}
              isExpanded={isExpanded}
              isActive={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>

        {/* INFRASTRUCTURE SECTION */}
        <div className="space-y-1">
          <SectionHeader label="Infrastructure" isExpanded={isExpanded} />
          <div className="bg-slate-50/50 rounded-2xl p-1.5 space-y-1">
            {menuGroups.geographic.map(item => (
              <MenuItem
                key={item.name}
                item={item}
                isExpanded={isExpanded}
                isActive={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>

        {/* CATEGORIES SECTION */}
        <div className="space-y-1 pb-4">
          <SectionHeader label="Classification" isExpanded={isExpanded} />
          
          <MenuItem
            item={{ name: "Category Management", icon: Folder, path: "/categories" }}
            isExpanded={isExpanded}
            isActive={location.pathname === "/categories"}
            onClick={() => navigate("/categories")}
          />

          {/* <div className="mt-2 space-y-1">
            {categoryTree.map(cat => (
              <div key={cat._id} className="px-1">
                <button
                  onClick={() => setOpenCategoryId(openCategoryId === cat._id ? null : cat._id)}
                  className={`w-full group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                    openCategoryId === cat._id
                      ? "bg-indigo-50/50 text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 rounded-md transition-colors ${openCategoryId === cat._id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        <Folder size={14} />
                    </div>
                    {isExpanded && <span>{cat.name}</span>}
                  </div>
                  {isExpanded && (
                    <motion.div
                        animate={{ rotate: openCategoryId === cat._id ? 180 : 0 }}
                        className="opacity-50"
                    >
                        <ChevronDown size={14} />
                    </motion.div>
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && openCategoryId === cat._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 mt-1 mb-2 border-l-2 border-slate-100 pl-4 space-y-1">
                        {cat.children?.map(sub => (
                          <button
                            key={sub._id}
                            onClick={() => navigate(`/categories/${sub._id}`)}
                            className={`w-full flex items-center gap-2 text-left py-2 px-2 rounded-lg text-[11px] font-medium transition-all ${
                                location.pathname.includes(sub._id) 
                                ? "text-indigo-600 bg-indigo-50/30" 
                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                          >
                            <Circle size={4} fill="currentColor" className={location.pathname.includes(sub._id) ? "text-indigo-500" : "text-slate-300"} />
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* FOOTER TOGGLE */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-indigo-600 transition-all duration-300 shadow-lg shadow-slate-200 active:scale-95"
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </motion.aside>
  );
};

/* ---------- REFINED SUB COMPONENTS ---------- */

const MenuItem = ({ item, isExpanded, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 overflow-hidden ${
      isActive
        ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)]"
        : "text-slate-500 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 hover:text-slate-900"
    }`}
  >
    {/* Active Indicator Bar */}
    {!isActive && (
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full -translate-x-full group-hover:translate-x-0 transition-transform duration-200" />
    )}

    <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
        isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
    }`}>
      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
    </div>

    <AnimatePresence>
      {isExpanded && (
        <motion.span 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-bold tracking-tight whitespace-nowrap"
        >
          {item.name}
        </motion.span>
      )}
    </AnimatePresence>

    {/* Hover highlight effect */}
    {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
    )}
  </button>
);

const SectionHeader = ({ label, isExpanded }) => (
  <AnimatePresence>
    {isExpanded && (
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 mt-4 flex items-center gap-2"
      >
        <span className="w-1 h-1 bg-indigo-400 rounded-full" />
        {label}
      </motion.p>
    )}
  </AnimatePresence>
);

export default ProfessionalAside;