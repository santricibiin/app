const { getPool } = require('../database/connection');

const isOwner = (ctx, next) => {
    if (ctx.from.id.toString() === process.env.OWNER_ID) return next();
    return ctx.reply('⛔ Akses ditolak. Hanya owner.');
};

const isAdmin = async (ctx, next) => {
    if (ctx.from.id.toString() === process.env.OWNER_ID) return next();
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM admins WHERE telegram_id = ?', [ctx.from.id]);
    if (rows.length > 0) return next();
    return ctx.reply('⛔ Akses ditolak. Hanya admin.');
};

const isUser = (ctx, next) => next();

module.exports = { isOwner, isAdmin, isUser };
