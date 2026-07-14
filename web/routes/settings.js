const express = require('express');
const router = express.Router();
const path = require('path');
const { getPool } = require('../../database/connection');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/settings.html'));
});

// Get settings
router.get('/api', async (req, res) => {
    try {
        const db = await getPool();
        const [[settings]] = await db.query('SELECT * FROM settings WHERE id = 1');
        res.json(settings || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update settings
router.put('/api', async (req, res) => {
    try {
        const { welcome_message, rating, reviews, trxall, alluser, pakasir_slug, pakasir_apikey } = req.body;
        const db = await getPool();
        await db.query(`
            UPDATE settings SET 
                welcome_message = ?,
                rating = ?,
                reviews = ?,
                trxall = ?,
                alluser = ?,
                pakasir_slug = ?,
                pakasir_apikey = ?
            WHERE id = 1
        `, [welcome_message, rating || 5.0, reviews || 0, trxall || 0, alluser || 0, pakasir_slug, pakasir_apikey]);
        res.json({ success: true, message: 'Settings berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
