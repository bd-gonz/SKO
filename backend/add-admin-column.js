const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function addAdminColumn() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tictactoe_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('📦 Connected to database');

        // Check if is_admin column exists
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users LIKE 'is_admin'
        `);
        
        if (columns.length === 0) {
            // Add is_admin column to users table
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN is_admin BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ Added is_admin column to users table');
        } else {
            console.log('ℹ️  is_admin column already exists');
        }

        // Check if there are any users
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        
        if (users[0].count === 0) {
            // Create default admin user
            const defaultAdmin = {
                username: 'admin',
                email: 'admin@tictactoe.local',
                password: 'admin123',
                is_admin: true
            };

            const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
            
            const [result] = await connection.query(
                'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
                [defaultAdmin.username, defaultAdmin.email, hashedPassword, defaultAdmin.is_admin]
            );

            // Initialize stats for admin user
            await connection.query(
                'INSERT INTO user_stats (user_id) VALUES (?)',
                [result.insertId]
            );

            console.log('\n🔐 Default admin user created:');
            console.log(`   Username: ${defaultAdmin.username}`);
            console.log(`   Password: ${defaultAdmin.password}`);
            console.log('   ⚠️  IMPORTANT: Change this password after first login!');
        } else {
            console.log('\n📝 Users already exist. To make a user admin, run:');
            console.log('   UPDATE users SET is_admin = TRUE WHERE username = \'your_username\';');
        }

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error during migration:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run migration
addAdminColumn();