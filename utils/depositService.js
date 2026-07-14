const { getPool } = require('../database/connection');

const createDeposit = async (orderId, userId, amount) => {
    const db = await getPool();
    await db.query('INSERT INTO deposits (order_id, user_id, amount) VALUES (?, ?, ?)', [orderId, userId, amount]);
};

const getDeposit = async (orderId) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM deposits WHERE order_id = ?', [orderId]);
    return rows[0];
};

const updateDepositStatus = async (orderId, status) => {
    const db = await getPool();
    await db.query('UPDATE deposits SET status = ? WHERE order_id = ?', [status, orderId]);
};

const getUserTrxCount = async (userId) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status = ?', [userId, 'completed']);
    return rows[0].count;
};

const getTotalTrx = async () => {
    const db = await getPool();
    const [rows] = await db.query('SELECT COUNT(*) as count FROM transactions WHERE status = ?', ['completed']);
    return rows[0].count;
};

const getTotalUsers = async () => {
    const db = await getPool();
    const [rows] = await db.query('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
};

module.exports = { createDeposit, getDeposit, updateDepositStatus, getUserTrxCount, getTotalTrx, getTotalUsers };
