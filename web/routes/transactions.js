const express = require('express');
const router = express.Router();
const path = require('path');
const { getPool } = require('../../database/connection');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/transactions.html'));
});

// Get all transactions
router.get('/api', async (req, res) => {
    try {
        const db = await getPool();
        const [rows] = await db.query(`
            SELECT t.*, p.name as product_name, p.code as product_code
            FROM transactions t
            LEFT JOIN products p ON t.product_id = p.id
            ORDER BY t.created_at DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get deposits
router.get('/api/deposits', async (req, res) => {
    try {
        const db = await getPool();
        const [rows] = await db.query('SELECT * FROM deposits ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
