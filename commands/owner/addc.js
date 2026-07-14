const { editOrSend } = require('../../utils/editMessage');
const { addCategory } = require('../../utils/productService');

module.exports = {
    command: 'addc',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1).join(' ').trim();
        if (!args) return editOrSend(ctx, '❌ Format: /addc <nama>');
        try {
            await addCategory(args);
            editOrSend(ctx, `✅ Kategori "${args}" berhasil ditambahkan`);
        } catch (e) {
            editOrSend(ctx, `❌ Gagal: ${e.message}`);
        }
    }
};
