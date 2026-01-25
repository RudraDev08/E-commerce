import { Search, Download, Filter, Bell, User, ChevronDown, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

// RESPONSIVE UI ENHANCEMENT: Premium enterprise header with mobile support
const AdminHeader = ({ sidebarOpen, onMenuToggle }) => {
  const location = useLocation();
  const pageTitle = location.pathname === "/" ? "Dashboard" : location.pathname.split("/")[1];

  return (
    <header className="h-14 border-b border-slate-200/70 bg-white sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
      {/* RESPONSIVE UI ENHANCEMENT: Mobile menu + page title */}
      <div className="flex items-center gap-3">
        {/* RESPONSIVE UI ENHANCEMENT: Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all active:scale-95"
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        {/* UI ENHANCEMENT: Clean page title with professional hierarchy */}
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 capitalize tracking-tight">
            {pageTitle}
          </h2>
          <p className="hidden sm:block text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">
            System Overview
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* RESPONSIVE UI ENHANCEMENT: Search - hidden on mobile, visible on desktop */}
        <div className="hidden xl:flex relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search resources..."
            className="h-9 w-48 xl:w-56 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 text-xs font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all hover:border-slate-300"
          />
        </div>

        {/* RESPONSIVE UI ENHANCEMENT: Search icon button for tablet */}
        <button className="xl:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all active:scale-95">
          <Search size={18} strokeWidth={2} />
        </button>

        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        {/* RESPONSIVE UI ENHANCEMENT: Action buttons - adaptive sizing */}
        <div className="hidden md:flex gap-2">
          <button className="h-9 px-3 sm:px-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-all border border-slate-200 hover:border-slate-300 active:scale-95">
            <Download size={15} strokeWidth={2} />
            <span className="hidden lg:inline">Export</span>
          </button>
          <button className="h-9 px-3 sm:px-3.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <Filter size={15} strokeWidth={2} />
            <span className="hidden lg:inline">Filters</span>
          </button>
        </div>

        {/* RESPONSIVE UI ENHANCEMENT: Mobile action menu button */}
        <button className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all active:scale-95">
          <Filter size={18} strokeWidth={2} />
        </button>

        {/* RESPONSIVE UI ENHANCEMENT: User profile - touch-friendly */}
        <div className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-slate-200">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-sm">JD</div>
          <ChevronDown size={14} strokeWidth={2} className="hidden sm:block text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;