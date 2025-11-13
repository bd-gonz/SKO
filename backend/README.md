# Tic Tac Toe Backend - MySQL Database

This is the backend server for the Advanced Tic Tac Toe game with MySQL database integration.

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- npm or yarn package manager

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Database

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and configure your MySQL connection:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tictactoe_db
DB_PORT=3306

PORT=3000
NODE_ENV=development

JWT_SECRET=your_secret_key_here_change_in_production

CORS_ORIGIN=http://localhost:8080
```

### 3. Initialize Database

Run the database initialization script to create the database and tables:

```bash
npm run init-db
```

This will create:
- Database: `tictactoe_db`
- Tables: `users`, `user_stats`, `sessions`

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### User Stats Table
```sql
CREATE TABLE user_stats (
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in .env)

## API Endpoints

### Authentication

#### Register
- **POST** `/api/auth/register`
- Body: `{ username, email, password }`
- Returns: `{ success, message, token, user }`

#### Login
- **POST** `/api/auth/login`
- Body: `{ username, password }`
- Returns: `{ success, message, token, user }`

#### Verify Token
- **GET** `/api/auth/verify`
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, user }`

### Statistics

#### Get Stats
- **GET** `/api/stats`
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, stats }`

#### Update Stats
- **POST** `/api/stats/update`
- Headers: `Authorization: Bearer <token>`
- Body: `{ gameResult, difficulty, playtime }`
- Returns: `{ success, message, stats }`

#### Reset Stats
- **POST** `/api/stats/reset`
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, message, stats }`

### Health Check
- **GET** `/api/health`
- Returns: `{ success, message, timestamp }`

## Security Features

- **Password Hashing**: Uses bcrypt with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **SQL Injection Protection**: Parameterized queries with mysql2
- **CORS Protection**: Configurable CORS origins
- **Input Validation**: express-validator for request validation

## Troubleshooting

### Database Connection Failed

1. Ensure MySQL server is running:
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows
net start MySQL
```

2. Verify MySQL credentials in `.env`
3. Check if the database exists:
```bash
mysql -u root -p
SHOW DATABASES;
```

### Port Already in Use

Change the PORT in `.env` file to a different port number.

### JWT Token Errors

Make sure to set a strong JWT_SECRET in your `.env` file.

## Development

### Project Structure
```
backend/
├── config/
│   └── database.js       # Database connection pool
├── models/
│   └── User.js          # User model with database operations
├── routes/
│   ├── auth.js          # Authentication routes
│   └── stats.js         # Statistics routes
├── init-database.js     # Database initialization script
├── server.js            # Main server file
├── package.json         # Dependencies
├── .env.example         # Environment variables template
└── README.md           # This file
```

### Adding New Features

1. Create new route files in `routes/`
2. Add database operations in `models/`
3. Register routes in `server.js`
4. Update API documentation

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Use environment variables for sensitive data
5. Enable HTTPS
6. Set up database backups
7. Implement rate limiting
8. Add logging and monitoring

## License

MIT