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
  User,
  ChevronDown,
  ChevronUp,
  Folder,
  Layers,
  Tag,
  Navigation,
} from "lucide-react";

const ProfessionalAside = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selected, setSelected] = useState("Dashboard");
  const [expandedSections, setExpandedSections] = useState({
    geographic: true,
    category: true,
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const mapping = {
      "/": "Dashboard",
      "/country": "Country",
      "/state": "State",
      "/city": "City",
      "/pincode": "Pincode",
      "/categories": "Categories",
      "/subcategories": "Subcategories",
      "/tags": "Tags",
    };
    setSelected(mapping[path] || "Dashboard");
  }, [location]);

  const menuGroups = {
    main: [{ name: "Dashboard", icon: Home, path: "/" }],
    geographic: [
      { name: "Country", icon: Globe, path: "/country" },
      { name: "State", icon: MapPin, path: "/state" },
      { name: "City", icon: Building, path: "/city" },
      { name: "Pincode", icon: Hash, path: "/pincode" },
    ],
    categories: [
      { name: "Categories", icon: Folder, path: "/categories" },
      { name: "Subcategories", icon: Layers, path: "/subcategories" },
      { name: "Tags", icon: Tag, path: "/tags" },
    ],
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNavigation = (item) => {
    setSelected(item.name);
    navigate(item.path);
  };

  const renderMenuItem = (item) => {
    const isActive = selected === item.name;
    const Icon = item.icon;

    return (
      <li key={item.name} className="relative px-3">
        <button
          onClick={() => handleNavigation(item)}
          className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group ${
            isActive ? "bg-indigo-50/50 text-indigo-600" : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-900"
          } ${!isExpanded ? "justify-center" : ""}`}
        >
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 w-0.5 h-4 bg-indigo-500 rounded-full"
            />
          )}
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
          {isExpanded && (
            <span className="text-[13px] font-medium tracking-tight">
              {item.name}
            </span>
          )}
          {!isExpanded && (
            <div className="fixed left-20 px-2 py-1 bg-slate-900 text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 backdrop-blur-md bg-opacity-90">
              {item.name}
            </div>
          )}
        </button>
      </li>
    );
  };

  return (
    <motion.aside
      animate={{ width: isExpanded ? 260 : 80 }}
      className="h-screen bg-white/75 backdrop-blur-md border-r border-white/20 flex flex-col shadow-[10px_0_40px_-15px_rgba(0,0,0,0.05)] relative z-50"
    >
      {/* Header: Lightweight & Spatial */}
      <div className="h-16 flex items-center px-6 gap-3 mb-4">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Navigation size={18} />
        </div>
        {isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <h1 className="text-[14px] font-semibold text-slate-900 leading-none">GeoManager</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Admin Console</p>
          </motion.div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Main Section */}
        <ul>{menuGroups.main.map(renderMenuItem)}</ul>

        {/* Geographic Section */}
        <div className="space-y-1">
          {isExpanded && (
            <button 
                onClick={() => toggleSection('geographic')}
                className="w-full flex items-center justify-between px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <span>Geographic</span>
              {expandedSections.geographic ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <AnimatePresence>
            {expandedSections.geographic && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
                {menuGroups.geographic.map(renderMenuItem)}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Categories Section */}
        <div className="space-y-1">
          {isExpanded && (
            <button 
                onClick={() => toggleSection('category')}
                className="w-full flex items-center justify-between px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <span>Classification</span>
              {expandedSections.category ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <AnimatePresence>
            {expandedSections.category && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
                {menuGroups.categories.map(renderMenuItem)}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer: Floating Profile & Toggle */}
      <div className="p-4 mt-auto space-y-4">
        <div className={`flex items-center p-2 rounded-xl bg-slate-900/[0.03] border border-white/50 ${isExpanded ? "gap-3" : "justify-center"}`}>
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-white flex items-center justify-center text-slate-600 font-bold text-[10px]">AD</div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-800 truncate">Administrator</p>
              <p className="text-[10px] text-slate-500 truncate">v1.2.4 • Online</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </motion.aside>
  );
};

export default ProfessionalAside;