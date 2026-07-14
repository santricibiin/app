const { editOrSend } = require('../../utils/editMessage');
const { addStock, getProductByCode } = require('../../utils/productService');

module.exports = {
    command: 'addstok',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 2) return editOrSend(ctx, '❌ Format: /addstok <code> <stok1> <stok2>...');

        const [code, ...stocks] = args;
        try {
            const prd = await getProductByCode(code);
            if (!prd) return editOrSend(ctx, `❌ Produk "${code}" tidak ditemukan`);

            for (const stok of stocks) {
                await addStock(prd.id, stok);
            }
            editOrSend(ctx, `📋 ${stocks.length} stok berhasil ditambahkan ke "${prd.name}"`);
        } catch (e) {
            editOrSend(ctx, `❌ Gagal: ${e.message}`);
        }
    }
};
