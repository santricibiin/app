const { getPool } = require('../database/connection');

const getUserByTelegramId = async (telegramId) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
    return rows[0];
};

const getSaldo = async (telegramId) => {
    const user = await getUserByTelegramId(telegramId);
    return user?.saldo || 0;
};

const updateSaldo = async (telegramId, amount) => {
    const db = await getPool();
    await db.query('UPDATE users SET saldo = saldo + ? WHERE telegram_id = ?', [amount, telegramId]);
};

const setSaldo = async (telegramId, amount) => {
    const db = await getPool();
    await db.query('UPDATE users SET saldo = ? WHERE telegram_id = ?', [amount, telegramId]);
};

module.exports = { getUserByTelegramId, getSaldo, updateSaldo, setSaldo };
