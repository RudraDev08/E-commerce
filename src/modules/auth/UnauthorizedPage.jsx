/**
 * UnauthorizedPage.jsx — 403 Access Denied UI
 */

import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">

            {/* BG */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-600 rounded-full opacity-[0.04] blur-[140px]" />
            </div>

            <div className="relative text-center max-w-md mx-4">

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/20 mb-8 mx-auto">
                    <ShieldX className="w-12 h-12 text-red-400" />
                </div>

                {/* Code */}
                <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-600 to-slate-800 mb-4 select-none">
                    403
                </p>

                <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>

                <p className="text-slate-400 text-sm leading-relaxed mb-2">
                    Your account (<span className="text-slate-300 font-medium">{user?.role || 'unknown'}</span>) does not have
                    permission to view this page.
                </p>
                <p className="text-slate-600 text-xs mb-10">
                    Contact your system administrator if you believe this is a mistake.
                </p>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                        id="go-back-btn"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 border border-white/[0.06] text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition-all duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                    <button
                        id="go-home-btn"
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-lg shadow-indigo-500/20"
                    >
                        <Home className="w-4 h-4" /> Dashboard
                    </button>
                </div>

                {/* Role badge */}
                {user && (
                    <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-white/[0.05] text-xs text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Logged in as <span className="text-slate-300 font-medium">{user.name}</span>
                        &nbsp;·&nbsp;{user.role}
                    </div>
                )}
            </div>
        </div>
    );
}
