const { getPool } = require('../database/connection');

const getSettings = async () => {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM settings WHERE id = 1');
    return rows[0] || { photo_enabled: false, photo_id: null, welcome_message: null, rating: 5.0, reviews: 0, trxall: 0, alluser: 0 };
};

const setPhoto = async (enabled, photoId = null) => {
    const db = await getPool();
    await db.query('UPDATE settings SET photo_enabled = ?, photo_id = ? WHERE id = 1', [enabled, photoId]);
};

const setWelcome = async (message) => {
    const db = await getPool();
    await db.query('UPDATE settings SET welcome_message = ? WHERE id = 1', [message]);
};

const setRating = async (rating, reviews, trxall, alluser) => {
    const db = await getPool();
    await db.query('UPDATE settings SET rating = ?, reviews = ?, trxall = ?, alluser = ? WHERE id = 1', [rating, reviews, trxall, alluser]);
};

module.exports = { getSettings, setPhoto, setWelcome, setRating };


