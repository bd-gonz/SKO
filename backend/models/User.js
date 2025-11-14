const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    // Create a new user
    static async create(username, email, password) {
        try {
            // Hash password with bcrypt (10 salt rounds)
            const passwordHash = await bcrypt.hash(password, 10);
            
            const [result] = await pool.query(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, passwordHash]
            );
            
            // Create initial stats for the user
            await pool.query(
                'INSERT INTO user_stats (user_id) VALUES (?)',
                [result.insertId]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // Find user by username
    static async findByUsername(username) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }
    
    // Find user by email
    static async findByEmail(email) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }
    
    // Find user by ID
    static async findById(id) {
        try {
            const [rows] = await pool.query(
                'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }
    
    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    
    // Get user with stats
    static async getUserWithStats(userId) {
        try {
            const [rows] = await pool.query(`
                SELECT
                    u.id, u.username, u.email, u.is_admin, u.created_at,
                    s.total_games, s.total_wins, s.total_losses, s.total_draws,
                    s.current_streak, s.best_streak,
                    s.easy_games, s.easy_wins,
                    s.medium_games, s.medium_wins,
                    s.hard_games, s.hard_wins,
                    s.total_playtime, s.last_played
                FROM users u
                LEFT JOIN user_stats s ON u.id = s.user_id
                WHERE u.id = ?
            `, [userId]);
            
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }
    
    // Update user statistics
    static async updateStats(userId, gameResult, difficulty, playtime) {
        try {
            const connection = await pool.getConnection();
            await connection.beginTransaction();
            
            try {
                // Get current stats
                const [currentStats] = await connection.query(
                    'SELECT * FROM user_stats WHERE user_id = ?',
                    [userId]
                );
                
                if (currentStats.length === 0) {
                    throw new Error('User stats not found');
                }
                
                const stats = currentStats[0];
                
                // Calculate new values
                const totalGames = stats.total_games + 1;
                const totalPlaytime = stats.total_playtime + playtime;
                
                let totalWins = stats.total_wins;
                let totalLosses = stats.total_losses;
                let totalDraws = stats.total_draws;
                let currentStreak = stats.current_streak;
                let bestStreak = stats.best_streak;
                
                // Update difficulty-specific stats
                const difficultyKey = difficulty.toLowerCase();
                const difficultyGames = stats[`${difficultyKey}_games`] + 1;
                let difficultyWins = stats[`${difficultyKey}_wins`];
                
                if (gameResult === 'win') {
                    totalWins++;
                    difficultyWins++;
                    currentStreak++;
                    bestStreak = Math.max(bestStreak, currentStreak);
                } else if (gameResult === 'loss') {
                    totalLosses++;
                    currentStreak = 0;
                } else {
                    totalDraws++;
                    currentStreak = 0;
                }
                
                // Update stats in database
                await connection.query(`
                    UPDATE user_stats SET
                        total_games = ?,
                        total_wins = ?,
                        total_losses = ?,
                        total_draws = ?,
                        current_streak = ?,
                        best_streak = ?,
                        ${difficultyKey}_games = ?,
                        ${difficultyKey}_wins = ?,
                        total_playtime = ?,
                        last_played = NOW()
                    WHERE user_id = ?
                `, [
                    totalGames, totalWins, totalLosses, totalDraws,
                    currentStreak, bestStreak,
                    difficultyGames, difficultyWins,
                    totalPlaytime, userId
                ]);
                
                await connection.commit();
                connection.release();
                
                return true;
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }
    
    // Reset user statistics
    static async resetStats(userId) {
        try {
            await pool.query(`
                UPDATE user_stats SET
                    total_games = 0,
                    total_wins = 0,
                    total_losses = 0,
                    total_draws = 0,
                    current_streak = 0,
                    best_streak = 0,
                    easy_games = 0,
                    easy_wins = 0,
                    medium_games = 0,
                    medium_wins = 0,
                    hard_games = 0,
                    hard_wins = 0,
                    total_playtime = 0,
                    last_played = NULL
                WHERE user_id = ?
            `, [userId]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;