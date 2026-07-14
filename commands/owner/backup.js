const { performBackup, setBackupInterval, stopBackupInterval } = require('../../utils/backupService');
const { editOrSend } = require('../../utils/editMessage');

module.exports = {
    command: 'backup',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1).join(' ').trim();

        if (args === 'now') {
            await editOrSend(ctx, '⏳ Creating backup...');
            await performBackup(ctx);
            return;
        }

        if (args === 'off') {
            await stopBackupInterval();
            return editOrSend(ctx, '✅ Backup otomatis dinonaktifkan');
        }

        try {
            await setBackupInterval(ctx.telegram, args);
            editOrSend(ctx, `✅ Backup otomatis diset: ${args}`);
        } catch (e) {
            editOrSend(ctx, '❌ Format salah. Gunakan: now, off, atau 1h/1d');
        }
    }
};
