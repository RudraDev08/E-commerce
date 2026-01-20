import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
  Navigation
} from "lucide-react";

const ProfessionalAside = ({ isExpanded, setIsExpanded }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <motion.aside
      animate={{ width: isExpanded ? 260 : 80 }}
      transition={{ duration: 0.25 }}
      className="h-screen bg-white border-r flex flex-col sticky top-0 z-50"
    >
      {/* BRAND */}
      <div className="h-20 px-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
          <Navigation size={18} />
        </div>
        {isExpanded && (
          <div>
            <h1 className="text-sm font-bold text-slate-900">Nexus ERP</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase">
              v2.0 Admin
            </p>
          </div>
        )}
      </div>

      {/* NAV */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-10">
        <Section label="Core" isExpanded={isExpanded} />
        <Item icon={LayoutGrid} label="Dashboard" to="/" />

        <Section label="Infrastructure" isExpanded={isExpanded} />
        <Item icon={Globe} label="Country" to="/country" />
        <Item icon={MapPin} label="State" to="/state" />
        <Item icon={Building} label="City" to="/city" />
        <Item icon={Hash} label="Pincode" to="/pincode" />

        <Section label="Catalogue" isExpanded={isExpanded} />
        <Item icon={Layers} label="Categories" to="/categories" />
        <Item icon={Tag} label="Brands" to="/brands" />

        <Section label="Products" isExpanded={isExpanded} />
        <Item icon={Package} label="Products" to="/products" />
        <Item icon={Map} label="Inventory" to="/inventory" />
      </div>

      {/* TOGGLE */}
      <div className="p-4 border-t bg-slate-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-10 bg-slate-900 text-white rounded-xl flex justify-center items-center"
        >
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>
    </motion.aside>
  );
};

/* ---------------- ATOMS ---------------- */

const Item = ({ icon: Icon, label, to }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition
        ${
          active
            ? "bg-slate-900 text-white"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
};

const Section = ({ label, isExpanded }) =>
  isExpanded ? (
    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      {label}
    </p>
  ) : (
    <div className="h-px bg-slate-200 my-4" />
  );

export default ProfessionalAside;
