const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getPool } = require('../database/connection');

const migrateUsers = async () => {
    try {
        console.log('Starting migration...');
        const jsonPath = path.join(__dirname, '../users.json');

        if (!fs.existsSync(jsonPath)) {
            console.error('❌ users.json not found');
            return;
        }

        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(rawData);
        const users = data.users;

        if (!users) {
            console.error('❌ No users key found in JSON');
            return;
        }

        const db = await getPool();
        let count = 0;
        let skipped = 0;

        for (const key in users) {
            const user = users[key];
            if (!user.id) continue;

            const [result] = await db.query(
                'INSERT IGNORE INTO users (telegram_id, username, saldo) VALUES (?, ?, ?)',
                [user.id, user.username || null, 0]
            );

            if (result.affectedRows > 0) {
                count++;
            } else {
                skipped++;
            }
        }

        console.log(`✅ Migration completed!`);
        console.log(`📥 Imported: ${count}`);
        console.log(`⏭️ Skipped (already exists): ${skipped}`);

        process.exit(0);
    } catch (e) {
        console.error('❌ Migration error:', e);
        process.exit(1);
    }
};

migrateUsers();
