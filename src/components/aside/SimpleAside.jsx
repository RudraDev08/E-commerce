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
  ClipboardCheck,
  Settings
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
  { type: 'item', label: 'Attribute Manager', icon: Settings, path: '/attributes' },
  { type: 'item', label: 'Variant Mapping', icon: Layers, path: '/variant-mapping' },

  { type: 'header', label: 'Inventory' },
  { type: 'item', label: 'Inventory', icon: Map, path: '/inventory' },
  { type: 'item', label: 'Warehouses', icon: Building, path: '/inventory/warehouses' },
  { type: 'item', label: 'Stock Transfers', icon: ArrowRightLeft, path: '/inventory/transfers' },
  { type: 'item', label: 'Inventory Audits', icon: ClipboardCheck, path: '/inventory/audits' },
];

const ProfessionalAside = ({ isExpanded, setIsExpanded }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Close sidebar on mobile after navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  // Logic to determine best matching active item (Longest Prefix Match)
  // This prevents "/inventory" from being active when "/inventory/warehouses" is selected
  const activeItem = MENU_ITEMS
    .filter(item => item.type === 'item')
    .filter(item => pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0];

  const activePath = activeItem ? activeItem.path : '';

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const sidebarX = isMobile && !isExpanded ? -280 : 0;

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isExpanded && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
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
        transition={{ duration: 0.3, type: "spring", stiffness: 100, damping: 20 }}
        className="h-screen bg-white border-r border-slate-200 flex flex-col fixed lg:sticky top-0 z-50 shadow-2xl lg:shadow-xl overflow-hidden"
      >
        {/* Brand Section */}
        <div className="h-16 flex items-center shrink-0 px-4 border-b border-slate-100 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 w-full"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#3730A3] rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <Navigation size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold text-[#0F172A] leading-tight">Nexus ERP</h1>
                  <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">Premium</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-center"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#3730A3] rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <Navigation size={18} strokeWidth={2.5} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 custom-scrollbar">
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
                isActive={item.path === activePath}
                onNavigate={handleNavigation}
              />
            )
          ))}
        </div>

        {/* Collapse Button */}
        <div className="p-3 border-t border-slate-100 bg-white z-10 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-10 flex items-center justify-center gap-3 rounded-xl bg-slate-50 hover:bg-[#F1F5F9] text-slate-500 hover:text-[#0F172A] transition-all duration-300 group active:scale-[0.98]"
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <div className="flex items-center gap-2">
                <ChevronLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
                <span className="text-xs font-bold tracking-wide">Collapse</span>
              </div>
            ) : (
              <ChevronRight size={18} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform duration-300" />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

/* ---------------- ATOMS ---------------- */

const Item = ({ icon: Icon, label, to, isExpanded, isActive, onNavigate }) => {
  return (
    <div className="relative group/item">
      {/* Active Indicator Bar - Left */}
      {isActive && (
        <motion.div
          layoutId="activeBar"
          className="absolute left-0 top-1 bottom-1 w-1 bg-[#4F46E5] rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)] z-20"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <button
        type="button"
        onClick={() => onNavigate(to)}
        title={!isExpanded ? label : ""}
        className={`
          relative w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out
          ${isActive
            ? "bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] text-[#3730A3]"
            : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
          }
          group-hover/item:shadow-sm
        `}
      >
        {/* Icon */}
        <div className={`
            relative z-10 flex items-center justify-center transition-all duration-300
            ${isActive ? 'text-[#4F46E5] drop-shadow-sm scale-110' : 'group-hover/item:scale-110 group-hover/item:text-[#4F46E5]'}
        `}>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>

        {/* Label */}
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className={`
                relative z-10 truncate font-semibold transition-colors duration-300
                ${isActive ? 'text-[#3730A3]' : 'text-[#64748B] group-hover/item:text-[#0F172A]'}
              `}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Hover Glow Effect */}
        {!isActive && (
          <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]" />
        )}

      </button>
    </div>
  );
};

const Section = ({ label, isExpanded }) => (
  <div className={`px-4 pt-5 pb-2 transition-all duration-300 ${!isExpanded ? 'flex justify-center' : ''}`}>
    {isExpanded ? (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider"
      >
        {label}
      </motion.p>
    ) : (
      <div className="w-4 h-0.5 bg-slate-200 rounded-full" title={label} />
    )}
  </div>
);

export default ProfessionalAside;