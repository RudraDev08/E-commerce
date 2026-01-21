import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Globe,
  MapPin,
  Building,
  Hash,
  Layers,
  Tag,
  Package,
  Map,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Settings,
} from "lucide-react";

const ProfessionalAside = ({ isExpanded, setIsExpanded }) => {
  const navigate = useNavigate();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 280 : 88 }}
      className="h-screen bg-slate-50 border-r border-slate-200 flex flex-col sticky top-0 z-50 transition-colors"
    >
      {/* BRAND SECTION */}
      <div className="h-20 flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="min-w-[40px] h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Navigation size={20} strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-sm font-bold text-slate-900 leading-none">Nexus ERP</h1>
                <span className="text-[10px] text-indigo-600 font-bold tracking-tighter uppercase">v2.0 Premium</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* NAVIGATION CONTENT */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-1 custom-scrollbar">
        <Section label="Main" isExpanded={isExpanded} />
        <Item icon={LayoutGrid} label="Dashboard" to="/" isExpanded={isExpanded} />

        <Section label="Infrastructure" isExpanded={isExpanded} />
        <Item icon={Globe} label="Country" to="/country" isExpanded={isExpanded} />
        <Item icon={MapPin} label="State" to="/state" isExpanded={isExpanded} />
        <Item icon={Building} label="City" to="/city" isExpanded={isExpanded} />
        <Item icon={Hash} label="Pincode" to="/pincode" isExpanded={isExpanded} />

        <Section label="Catalogue" isExpanded={isExpanded} />
        <Item icon={Layers} label="Categories" to="/categories" isExpanded={isExpanded} />
        <Item icon={Tag} label="Brands" to="/brands" isExpanded={isExpanded} />

        <Section label="Products" isExpanded={isExpanded} />
        <Item icon={Package} label="Products" to="/products" isExpanded={isExpanded} />
        <Item icon={Map} label="Inventory" to="/inventory" isExpanded={isExpanded} />
      </div>

      {/* FOOTER & TOGGLE */}
      <div className="p-4 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-11 flex items-center justify-center gap-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
        >
          {isExpanded ? (
            <>
              <ChevronLeft size={18} />
              <span className="text-xs font-semibold">Collapse Menu</span>
            </>
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      </div>
    </motion.aside>
  );
};

/* ---------------- ATOMS ---------------- */

const Item = ({ icon: Icon, label, to, isExpanded }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      title={!isExpanded ? label : ""}
      className={`
        relative w-full group flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-all duration-200
        ${isActive 
          ? "text-indigo-600" 
          : "text-slate-500 hover:text-slate-900 hover:bg-white"
        }
      `}
    >
      {/* Active Indicator Background */}
      {isActive && (
        <motion.div
          layoutId="activePill"
          className="absolute inset-0 bg-white shadow-sm border border-slate-100 rounded-xl z-0"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      <div className={`relative z-10 flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      </div>

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="relative z-10 truncate font-semibold"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Active Dot */}
      {isActive && (
        <motion.div 
          layoutId="activeDot"
          className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-600 z-10" 
        />
      )}
    </button>
  );
};

const Section = ({ label, isExpanded }) => (
  <div className="py-2">
    {isExpanded ? (
      <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
        {label}
      </p>
    ) : (
      <div className="mx-auto w-8 h-px bg-slate-200" />
    )}
  </div>
);

export default ProfessionalAside;