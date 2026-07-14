const { editOrSend } = require('../../utils/editMessage');
const { deleteCategory } = require('../../utils/productService');

module.exports = {
    command: 'delc',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1).join(' ').trim();
        if (!args) return editOrSend(ctx, '❌ Format: /delc <nama>');
        try {
            const deleted = await deleteCategory(args);
            if (deleted) {
                editOrSend(ctx, `🗑 Kategori "${args}" berhasil dihapus`);
            } else {
                editOrSend(ctx, `❌ Kategori "${args}" tidak ditemukan`);
            }
        } catch (e) {
            editOrSend(ctx, `❌ Gagal: ${e.message}`);
        }
    }
};
