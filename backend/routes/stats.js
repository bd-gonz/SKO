const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Get user statistics
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = await User.getUserWithStats(req.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
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
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching statistics' 
        });
    }
});

// Update user statistics after a game
router.post('/update', [
    authenticateToken,
    body('gameResult').isIn(['win', 'loss', 'draw']).withMessage('Invalid game result'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
    body('playtime').isInt({ min: 0 }).withMessage('Playtime must be a positive integer')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { gameResult, difficulty, playtime } = req.body;

        await User.updateStats(req.userId, gameResult, difficulty, playtime);

        // Get updated stats
        const user = await User.getUserWithStats(req.userId);

        res.json({
            success: true,
            message: 'Statistics updated successfully',
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
        });

    } catch (error) {
        console.error('Update stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating statistics' 
        });
    }
});

// Reset user statistics
router.post('/reset', authenticateToken, async (req, res) => {
    try {
        await User.resetStats(req.userId);

        res.json({
            success: true,
            message: 'Statistics reset successfully',
            stats: {
                totalGames: 0,
                totalWins: 0,
                totalLosses: 0,
                totalDraws: 0,
                currentStreak: 0,
                bestStreak: 0,
                easyGames: 0,
                easyWins: 0,
                mediumGames: 0,
                mediumWins: 0,
                hardGames: 0,
                hardWins: 0,
                totalPlaytime: 0,
                lastPlayed: null
            }
        });

    } catch (error) {
        console.error('Reset stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while resetting statistics' 
        });
    }
});

module.exports = router;