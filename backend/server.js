const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Tic Tac Toe API Server',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                verify: 'GET /api/auth/verify'
            },
            stats: {
                get: 'GET /api/stats',
                update: 'POST /api/stats/update',
                reset: 'POST /api/stats/reset'
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Endpoint not found' 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your configuration.');
            console.log('\n📝 Make sure to:');
            console.log('1. Copy .env.example to .env and configure your database settings');
            console.log('2. Run "npm run init-db" to initialize the database');
            console.log('3. Ensure MySQL server is running\n');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log('\n🚀 Server started successfully!');
            console.log(`📡 Server running on http://localhost:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
            console.log('\n📚 Available endpoints:');
            console.log(`   - Health check: http://localhost:${PORT}/api/health`);
            console.log(`   - API docs: http://localhost:${PORT}/`);
            console.log('\n✨ Ready to accept requests!\n');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();