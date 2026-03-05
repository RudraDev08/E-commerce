/**
 * authApi.js — Authentication API calls
 */

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-logout on 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export const authApi = {
    adminLogin: (email, password) =>
        api.post('/auth/admin-login', { email, password }),

    logout: () => api.post('/auth/logout'),

    getMe: () => api.get('/auth/me'),
};

export default api;
