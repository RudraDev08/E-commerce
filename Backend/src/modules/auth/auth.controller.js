/**
 * auth.controller.js
 * POST /api/auth/admin-login
 * POST /api/auth/login          (all roles)
 * POST /api/auth/logout
 * GET  /api/auth/me
 */

import jwt from 'jsonwebtoken';
import User from '../../../models/UserSchema.js';
import AuditLog from '../../../models/Audit/AuditLog.model.js';
import logger from '../../../config/logger.js';

// ── Roles allowed to access the Admin Panel ───────────────────────────────
const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff'];

// ── Token factory ─────────────────────────────────────────────────────────
const signAccessToken = (user) =>
    jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

const signRefreshToken = (user) =>
    jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000  // 15 mins for access token in cookie
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
};

// ── POST /api/auth/admin-login ─────────────────────────────────────────────
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        // Find user and explicitly select passwordHash (hidden by default)
        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select('+passwordHash');

        if (!user) {
            await AuditLog.create({
                userEmail: email.toLowerCase().trim(),
                action: 'LOGIN',
                entityType: 'User',
                after: { status: 'FAILED', reason: 'Invalid credentials - no user' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }).catch(() => { });
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Block check
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: `Account suspended${user.blockReason ? ': ' + user.blockReason : '. Contact support.'}`
            });
        }

        // Soft delete check
        if (user.isDeleted) {
            return res.status(401).json({ success: false, message: 'Account no longer exists.' });
        }

        // Role gate — admin panel only for staff and above
        if (!ADMIN_ROLES.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'This login is for admin users only.'
            });
        }

        // Password verification
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await AuditLog.create({
                userId: user._id,
                userEmail: user.email,
                userRole: user.role,
                action: 'LOGIN',
                entityType: 'User',
                after: { status: 'FAILED', reason: 'Invalid password' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }).catch(() => { });
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false });

        const token = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        // Set httpOnly cookie + return token in body (cookie for security, body for SPA convenience)
        res.cookie('adminToken', token, cookieOptions);
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);

        logger.info(`[Auth] Admin login: ${user.email} (${user.role})`);

        return res.json({
            success: true,
            message: 'Login successful.',
            token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                lastLoginAt: user.lastLoginAt
            }
        });
    } catch (error) {
        logger.error('[Auth] adminLogin error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ── POST /api/auth/login (all users) ──────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select('+passwordHash');

        if (!user || user.isDeleted) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: `Account suspended${user.blockReason ? ': ' + user.blockReason : '.'}`
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false });

        const token = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        res.cookie('token', token, cookieOptions);
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);

        return res.json({
            success: true,
            token,
            refreshToken,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        logger.error('[Auth] login error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ── POST /api/auth/logout ──────────────────────────────────────────────────
export const logout = (_req, res) => {
    res.clearCookie('adminToken');
    res.clearCookie('token');
    return res.json({ success: true, message: 'Logged out successfully.' });
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ── POST /api/auth/refresh ──────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
    try {
        const rfToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!rfToken) {
            return res.status(401).json({ success: false, message: 'Refresh token not found.' });
        }

        const decoded = jwt.verify(rfToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);

        if (!user || user.isDeleted || user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Invalid token or user blocked.' });
        }

        const token = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user);

        res.cookie('token', token, cookieOptions);
        res.cookie('adminToken', token, cookieOptions);
        res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

        return res.json({ success: true, token, refreshToken: newRefreshToken });
    } catch (error) {
        logger.error('[Auth] Refresh token error:', error.message);
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
};
