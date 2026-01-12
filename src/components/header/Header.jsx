import { Search, Download, Filter, Bell, User, ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";

const AdminHeader = () => {
  const location = useLocation();
  const pageTitle = location.pathname === "/" ? "Dashboard" : location.pathname.split("/")[1];

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-bold text-slate-900 capitalize tracking-tight">{pageTitle}</h2>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">System Overview</p>
      </div>

      <div className="flex items-center gap-4">
        {/* COMPACT SEARCH */}
        <div className="hidden lg:flex relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search resources..." className="h-9 w-64 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        {/* ACTIONS */}
        <div className="flex gap-2">
          <button className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-all">
            <Download size={14} /> Export
          </button>
          <button className="h-9 px-4 text-xs font-bold bg-slate-900 text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-slate-200">
            <Filter size={14} /> Filters
          </button>
        </div>

        {/* USER PROFILE */}
        <div className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-50 rounded-full cursor-pointer transition-all border border-transparent hover:border-slate-100">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">JD</div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;