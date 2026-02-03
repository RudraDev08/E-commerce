import React, { createContext, useState, useEffect, useContext } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (savedUser && token) {
            try {
                setUser(JSON.parse(savedUser));
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error loading user:', error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    // Login
    const login = async (email, password) => {
        try {
            // TODO: Replace with actual API call
            // const response = await api.post('/auth/login', { email, password });

            // Mock login for now
            const mockUser = {
                id: '1',
                name: 'John Doe',
                email: email,
                phone: '+91 9876543210'
            };

            const mockToken = 'mock_jwt_token';

            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken);

            setUser(mockUser);
            setIsAuthenticated(true);

            return { success: true, user: mockUser };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    };

    // Register
    const register = async (userData) => {
        try {
            // TODO: Replace with actual API call
            // const response = await api.post('/auth/register', userData);

            // Mock registration for now
            const mockUser = {
                id: '1',
                name: userData.name,
                email: userData.email,
                phone: userData.phone
            };

            const mockToken = 'mock_jwt_token';

            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken);

            setUser(mockUser);
            setIsAuthenticated(true);

            return { success: true, user: mockUser };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: error.message };
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        setUser(null);
        setIsAuthenticated(false);
    };

    // Update user profile
    const updateProfile = async (updates) => {
        try {
            // TODO: Replace with actual API call
            // const response = await api.put('/auth/profile', updates);

            const updatedUser = { ...user, ...updates };
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
            setUser(updatedUser);

            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, message: error.message };
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
