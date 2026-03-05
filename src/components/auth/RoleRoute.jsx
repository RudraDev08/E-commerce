/**
 * RoleRoute.jsx
 * Frontend route guard — checks auth + role before rendering children.
 *
 * Usage:
 *   <RoleRoute roles={['admin', 'super_admin']}>
 *     <SensitivePage />
 *   </RoleRoute>
 *
 *   <RoleRoute permission="order.refund">
 *     <RefundButton />
 *   </RoleRoute>
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-r-violet-400/40 animate-spin animation-delay-150" />
            </div>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Verifying session…</p>
        </div>
    </div>
);

/**
 * RoleRoute — the primary guard component
 *
 * @param {string[]}  [roles]        - At least one of these roles must match
 * @param {string}    [permission]   - A single permission string to check
 * @param {string}    [redirect]     - Override redirect target (default: /login)
 */
const RoleRoute = ({ children, roles = [], permission = null, redirect = '/login' }) => {
    const { isAuthenticated, user, hasRole, hasPermission, loading } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingSpinner />;

    // 1. Not logged in → redirect to login
    if (!isAuthenticated) {
        return <Navigate to={redirect} state={{ from: location.pathname }} replace />;
    }

    // 2. Blocked users → 403
    if (user?.isBlocked) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 3. Role check — if roles array provided, user must match at least one
    if (roles.length > 0) {
        const allowed = roles.some(r => hasRole(r));
        if (!allowed) return <Navigate to="/unauthorized" replace />;
    }

    // 4. Permission check — if permission provided
    if (permission && !hasPermission(permission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default RoleRoute;
