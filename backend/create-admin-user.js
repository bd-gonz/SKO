const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function createAdminUser() {
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

        // Check if admin user already exists
        const [existingAdmin] = await connection.query(
            'SELECT * FROM users WHERE username = ?',
            ['admin']
        );

        if (existingAdmin.length > 0) {
            console.log('\n⚠️  Admin user already exists!');
            console.log('   To reset the password, delete the user first or update it manually.');
            
            // Make sure the existing admin has admin privileges
            await connection.query(
                'UPDATE users SET is_admin = TRUE WHERE username = ?',
                ['admin']
            );
            console.log('✅ Ensured admin user has admin privileges');
        } else {
            // Create new admin user
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

            console.log('\n🔐 Admin user created successfully:');
            console.log(`   Username: ${defaultAdmin.username}`);
            console.log(`   Password: ${defaultAdmin.password}`);
            console.log(`   Email: ${defaultAdmin.email}`);
            console.log('   ⚠️  IMPORTANT: Change this password after first login!');
        }

        console.log('\n🎉 Operation completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script
createAdminUser();