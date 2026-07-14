const express = require('express');
const path = require('path');
const session = require('express-session');
const { getPool } = require('../database/connection');

const app = express();
const WEB_PORT = process.env.WEB_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.BOT_TOKEN || 'secret-key-bot-admin',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 jam
}));

// Auth middleware
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.loggedIn) {
        return next();
    }
    res.redirect('/login');
};

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const settingsRoutes = require('./routes/settings');
const usersRoutes = require('./routes/users');
const transactionsRoutes = require('./routes/transactions');

app.use('/', authRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/categories', authMiddleware, categoryRoutes);
app.use('/products', authMiddleware, productRoutes);
app.use('/settings', authMiddleware, settingsRoutes);
app.use('/users', authMiddleware, usersRoutes);
app.use('/transactions', authMiddleware, transactionsRoutes);

// Start server
const startWeb = () => {
    app.listen(WEB_PORT, () => {
        console.log(`[WEB] Admin panel running on port ${WEB_PORT}`);
    });
};

module.exports = { startWeb };
