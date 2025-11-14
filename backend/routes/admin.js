const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        // Check if user object exists and has isAdmin property
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking admin privileges'
        });
    }
};

// Get all users (admin only)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.email,
                u.is_admin,
                u.created_at,
                s.total_games,
                s.total_wins,
                s.best_streak
            FROM users u
            LEFT JOIN user_stats s ON u.id = s.user_id
            ORDER BY u.created_at DESC
        `);
        
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// Create new user (admin only)
router.post('/users',
    authenticateToken,
    isAdmin,
    [
        body('username').trim().isLength({ min: 3, max: 20 }),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('is_admin').optional().isBoolean()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, email, password, is_admin = false } = req.body;

        try {
            // Check if username or email already exists
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username or email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const [result] = await pool.query(
                'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, is_admin]
            );

            // Initialize stats for new user
            await pool.query(
                'INSERT INTO user_stats (user_id) VALUES (?)',
                [result.insertId]
            );

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: {
                    id: result.insertId,
                    username,
                    email,
                    is_admin
                }
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating user'
            });
        }
    }
);

// Update user (admin only)
router.put('/users/:id',
    authenticateToken,
    isAdmin,
    [
        body('username').optional().trim().isLength({ min: 3, max: 20 }),
        body('email').optional().isEmail().normalizeEmail(),
        body('password').optional().isLength({ min: 6 }),
        body('is_admin').optional().isBoolean()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.params.id;
        const { username, email, password, is_admin } = req.body;

        try {
            // Check if user exists
            const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            if (username !== undefined) {
                updates.push('username = ?');
                values.push(username);
            }
            if (email !== undefined) {
                updates.push('email = ?');
                values.push(email);
            }
            if (password !== undefined) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push('password = ?');
                values.push(hashedPassword);
            }
            if (is_admin !== undefined) {
                updates.push('is_admin = ?');
                values.push(is_admin);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            values.push(userId);
            await pool.query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            res.json({
                success: true,
                message: 'User updated successfully'
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user'
            });
        }
    }
);

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const userId = req.params.id;

    try {
        // Prevent admin from deleting themselves
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Check if user exists
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete user stats first (foreign key constraint)
        await pool.query('DELETE FROM user_stats WHERE user_id = ?', [userId]);
        
        // Delete user
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
});

// Get user statistics (admin only)
router.get('/users/:id/stats', authenticateToken, isAdmin, async (req, res) => {
    const userId = req.params.id;

    try {
        const [stats] = await pool.query(`
            SELECT 
                u.username,
                u.email,
                s.*
            FROM users u
            LEFT JOIN user_stats s ON u.id = s.user_id
            WHERE u.id = ?
        `, [userId]);

        if (stats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics'
        });
    }
});

module.exports = router;