import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, Menu, ChevronDown, User, Settings, LogOut,
  Shield, ShieldCheck, ShieldAlert, Crown, UserCog
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Role metadata ──────────────────────────────────────────────────────────
const ROLE_META = {
  super_admin: {
    label: 'Super Admin',
    gradient: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    icon: Crown,
  },
  admin: {
    label: 'Admin',
    gradient: 'from-indigo-500 to-blue-600',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: ShieldCheck,
  },
  manager: {
    label: 'Manager',
    gradient: 'from-teal-500 to-cyan-600',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    icon: UserCog,
  },
  staff: {
    label: 'Staff',
    gradient: 'from-slate-500 to-slate-600',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    icon: User,
  },
  customer: {
    label: 'Customer',
    gradient: 'from-slate-400 to-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: User,
  },
};

const AdminHeader = ({ sidebarOpen, onMenuToggle }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const meta = ROLE_META[user?.role] || ROLE_META.staff;
  const RoleIcon = meta.icon;
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Signed out successfully.');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed. Please try again.');
    } finally {
      setLoggingOut(false);
      setIsProfileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">

        {/* LEFT: Mobile Menu Toggle */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors duration-200"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* CENTER: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all duration-200"
              placeholder="Quick search (Ctrl+K)…"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5">⌘K</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          {/* Notifications */}
          <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 active:scale-95">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              id="profile-menu-btn"
              onClick={() => setIsProfileOpen(v => !v)}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-50 transition-colors duration-200 border border-transparent hover:border-slate-200"
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${meta.gradient} flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm`}>
                {initials}
              </div>

              <div className="hidden md:flex flex-col items-start">
                <span className="text-xs font-bold text-slate-700 leading-none">
                  {user?.name || 'Admin User'}
                </span>
                <span className={`text-[10px] font-semibold leading-none mt-1 px-1.5 py-0.5 rounded-full border ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>

              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 py-2 z-40 origin-top-right animate-slide-down">

                  {/* User info */}
                  <div className="px-4 py-3.5 border-b border-slate-50 mb-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full border ${meta.badge}`}>
                          <RoleIcon className="w-2.5 h-2.5" />
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors">
                    <User className="w-4 h-4 text-slate-400" /> Profile
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                  </button>

                  <div className="my-1.5 border-t border-slate-50" />

                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors rounded-b-xl disabled:opacity-60"
                  >
                    <LogOut className="w-4 h-4" />
                    {loggingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;