const { editOrSend } = require('../../utils/editMessage');
const { getPool } = require('../../database/connection');

module.exports = {
    command: 'setpakasir',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 2) return editOrSend(ctx, '❌ Format: /setpakasir <slug> <apikey>');

        const [slug, apikey] = args;
        const db = await getPool();
        await db.query('UPDATE settings SET pakasir_slug = ?, pakasir_apikey = ? WHERE id = 1', [slug, apikey]);

        editOrSend(ctx, `✅ Pakasir berhasil diset\n\n🏷 Slug: ${slug}\n🔑 API Key: ${apikey.substring(0, 10)}...`);
    }
};
