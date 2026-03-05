/**
 * LoginPage.jsx — Ultra Premium Admin Login UI (Light Theme)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Eye, EyeOff, Mail, Lock, Shield, AlertCircle, Loader2,
    ChevronRight, Sparkles
} from 'lucide-react';

const ROLE_COLORS = {
    super_admin: 'from-violet-500 to-purple-500',
    admin: 'from-blue-500 to-indigo-500',
    manager: 'from-sky-400 to-cyan-500',
    staff: 'from-slate-400 to-slate-500',
};

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    manager: 'Manager',
    staff: 'Staff',
};

export default function LoginPage() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loggedUser, setLoggedUser] = useState(null);

    // Already logged in → redirect
    useEffect(() => {
        if (isAuthenticated) navigate(from, { replace: true });
    }, [isAuthenticated, from, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const user = await login(email.trim(), password);
            setLoggedUser(user);
            // Brief success state then redirect
            setTimeout(() => navigate(from, { replace: true }), 800);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans bg-[#F8FAFC]">

            {/* ── Premium Animated Mesh Background ── */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Abstract colorful blobs */}
                <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-sky-200/40 to-blue-200/40 blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                <div className="absolute top-[20%] right-[15%] w-[40%] h-[40%] rounded-full bg-gradient-to-bl from-pink-100/40 to-rose-100/40 blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />

                {/* Very subtle noise/texture overlay */}
                <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
            </div>

            {/* ── Login Card ── */}
            <div className="relative z-10 w-full max-w-[440px] px-5">

                {/* The Glass Container */}
                <div className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] p-8 sm:p-12 relative overflow-hidden group/card">

                    {/* Top highlight line for 3D effect */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

                    {/* ── Header ── */}
                    <div className="text-center mb-10 relative">
                        {/* Logo Box with gentle floating animation */}
                        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/30 mb-6 relative group transition-transform duration-500 hover:scale-105 hover:-translate-y-1">
                            {/* Inner soft glow */}
                            <div className="absolute inset-0 bg-white/20 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Shield className="w-9 h-9 text-white relative z-10 drop-shadow-md" strokeWidth={1.5} />

                            {/* Sparkle decorative element */}
                            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 drop-shadow-sm pointer-events-none" />
                        </div>

                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-slate-500 text-sm font-medium">Please sign in to your admin dashboard.</p>
                    </div>

                    {/* Success state */}
                    {loggedUser && (
                        <div className="mb-8 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-100/50 p-4 flex items-center gap-3 animate-fade-in shadow-sm">
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${ROLE_COLORS[loggedUser.role] || 'from-indigo-500 to-purple-500'} flex items-center justify-center text-white text-base font-bold shadow-md ring-4 ring-white`}>
                                {loggedUser.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-emerald-800 text-sm font-bold">Authenticated!</p>
                                <p className="text-emerald-600 text-xs mt-0.5 font-medium">{ROLE_LABELS[loggedUser.role]} · Taking you there…</p>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="mb-8 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-100/50 p-4 flex items-start gap-3 animate-fade-in shadow-sm">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-red-700 text-sm font-semibold leading-relaxed">{error}</p>
                        </div>
                    )}

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300 pointer-events-none" />
                                <input
                                    id="admin-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 outline-none focus:bg-white focus:ring-[3px] focus:ring-indigo-500/15 focus:border-indigo-500 transition-all duration-300 hover:bg-white/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    Password
                                </label>
                                <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300 pointer-events-none" />
                                <input
                                    id="admin-password"
                                    type={showPwd ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3.5 bg-white/50 border border-slate-200/60 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 outline-none focus:bg-white focus:ring-[3px] focus:ring-indigo-500/15 focus:border-indigo-500 transition-all duration-300 hover:bg-white/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:text-indigo-500 transition-colors bg-transparent border-none outline-none"
                                    tabIndex={-1}
                                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                                >
                                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            id="admin-login-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_12px_25px_-8px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group/btn mt-4"
                        >
                            {/* Inner animated gradient hover effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient" />

                            <div className="relative z-10 flex items-center gap-2">
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                                ) : (
                                    <>Sign In <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-300" /></>
                                )}
                            </div>
                        </button>

                    </form>

                    {/* ── Footer ── */}
                    <div className="mt-10 pt-6 border-t border-slate-100">
                        <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
                            System Access Levels
                        </p>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            {['Super Admin', 'Admin', 'Manager', 'Staff'].map((role) => (
                                <div
                                    key={role}
                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 shadow-sm"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                    {role}
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-[10px] font-medium text-slate-400 mt-6 flex justify-center items-center gap-1.5">
                            <Lock className="w-3 h-3" /> Secured by JWT & RBAC
                        </p>
                    </div>
                </div>
            </div>

            {/* Global Keyframes for Animations */}
            <style>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </div>
    );
}
