# MySQL Database Setup Guide

This guide will help you migrate from localStorage to MySQL database for the Advanced Tic Tac Toe game.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MySQL Server** (v5.7 or higher) - [Download](https://dev.mysql.com/downloads/mysql/)
- **npm** (comes with Node.js)

## Quick Start

### 1. Install MySQL (if not already installed)

#### macOS (using Homebrew)
```bash
brew install mysql
brew services start mysql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

#### Windows
Download and install from [MySQL Downloads](https://dev.mysql.com/downloads/installer/)

### 2. Secure MySQL Installation

```bash
mysql_secure_installation
```

Follow the prompts to set a root password and secure your installation.

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials
nano .env  # or use your preferred editor
```

### 4. Configure Environment Variables

Edit `backend/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=tictactoe_db
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this

# CORS Configuration
CORS_ORIGIN=http://localhost:8080
```

### 5. Initialize Database

```bash
# Run database initialization
npm run init-db
```

You should see:
```
✅ Database 'tictactoe_db' created or already exists
✅ Table "users" created or already exists
✅ Table "user_stats" created or already exists
✅ Table "sessions" created or already exists
🎉 Database initialization completed successfully!
```

### 6. Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

You should see:
```
🚀 Server started successfully!
📡 Server running on http://localhost:3000
✅ Database connected successfully
```

### 7. Serve the Frontend

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Serve with a simple HTTP server
# Option 1: Using Python
python3 -m http.server 8080

# Option 2: Using Node.js http-server
npx http-server -p 8080

# Option 3: Using PHP
php -S localhost:8080
```

### 8. Access the Application

Open your browser and navigate to:
```
http://localhost:8080
```

## Detailed Setup

### Database Schema

The system creates three tables:

#### 1. Users Table
Stores user account information:
- `id` - Auto-incrementing primary key
- `username` - Unique username
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

#### 2. User Stats Table
Stores game statistics:
- `user_id` - Foreign key to users table
- `total_games` - Total games played
- `total_wins` - Total wins
- `total_losses` - Total losses
- `total_draws` - Total draws
- `current_streak` - Current winning streak
- `best_streak` - Best winning streak
- `easy_games` / `easy_wins` - Stats vs Easy AI
- `medium_games` / `medium_wins` - Stats vs Medium AI
- `hard_games` / `hard_wins` - Stats vs Hard AI
- `total_playtime` - Total time played (seconds)
- `last_played` - Last game timestamp

#### 3. Sessions Table
Stores JWT tokens (optional):
- `user_id` - Foreign key to users table
- `token` - JWT token
- `created_at` - Token creation time
- `expires_at` - Token expiration time

### API Endpoints

#### Authentication

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "password123"
}
```

**Verify Token**
```http
GET /api/auth/verify
Authorization: Bearer <your_jwt_token>
```

#### Statistics

**Get Stats**
```http
GET /api/stats
Authorization: Bearer <your_jwt_token>
```

**Update Stats**
```http
POST /api/stats/update
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "gameResult": "win",
  "difficulty": "medium",
  "playtime": 45
}
```

**Reset Stats**
```http
POST /api/stats/reset
Authorization: Bearer <your_jwt_token>
```

## Testing

### 1. Test Database Connection

```bash
cd backend
node -e "require('./config/database').testConnection()"
```

### 2. Test API Endpoints

Using curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### 3. Verify Database Tables

```bash
mysql -u root -p
```

```sql
USE tictactoe_db;
SHOW TABLES;
DESCRIBE users;
DESCRIBE user_stats;
SELECT * FROM users;
```

## Troubleshooting

### Issue: "Database connection failed"

**Solution:**
1. Check if MySQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mysql
   ```

2. Verify credentials in `.env`
3. Test MySQL connection:
   ```bash
   mysql -u root -p
   ```

### Issue: "Port 3000 already in use"

**Solution:**
Change the PORT in `backend/.env`:
```env
PORT=3001
```

Also update `frontend/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

### Issue: "CORS error"

**Solution:**
Update `CORS_ORIGIN` in `backend/.env` to match your frontend URL:
```env
CORS_ORIGIN=http://localhost:8080
```

### Issue: "JWT token invalid"

**Solution:**
1. Clear browser localStorage
2. Generate a new JWT_SECRET in `.env`
3. Restart the backend server

### Issue: "Cannot find module"

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

## Migration from localStorage

If you have existing users in localStorage, they will need to re-register in the MySQL database. The localStorage data is not automatically migrated.

To keep both systems:
1. Keep the original `index.html`, `styles.css`, and `script.js` in the root directory (localStorage version)
2. Use the `frontend/` directory for the MySQL version

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong JWT_SECRET** - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Use HTTPS in production**
4. **Regular database backups**
5. **Keep dependencies updated**: `npm audit fix`
6. **Use environment-specific configs**

## Production Deployment

For production deployment:

1. Set environment to production:
   ```env
   NODE_ENV=production
   ```

2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name tictactoe-api
   ```

3. Set up reverse proxy (nginx/Apache)
4. Enable SSL/TLS certificates
5. Configure firewall rules
6. Set up database backups
7. Implement logging and monitoring

## Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT.io](https://jwt.io/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)

## Support

If you encounter any issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs in the terminal
3. Check MySQL error logs
4. Verify all environment variables are set correctly

---

**Happy Gaming! 🎮**