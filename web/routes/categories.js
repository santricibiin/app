const express = require('express');
const router = express.Router();
const path = require('path');
const { getPool } = require('../../database/connection');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/categories.html'));
});

// Get all categories
router.get('/api', async (req, res) => {
    try {
        const db = await getPool();
        const [rows] = await db.query('SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count FROM categories c ORDER BY c.created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add category
router.post('/api', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Nama kategori wajib diisi' });
        }
        const db = await getPool();
        await db.query('INSERT INTO categories (name) VALUES (?)', [name.trim()]);
        res.json({ success: true, message: 'Kategori berhasil ditambahkan' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Kategori sudah ada' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update category
router.put('/api/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Nama kategori wajib diisi' });
        }
        const db = await getPool();
        await db.query('UPDATE categories SET name = ? WHERE id = ?', [name.trim(), id]);
        res.json({ success: true, message: 'Kategori berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete category
router.delete('/api/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getPool();
        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true, message: 'Kategori berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
