const { editOrSend } = require('../../utils/editMessage');
const { getStocksByProductId, getProductByCode } = require('../../utils/productService');

module.exports = {
    command: 'liststok',
    handler: async (ctx) => {
        const code = ctx.message.text.split(' ')[1];
        if (!code) return editOrSend(ctx, '❌ Format: /liststok <code>');

        try {
            const prd = await getProductByCode(code);
            if (!prd) return editOrSend(ctx, `❌ Produk "${code}" tidak ditemukan`);

            const stocks = await getStocksByProductId(prd.id);
            if (stocks.length === 0) return editOrSend(ctx, `📜 Stok "${prd.name}" kosong`);

            let msg = `📜 Stok "${prd.name}" (${stocks.length}):\n\n`;
            stocks.forEach((s, i) => {
                msg += `${i + 1}. ${s.data}\n`;
            });
            editOrSend(ctx, msg);
        } catch (e) {
            editOrSend(ctx, `❌ Gagal: ${e.message}`);
        }
    }
};
