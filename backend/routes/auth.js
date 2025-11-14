const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Validation middleware
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { username, email, password } = req.body;

        // Check if username already exists
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        // Check if email already exists
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }

        // Create new user
        const userId = await User.create(username, email, password);

        // Generate JWT token
        const token = jwt.sign(
            { userId, username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Get user with stats
        const user = await User.getUserWithStats(userId);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.is_admin === 1,
                stats: {
                    totalGames: user.total_games,
                    totalWins: user.total_wins,
                    totalLosses: user.total_losses,
                    totalDraws: user.total_draws,
                    currentStreak: user.current_streak,
                    bestStreak: user.best_streak,
                    easyGames: user.easy_games,
                    easyWins: user.easy_wins,
                    mediumGames: user.medium_games,
                    mediumWins: user.medium_wins,
                    hardGames: user.hard_games,
                    hardWins: user.hard_wins,
                    totalPlaytime: user.total_playtime,
                    lastPlayed: user.last_played
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

// Login user
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { username, password } = req.body;

        // Find user
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Get user with stats
        const userWithStats = await User.getUserWithStats(user.id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: userWithStats.id,
                username: userWithStats.username,
                email: userWithStats.email,
                isAdmin: userWithStats.is_admin === 1,
                stats: {
                    totalGames: userWithStats.total_games,
                    totalWins: userWithStats.total_wins,
                    totalLosses: userWithStats.total_losses,
                    totalDraws: userWithStats.total_draws,
                    currentStreak: userWithStats.current_streak,
                    bestStreak: userWithStats.best_streak,
                    easyGames: userWithStats.easy_games,
                    easyWins: userWithStats.easy_wins,
                    mediumGames: userWithStats.medium_games,
                    mediumWins: userWithStats.medium_wins,
                    hardGames: userWithStats.hard_games,
                    hardWins: userWithStats.hard_wins,
                    totalPlaytime: userWithStats.total_playtime,
                    lastPlayed: userWithStats.last_played
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Verify token (for auto-login)
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user with stats
        const user = await User.getUserWithStats(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.is_admin === 1,
                stats: {
                    totalGames: user.total_games,
                    totalWins: user.total_wins,
                    totalLosses: user.total_losses,
                    totalDraws: user.total_draws,
                    currentStreak: user.current_streak,
                    bestStreak: user.best_streak,
                    easyGames: user.easy_games,
                    easyWins: user.easy_wins,
                    mediumGames: user.medium_games,
                    mediumWins: user.medium_wins,
                    hardGames: user.hard_games,
                    hardWins: user.hard_wins,
                    totalPlaytime: user.total_playtime,
                    lastPlayed: user.last_played
                }
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }
        
        console.error('Token verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during token verification' 
        });
    }
});

module.exports = router;