/**
 * auth.routes.js
 * /api/auth/*
 */

import express from 'express';
import { adminLogin, login, logout, getMe, refreshToken } from './auth.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/authorize.middleware.js';
import { loginRateLimiter } from './rateLimiter.js';

const router = express.Router();

// Public
router.post('/admin-login', loginRateLimiter, adminLogin);
router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);

// Protected — current user info
router.get('/me', protect, getMe);

// Refresh Token
router.post('/refresh', refreshToken);

export default router;
