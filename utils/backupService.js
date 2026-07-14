const { getPool } = require('../database/connection');
const { editOrSend } = require('./editMessage');

let backupInterval = null;

const parseInterval = (str) => {
    if (!str) return null;
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const [, num, unit] = match;
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(num) * multipliers[unit];
};

const performBackup = async (target, chatId = null) => {
    try {
        const db = await getPool();
        const dbName = process.env.DB_NAME;
        const [tables] = await db.query('SHOW TABLES');
        let sql = `-- Backup ${dbName}\n-- Date: ${new Date().toISOString()}\n\n`;

        for (const row of tables) {
            const tableName = Object.values(row)[0];
            const [[createTable]] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
            sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            sql += createTable['Create Table'] + ';\n\n';

            const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
            if (rows.length > 0) {
                for (const r of rows) {
                    const vals = Object.values(r).map(v => {
                        if (v === null) return 'NULL';
                        if (typeof v === 'number') return v;
                        if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        return `'${String(v).replace(/'/g, "''").replace(/\\/g, '\\\\').replace(/\n/g, '\\n')}'`;
                    }).join(', ');
                    sql += `INSERT INTO \`${tableName}\` VALUES (${vals});\n`;
                }
                sql += '\n';
            }
        }

        const fileName = `backup_${Date.now()}.sql`;
        const file = { source: Buffer.from(sql), filename: fileName };
        const caption = { caption: '💾 Backup SQL' };

        if (target.replyWithDocument) {
            await target.replyWithDocument(file, caption);
        } else if (chatId) {
            const api = target.telegram || target;
            await api.sendDocument(chatId, file, caption);
        }
    } catch (e) {
        console.error('Backup error:', e);
        if (target.reply) target.reply(`❌ Backup failed: ${e.message}`);
    }
};

const startBackupService = async (bot) => {
    const db = await getPool();
    const [rows] = await db.query('SELECT backup_interval FROM settings WHERE id = 1');
    if (rows.length && rows[0].backup_interval) {
        const intervalStr = rows[0].backup_interval;
        const ms = parseInterval(intervalStr);
        if (ms) {
            if (backupInterval) clearInterval(backupInterval);
            backupInterval = setInterval(() => performBackup(bot, process.env.OWNER_ID), ms);
            console.log(`BC: ${intervalStr}`);
        }
    }
};

const setBackupInterval = async (bot, str) => {
    const ms = parseInterval(str);
    if (!ms) throw new Error('Invalid format');

    const db = await getPool();
    await db.query('UPDATE settings SET backup_interval = ? WHERE id = 1', [str]);

    if (backupInterval) clearInterval(backupInterval);
    backupInterval = setInterval(() => performBackup(bot, process.env.OWNER_ID), ms);
};

const stopBackupInterval = async () => {
    if (backupInterval) {
        clearInterval(backupInterval);
        backupInterval = null;
    }
    const db = await getPool();
    await db.query('UPDATE settings SET backup_interval = NULL WHERE id = 1');
};

module.exports = { performBackup, startBackupService, setBackupInterval, stopBackupInterval };
