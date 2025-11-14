const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access token required' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.is_admin === 1
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired' 
            });
        }
        
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({ 
            success: false, 
            message: 'Admin access required' 
        });
    }

    next();
}

module.exports = {
    authenticateToken,
    isAdmin
};