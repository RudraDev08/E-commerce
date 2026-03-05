import jwt from 'jsonwebtoken';
import User from '../models/UserSchema.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Please log in.',
            });
        }

        // Verify signature and expiry
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).json({
                success: false,
                message: jwtErr.name === 'TokenExpiredError'
                    ? 'Session expired. Please log in again.'
                    : 'Invalid token. Please log in again.',
            });
        }

        // Fetch user (select passwordHash for changed-after check)
        const user = await User.findById(decoded._id).select('+passwordHash');

        if (!user || user.isDeleted) {
            return res.status(401).json({
                success: false,
                message: 'User account no longer exists.',
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: `Account suspended: ${user.blockReason || 'Contact support.'}`,
            });
        }

        // Reject token issued before a password change
        if (user.passwordChangedAfter(decoded.iat)) {
            return res.status(401).json({
                success: false,
                message: 'Password was recently changed. Please log in again.',
            });
        }

        // Attach clean user object (no passwordHash) to request
        req.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            _permissions: user.permissions || []  // user-level overrides for requirePermission()
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Token verification failed.',
        });
    }
};

