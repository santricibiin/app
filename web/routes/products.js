const express = require('express');
const router = express.Router();
const path = require('path');
const { getPool } = require('../../database/connection');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/products.html'));
});

// Get all products with category and stock count
router.get('/api', async (req, res) => {
    try {
        const db = await getPool();
        const [rows] = await db.query(`
            SELECT p.*, c.name as category_name, 
            (SELECT COUNT(*) FROM stocks WHERE product_id = p.id) as stock_count
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get categories for dropdown
router.get('/api/categories', async (req, res) => {
    try {
        const db = await getPool();
        const [rows] = await db.query('SELECT id, name FROM categories ORDER BY name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add product
router.post('/api', async (req, res) => {
    try {
        const { category_id, code, name, price, description, snk } = req.body;
        if (!category_id || !code || !name || !price) {
            return res.status(400).json({ error: 'Kategori, kode, nama, dan harga wajib diisi' });
        }
        const db = await getPool();
        await db.query(
            'INSERT INTO products (category_id, code, name, price, description, snk) VALUES (?, ?, ?, ?, ?, ?)',
            [category_id, code.trim(), name.trim(), parseInt(price), description || null, snk || null]
        );
        res.json({ success: true, message: 'Produk berhasil ditambahkan' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Kode produk sudah ada' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update product
router.put('/api/:id', async (req, res) => {
    try {
        const { category_id, code, name, price, description, snk } = req.body;
        const { id } = req.params;
        const db = await getPool();
        await db.query(
            'UPDATE products SET category_id = ?, code = ?, name = ?, price = ?, description = ?, snk = ? WHERE id = ?',
            [category_id, code.trim(), name.trim(), parseInt(price), description || null, snk || null, id]
        );
        res.json({ success: true, message: 'Produk berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete product
router.delete('/api/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getPool();
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ success: true, message: 'Produk berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get stock for a product
router.get('/api/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getPool();
        const [rows] = await db.query('SELECT * FROM stocks WHERE product_id = ? ORDER BY created_at DESC', [id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add stock
router.post('/api/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { stocks } = req.body;
        if (!stocks || !stocks.trim()) {
            return res.status(400).json({ error: 'Data stok wajib diisi' });
        }
        const db = await getPool();
        const stockList = stocks.split('\n').filter(s => s.trim());
        for (const stock of stockList) {
            await db.query('INSERT INTO stocks (product_id, data) VALUES (?, ?)', [id, stock.trim()]);
        }
        res.json({ success: true, message: `${stockList.length} stok berhasil ditambahkan` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete single stock
router.delete('/api/stock/:stockId', async (req, res) => {
    try {
        const { stockId } = req.params;
        const db = await getPool();
        await db.query('DELETE FROM stocks WHERE id = ?', [stockId]);
        res.json({ success: true, message: 'Stok berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete all stock for a product
router.delete('/api/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getPool();
        await db.query('DELETE FROM stocks WHERE product_id = ?', [id]);
        res.json({ success: true, message: 'Semua stok berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
