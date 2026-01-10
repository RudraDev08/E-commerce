import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Shield,
  Download,
  Filter,
  Sun,
  Moon,
  ExternalLink
} from "lucide-react";

const AdminHeader = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications] = useState([
    { id: 1, title: "New user registered", time: "2m ago", read: false },
    { id: 2, title: "System update completed", time: "1h ago", read: false },
    { id: 3, title: "Security alert detected", time: "5h ago", read: false },
  ]);

  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      "/": "Dashboard",
      "/country": "Country",
      "/state": "State",
      "/city": "City",
      "/pincode": "Pincode",
      "/categories": "Categories",
    };
    return titles[path] || "Admin Console";
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 h-[60px] bg-white/75 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      
      {/* LEFT: SYSTEM TITLE */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-[14px] font-medium text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
          <span className="text-[11px] text-slate-400 font-medium">System Manager</span>
        </div>
      </div>

      {/* CENTER: COMPACT SEARCH */}
      <div className="hidden md:flex relative w-64 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
        <input
          type="text"
          placeholder="Search system..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-4 bg-slate-900/[0.03] border border-white/20 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* RIGHT: SYSTEM CONTROLS */}
      <div className="flex items-center gap-2">
        
        {/* UTILITY ICONS */}
        <div className="flex items-center border-r border-slate-200/50 pr-2 mr-2 gap-1">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="relative notifications-menu">
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recent Alerts</span>
                  </div>
                  <div className="py-1">
                    {notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                        <p className="text-[13px] text-slate-700 leading-tight">{n.title}</p>
                        <span className="text-[11px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex gap-2 mr-4">
            <button className="h-9 px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors">
              <Download size={14} /> Export
            </button>
            <button className="h-9 px-3 text-[13px] font-medium bg-slate-900 text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
              <Filter size={14} /> Filters
            </button>
        </div>

        {/* USER PROFILE */}
        <div className="relative user-menu">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-full transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-slate-200 border border-white/50 flex items-center justify-center overflow-hidden">
               <User size={16} className="text-slate-500" />
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden py-1"
              >
                <div className="px-4 py-3 border-b border-slate-100 mb-1">
                  <p className="text-[13px] font-semibold text-slate-800 leading-none">John Doe</p>
                  <p className="text-[11px] text-slate-400 mt-1">Super Admin</p>
                </div>
                {[
                  { label: "Settings", icon: Settings },
                  { label: "Help Center", icon: HelpCircle },
                  { label: "Log out", icon: LogOut, danger: true },
                ].map((item, i) => (
                  <button key={i} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${item.danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;