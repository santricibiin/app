const express = require('express');
const router = express.Router();
const path = require('path');
const { getPool } = require('../../database/connection');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/users.html'));
});

// Get all users
router.get('/api', async (req, res) => {
    try {
        const db = await getPool();
        const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user saldo
router.put('/api/:id/saldo', async (req, res) => {
    try {
        const { id } = req.params;
        const { saldo } = req.body;
        const db = await getPool();
        await db.query('UPDATE users SET saldo = ? WHERE id = ?', [parseInt(saldo), id]);
        res.json({ success: true, message: 'Saldo berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/api/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getPool();
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'User berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
