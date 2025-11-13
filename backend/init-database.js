const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
    let connection;
    
    try {
        // Connect to MySQL server (without database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('📦 Connected to MySQL server');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'tictactoe_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database '${dbName}' created or already exists`);

        // Use the database
        await connection.query(`USE ${dbName}`);

        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table "users" created or already exists');

        // Create user_stats table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_games INT DEFAULT 0,
                total_wins INT DEFAULT 0,
                total_losses INT DEFAULT 0,
                total_draws INT DEFAULT 0,
                current_streak INT DEFAULT 0,
                best_streak INT DEFAULT 0,
                easy_games INT DEFAULT 0,
                easy_wins INT DEFAULT 0,
                medium_games INT DEFAULT 0,
                medium_wins INT DEFAULT 0,
                hard_games INT DEFAULT 0,
                hard_wins INT DEFAULT 0,
                total_playtime INT DEFAULT 0,
                last_played TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_stats (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table "user_stats" created or already exists');

        // Create sessions table for JWT token management (optional)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (token(255)),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table "sessions" created or already exists');

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\nYou can now start the server with: npm start');

    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run initialization
initializeDatabase();