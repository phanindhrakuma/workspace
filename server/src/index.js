require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./models');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(cors({ origin: isProd ? allowedOrigins : '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } });
app.use('/api/', limiter);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/seats', require('./routes/seats'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve React frontend in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        }
    });
    console.log('📦 Serving production frontend from client/dist');
}

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;

async function start() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced');
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        // Start without DB for frontend development
        console.log('⚠️  Starting server without database...');
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (no database)`));
    }
}

start();
