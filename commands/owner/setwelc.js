const { editOrSend } = require('../../utils/editMessage');
const { setWelcome } = require('../../utils/settingsService');

module.exports = {
    command: 'setwelc',
    handler: async (ctx) => {
        const msg = ctx.message.text.split(' ').slice(1).join(' ');
        if (!msg) return editOrSend(ctx, '❌ Format: /setwelc <pesan>\n\nPlaceholder:\n{name} - Nama\n{id} - ID user\n{username} - Username\n{saldo} - Saldo\n{trx} - Trx user\n{tanggal} - Tanggal\n{rating} - Rating\n{ulasan} - Ulasan\n{trxall} - Total trx\n{alluser} - Total user\n{motiv} - Random Motivation');

        await setWelcome(msg);
        editOrSend(ctx, `✅ Welcome message diset:\n\n${msg}`);
    }
};

