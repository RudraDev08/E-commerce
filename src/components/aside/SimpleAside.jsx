
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
  Palette,
  ArrowRightLeft,
  ClipboardCheck
} from "lucide-react";

// Configuration for sidebar menu items
const MENU_ITEMS = [
  { type: 'header', label: 'Main' },
  { type: 'item', label: 'Dashboard', icon: LayoutGrid, path: '/' },

  { type: 'header', label: 'Infrastructure' },
  { type: 'item', label: 'Country', icon: Globe, path: '/country' },
  { type: 'item', label: 'State', icon: MapPin, path: '/state' },
  { type: 'item', label: 'City', icon: Building, path: '/city' },
  { type: 'item', label: 'Pincode', icon: Hash, path: '/pincode' },

  { type: 'header', label: 'Catalogue' },
  { type: 'item', label: 'Categories', icon: Layers, path: '/categories' },
  { type: 'item', label: 'Brands', icon: Tag, path: '/brands' },

  { type: 'header', label: 'Products' },
  { type: 'item', label: 'Products', icon: Package, path: '/products' },
  { type: 'item', label: 'Size Management', icon: Ruler, path: '/size-management' },
  { type: 'item', label: 'Color Management', icon: Palette, path: '/color-management' },
  { type: 'item', label: 'Variant Mapping', icon: Layers, path: '/variant-mapping' },

  { type: 'header', label: 'Inventory' },
  { type: 'item', label: 'Inventory', icon: Map, path: '/inventory' },
  { type: 'item', label: 'Warehouses', icon: Building, path: '/inventory/warehouses' },
  { type: 'item', label: 'Stock Transfers', icon: ArrowRightLeft, path: '/inventory/transfers' },
  { type: 'item', label: 'Inventory Audits', icon: ClipboardCheck, path: '/inventory/audits' },
];

const ProfessionalAside = ({ isExpanded, setIsExpanded }) => {
  const navigate = useNavigate();

  // Close sidebar on mobile after navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const sidebarX = isMobile && !isExpanded ? -72 : 0;

  return (
    <>
      {/* Mobile overlay backdrop */}
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
          x: sidebarX
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="h-screen bg-white border-r border-slate-200 flex flex-col fixed lg:sticky top-0 z-50 shadow-sm"
      >
        {/* Brand Section */}
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

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1 custom-scrollbar">
          {MENU_ITEMS.map((item, index) => (
            item.type === 'header' ? (
              <Section
                key={`header-${index}`}
                label={item.label}
                isExpanded={isExpanded}
              />
            ) : (
              <Item
                key={`item-${item.path}`}
                icon={item.icon}
                label={item.label}
                to={item.path}
                isExpanded={isExpanded}
                onNavigate={handleNavigation}
              />
            )
          ))}
        </div>

        {/* Collapse Button */}
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
      {/* Active Indicator Background */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 bg-indigo-50 rounded-lg"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      {/* Icon */}
      <div className="relative z-10 flex items-center justify-center min-w-[20px]">
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-200 group-hover:scale-110" />
      </div>

      {/* Label */}
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

      {/* Active Dot */}
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