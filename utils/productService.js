const { getPool } = require('../database/connection');

const addCategory = async (name) => {
    const db = await getPool();
    await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
};

const deleteCategory = async (name) => {
    const db = await getPool();
    const [result] = await db.query('DELETE FROM categories WHERE name = ?', [name]);
    return result.affectedRows > 0;
};

const getCategoryByName = async (name) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM categories WHERE name = ?', [name]);
    return rows[0];
};

const getCategoryById = async (id) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
};

const getAllCategories = async () => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    return rows;
};

const addProduct = async (categoryId, code, name, price, description, snk = null) => {
    const db = await getPool();
    await db.query(
        'INSERT INTO products (category_id, code, name, price, description, snk) VALUES (?, ?, ?, ?, ?, ?)',
        [categoryId, code, name, price, description, snk]
    );
};

const getProductByCode = async (code) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM products WHERE code = ?', [code]);
    return rows[0];
};

const getProductById = async (id) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
};

const getProductsByCategoryId = async (categoryId) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM products WHERE category_id = ? ORDER BY name', [categoryId]);
    return rows;
};

const updateProduct = async (code, field, value) => {
    const db = await getPool();
    const allowed = ['name', 'price', 'description', 'snk'];
    if (!allowed.includes(field)) return false;
    await db.query(`UPDATE products SET ${field} = ? WHERE code = ?`, [value, code]);
    return true;
};

const addStock = async (productId, data) => {
    const db = await getPool();
    await db.query('INSERT INTO stocks (product_id, data) VALUES (?, ?)', [productId, data]);
};

const getStocksByProductId = async (productId) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM stocks WHERE product_id = ? ORDER BY id', [productId]);
    return rows;
};

const getStockCount = async (productId) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT COUNT(*) as count FROM stocks WHERE product_id = ?', [productId]);
    return rows[0].count;
};

const deleteStock = async (productId, mode) => {
    const db = await getPool();
    if (mode === 'all') {
        await db.query('DELETE FROM stocks WHERE product_id = ?', [productId]);
    } else if (!isNaN(mode)) {
        const [rows] = await db.query('SELECT id FROM stocks WHERE product_id = ? ORDER BY id LIMIT ?', [productId, parseInt(mode)]);
        if (rows.length > 0) {
            const ids = rows.map(r => r.id);
            await db.query('DELETE FROM stocks WHERE id IN (?)', [ids]);
        }
    } else {
        await db.query('DELETE FROM stocks WHERE product_id = ? AND data = ?', [productId, mode]);
    }
};

const takeStock = async (productId, qty) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM stocks WHERE product_id = ? ORDER BY id LIMIT ?', [productId, qty]);
    if (rows.length < qty) return null;
    const ids = rows.map(r => r.id);
    await db.query('DELETE FROM stocks WHERE id IN (?)', [ids]);
    return rows.map(r => r.data);
};

module.exports = {
    addCategory, deleteCategory, getCategoryByName, getCategoryById, getAllCategories,
    addProduct, getProductByCode, getProductById, getProductsByCategoryId, updateProduct,
    addStock, getStocksByProductId, getStockCount, deleteStock, takeStock
};

