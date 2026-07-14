const { getPool } = require('../database/connection');

const registerUser = async (ctx) => {
    const db = await getPool();
    const userId = ctx.from.id;
    const username = ctx.from.username || '';

    await db.query(
        'INSERT INTO users (telegram_id, username) VALUES (?, ?) ON DUPLICATE KEY UPDATE username = ?',
        [userId, username, username]
    );
};

const getUser = async (userId) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM users WHERE telegram_id = ?', [userId]);
    return rows[0] || null;
};

module.exports = { registerUser, getUser };
