import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Globe,
  MapPin,
  Building,
  Hash,
  Layers,
  Ruler,
  Tag,
  Package,
  Map,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Settings,
  Palette
} from "lucide-react";

const ProfessionalAside = ({ isExpanded, setIsExpanded }) => {
  const navigate = useNavigate();

  // RESPONSIVE UI ENHANCEMENT: Close sidebar on mobile after navigation
  const handleNavigation = (path) => {
    navigate(path);
    // BUG FIX: Safety check for window object
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  // PREMIUM UI ENHANCEMENT: Clean enterprise sidebar with perfect collapsed state
  return (
    <>
      {/* RESPONSIVE UI ENHANCEMENT: Mobile overlay backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 260 : 72,
          x: typeof window !== 'undefined' && window.innerWidth < 1024 && !isExpanded ? -72 : 0
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="h-screen bg-white border-r border-slate-200 flex flex-col fixed lg:sticky top-0 z-50 shadow-sm"
      >
        {/* PREMIUM UI ENHANCEMENT: Clean brand section */}
        <div className="h-16 flex items-center justify-center px-4 border-b border-slate-100">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-sm">
                  <Navigation size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900">Nexus ERP</h1>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide">Premium</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-sm"
              >
                <Navigation size={20} strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PREMIUM UI ENHANCEMENT: Clean navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1 custom-scrollbar">
          <div className="pt-2 pb-1 px-3">
            {isExpanded ? (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Main
              </p>
            ) : (
              <div className="w-full h-px bg-slate-200" />
            )}
          </div>
          <Item icon={LayoutGrid} label="Dashboard" to="/" isExpanded={isExpanded} onNavigate={handleNavigation} />

          <Section label="Infrastructure" isExpanded={isExpanded} />
          <Item icon={Globe} label="Country" to="/country" isExpanded={isExpanded} onNavigate={handleNavigation} />
          <Item icon={MapPin} label="State" to="/state" isExpanded={isExpanded} onNavigate={handleNavigation} />
          <Item icon={Building} label="City" to="/city" isExpanded={isExpanded} onNavigate={handleNavigation} />
          <Item icon={Hash} label="Pincode" to="/pincode" isExpanded={isExpanded} onNavigate={handleNavigation} />

          <Section label="Catalogue" isExpanded={isExpanded} />
          <Item icon={Layers} label="Categories" to="/categories" isExpanded={isExpanded} onNavigate={handleNavigation} />
          <Item icon={Tag} label="Brands" to="/brands" isExpanded={isExpanded} onNavigate={handleNavigation} />

          <Section label="Products" isExpanded={isExpanded} />
          <Item icon={Package} label="Products" to="/products" isExpanded={isExpanded} onNavigate={handleNavigation} />
          <Item icon={Ruler} label="Size Management" to="/size-management" isExpanded={isExpanded} onNavigate={handleNavigation} />
          <Item icon={Palette} label="Color Management" to="/color-management" isExpanded={isExpanded} onNavigate={handleNavigation} />
          <Item icon={Layers} label="Variant Mapping" to="/variant-mapping" isExpanded={isExpanded} onNavigate={handleNavigation} />

          <Section label="Inventory" isExpanded={isExpanded} />
          <Item icon={Map} label="Inventory" to="/inventory" isExpanded={isExpanded} onNavigate={handleNavigation} />
        </div>

        {/* PREMIUM UI ENHANCEMENT: Clean collapse button */}
        <div className="p-2 border-t border-slate-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all duration-200 active:scale-95"
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <>
                <ChevronLeft size={16} strokeWidth={2.5} />
                <span className="text-xs font-semibold">Collapse</span>
              </>
            ) : (
              <ChevronRight size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

/* ---------------- ATOMS ---------------- */

const Item = ({ icon: Icon, label, to, isExpanded, onNavigate }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  // PREMIUM UI ENHANCEMENT: Clean item with perfect active state
  return (
    <button
      type="button"
      onClick={() => onNavigate(to)}
      title={!isExpanded ? label : ""}
      className={`
        relative w-full group flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive
          ? "text-indigo-600 bg-indigo-50"
          : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
        }
      `}
    >
      {/* PREMIUM UI ENHANCEMENT: Clean active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 bg-indigo-50 rounded-lg"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      {/* PREMIUM UI ENHANCEMENT: Icon */}
      <div className="relative z-10 flex items-center justify-center min-w-[20px]">
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-200 group-hover:scale-110" />
      </div>

      {/* PREMIUM UI ENHANCEMENT: Label */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 truncate font-semibold"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* PREMIUM UI ENHANCEMENT: Active dot */}
      {isActive && isExpanded && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-600"
        />
      )}
    </button>
  );
};

const Section = ({ label, isExpanded }) => (
  // PREMIUM UI ENHANCEMENT: Clean section headers
  <div className="pt-3 pb-1 px-3">
    {isExpanded ? (
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
    ) : (
      <div className="w-full h-px bg-slate-200" />
    )}
  </div>
);

export default ProfessionalAside;