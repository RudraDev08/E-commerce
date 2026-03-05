/**
 * AuthContext.jsx
 * Global auth state — wraps the entire app.
 *
 * Provides:
 *   useAuth() hook — { user, token, login, logout, isAuthenticated, hasRole, hasPermission, loading }
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../Api/authApi';

const AuthContext = createContext(null);

// Role hierarchy for hasRole checks
const ROLE_LEVELS = {
    customer: 0,
    staff: 1,
    manager: 2,
    admin: 3,
    super_admin: 4,
};

// Default permissions per role (mirrors backend ROLE_PERMISSIONS)
const ROLE_PERMISSIONS = {
    super_admin: ['*'],   // wildcard — all permissions
    admin: [
        'product.create', 'product.update', 'product.delete', 'product.publish',
        'category.create', 'category.update', 'category.delete',
        'brand.create', 'brand.update', 'brand.delete',
        'inventory.view', 'inventory.adjust', 'inventory.transfer',
        'order.view', 'order.update', 'order.refund', 'order.cancel',
        'user.view', 'analytics.view', 'system.view',
    ],
    manager: [
        'product.create', 'product.update', 'product.publish',
        'category.create', 'category.update',
        'brand.create', 'brand.update',
        'inventory.view', 'inventory.adjust', 'inventory.transfer',
        'order.view', 'order.update', 'analytics.view',
    ],
    staff: [
        'product.update',
        'inventory.view', 'inventory.adjust',
        'order.view', 'order.update',
    ],
    customer: [],
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('adminUser')) || null; }
        catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('adminToken') || null);
    const [loading, setLoading] = useState(true);

    // Verify token is still valid on mount
    useEffect(() => {
        const verify = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const { data } = await authApi.getMe();
                if (data.success) {
                    setUser(data.user);
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                } else {
                    _clear();
                }
            } catch {
                _clear();
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, []); // eslint-disable-line

    const _clear = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    };

    const login = useCallback(async (email, password) => {
        const { data } = await authApi.adminLogin(email, password);
        if (!data.success) throw new Error(data.message);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        try { await authApi.logout(); } catch { /* swallow */ }
        _clear();
    }, []);

    /** True if user's role is at least as high as requiredRole */
    const hasRole = useCallback((requiredRole) => {
        if (!user) return false;
        return (ROLE_LEVELS[user.role] ?? -1) >= (ROLE_LEVELS[requiredRole] ?? 99);
    }, [user]);

    /** True if user has the given permission (via role default or user override) */
    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        const effective = new Set([
            ...(ROLE_PERMISSIONS[user.role] || []),
            ...(user.permissions || [])
        ]);
        return effective.has(permission);
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAuthenticated: !!token && !!user,
            login,
            logout,
            hasRole,
            hasPermission,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
