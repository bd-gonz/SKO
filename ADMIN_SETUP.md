# Admin Console Setup Guide

## Overview
The admin console provides a web-based interface for managing users in the Tic Tac Toe application. Administrators can view, create, edit, and delete users, as well as view user statistics.

## Prerequisites
- Backend server must be running
- MySQL database must be configured and running
- The `is_admin` column must be added to the users table

## Setup Instructions

### Step 1: Add Admin Column to Database
Run the migration script to add the `is_admin` column and create a default admin user:

```bash
cd backend
node add-admin-column.js
```

This script will:
- Add the `is_admin` column to the `users` table
- Create a default admin user with credentials:
  - **Username:** `admin`
  - **Password:** `admin123`
  - **Email:** `admin@tictactoe.com`

**IMPORTANT:** Change the default admin password immediately after first login!

### Step 2: Start the Backend Server
Make sure your backend server is running:

```bash
cd backend
npm start
```

The server should be running on `http://localhost:3000`

### Step 3: Start the Frontend Server
The frontend needs to be served on port 8080. You can use any static file server. For example:

Using Python:
```bash
cd frontend
python3 -m http.server 8080
```

Or using Node.js `http-server`:
```bash
npm install -g http-server
cd frontend
http-server -p 8080
```

### Step 4: Access the Admin Console

1. Open your browser and go to `http://localhost:8080`
2. Click "Login" and use the default admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. Once logged in, you'll see an "Admin Console" button in the header
4. Click "Admin Console" to open the admin interface in a new tab

## Admin Console Features

### User Management
- **View All Users:** See a list of all registered users with their details
- **Search Users:** Filter users by username or email
- **Create New User:** Add new users with username, email, and password
- **Edit User:** Update user information and admin status
- **Delete User:** Remove users from the system
- **View Statistics:** See detailed game statistics for any user

### User Statistics
For each user, you can view:
- Total games played
- Win/loss/draw record
- Win rate percentage
- Current and best winning streaks
- Performance by difficulty level (Easy, Medium, Hard)
- Total playtime

## Security Features

### Authentication
- All admin routes require a valid JWT token
- Tokens are verified on every request
- Tokens expire after 7 days

### Authorization
- Admin routes check for `is_admin` flag in the user record
- Non-admin users receive a 403 Forbidden error when accessing admin endpoints
- The admin button only appears for users with admin privileges

### Password Security
- Passwords are hashed using bcrypt before storage
- Minimum password length: 6 characters
- Passwords are never returned in API responses

## API Endpoints

### Admin Routes (Require Admin Authentication)

#### Get All Users
```
GET /api/admin/users
Authorization: Bearer <token>
```

#### Create User
```
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "isAdmin": false
}
```

#### Update User
```
PUT /api/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "updateduser",
  "email": "updated@example.com",
  "password": "newpassword",  // Optional
  "isAdmin": true
}
```

#### Delete User
```
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

#### Get User Statistics
```
GET /api/admin/users/:id/stats
Authorization: Bearer <token>
```

## Troubleshooting

### "Failed to fetch" Error
- Ensure the backend server is running on port 3000
- Check that CORS is properly configured in `backend/server.js`
- Verify the API_URL in `frontend/admin.js` matches your backend URL

### Admin Button Not Showing
- Verify the user has `is_admin = 1` in the database
- Check browser console for any JavaScript errors
- Ensure you're logged in with an admin account

### Cannot Access Admin Console
- Verify you're logged in as an admin user
- Check that the JWT token is valid and not expired
- Ensure the backend admin routes are properly registered

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `backend/.env`
- Ensure the `users` table has the `is_admin` column

## Best Practices

1. **Change Default Password:** Immediately change the default admin password after setup
2. **Limit Admin Access:** Only grant admin privileges to trusted users
3. **Regular Backups:** Backup your database regularly
4. **Monitor Activity:** Keep track of admin actions through server logs
5. **Use HTTPS:** In production, always use HTTPS for secure communication

## File Structure

```
backend/
├── routes/
│   ├── admin.js          # Admin API routes
│   └── auth.js           # Authentication routes (updated with isAdmin)
├── add-admin-column.js   # Database migration script
└── server.js             # Main server file (includes admin routes)

frontend/
├── admin.html            # Admin console interface
├── admin.css             # Admin console styles
├── admin.js              # Admin console functionality
├── index.html            # Main game page (includes admin button)
└── script.js             # Game logic (includes admin button handler)
```

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review server logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed (`npm install`)