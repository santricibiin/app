const express = require('express');
const router = express.Router();
const path = require('path');
const { getPool } = require('../../database/connection');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

router.get('/api/stats', async (req, res) => {
    try {
        const db = await getPool();
        const [[users]] = await db.query('SELECT COUNT(*) as total FROM users');
        const [[products]] = await db.query('SELECT COUNT(*) as total FROM products');
        const [[categories]] = await db.query('SELECT COUNT(*) as total FROM categories');
        const [[stocks]] = await db.query('SELECT COUNT(*) as total FROM stocks');
        const [[transactions]] = await db.query('SELECT COUNT(*) as total FROM transactions WHERE status = "completed"');
        const [[revenue]] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = "completed"');
        const [[deposits]] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE status = "completed"');

        res.json({
            users: users.total,
            products: products.total,
            categories: categories.total,
            stocks: stocks.total,
            transactions: transactions.total,
            revenue: revenue.total,
            deposits: deposits.total
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
