const { getPool } = require('../database/connection');

const createTransaction = async (orderId, userId, productId, qty, amount) => {
    const db = await getPool();
    await db.query(
        'INSERT INTO transactions (order_id, user_id, product_id, qty, amount) VALUES (?, ?, ?, ?, ?)',
        [orderId, userId, productId, qty, amount]
    );
};

const getTransaction = async (orderId) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM transactions WHERE order_id = ?', [orderId]);
    return rows[0];
};

const updateTransactionStatus = async (orderId, status) => {
    const db = await getPool();
    await db.query('UPDATE transactions SET status = ? WHERE order_id = ?', [status, orderId]);
};

const getPendingTransaction = async (userId) => {
    const db = await getPool();
    const [rows] = await db.query(
        'SELECT * FROM transactions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
        [userId, 'pending']
    );
    return rows[0];
};

module.exports = { createTransaction, getTransaction, updateTransactionStatus, getPendingTransaction };
