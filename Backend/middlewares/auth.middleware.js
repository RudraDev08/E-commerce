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
                message: "Not authorized to access this route. Please log in.",
            });
        }

        // TODO: In production, verify actual JWT token like `jwt.verify(token, process.env.JWT_SECRET)`
        // For development/demo with mock frontend, we stub the parsed payload to a valid User ObjectId.
        req.user = {
            _id: "65c3f9b0e4b0a1b2c3d4e5f6", // Mock authenticated user ObjectId
            role: "customer"
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized. Token verification failed.",
        });
    }
};
