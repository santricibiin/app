const { editOrSend } = require('../../utils/editMessage');
const { getPool } = require('../../database/connection');

module.exports = {
    command: 'bc',
    handler: async (ctx) => {
        const text = ctx.message.text.split(' ').slice(1).join(' ');
        const reply = ctx.message.reply_to_message;

        if (!text && !reply) return editOrSend(ctx, '❌ Format: /bc <pesan> atau reply foto/video dengan /bc <caption>');

        const db = await getPool();
        const [users] = await db.query('SELECT telegram_id FROM users');

        let success = 0, failed = 0;

        for (const user of users) {
            try {
                if (reply?.photo) {
                    const photoId = reply.photo.pop().file_id;
                    await ctx.telegram.sendPhoto(user.telegram_id, photoId, { caption: text || reply.caption || '' });
                } else if (reply?.video) {
                    await ctx.telegram.sendVideo(user.telegram_id, reply.video.file_id, { caption: text || reply.caption || '' });
                } else if (reply?.document) {
                    await ctx.telegram.sendDocument(user.telegram_id, reply.document.file_id, { caption: text || reply.caption || '' });
                } else {
                    await ctx.telegram.sendMessage(user.telegram_id, text);
                }
                success++;
            } catch (e) {
                failed++;
            }
        }

        editOrSend(ctx, `📢 Broadcast selesai\n✅ Berhasil: ${success}\n❌ Gagal: ${failed}`);
    }
};
