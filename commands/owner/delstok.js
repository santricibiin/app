const { editOrSend } = require('../../utils/editMessage');
const { deleteStock, getProductByCode, getStocksByProductId } = require('../../utils/productService');

module.exports = {
    command: 'delstok',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 2) return editOrSend(ctx, '❌ Format: /delstok <code> all/jumlah/stok');

        const [code, mode] = args;
        try {
            const prd = await getProductByCode(code);
            if (!prd) return editOrSend(ctx, `❌ Produk "${code}" tidak ditemukan`);

            const before = await getStocksByProductId(prd.id);
            await deleteStock(prd.id, mode);
            const after = await getStocksByProductId(prd.id);

            const deleted = before.length - after.length;
            editOrSend(ctx, `⌫ ${deleted} stok dihapus dari "${prd.name}". Sisa: ${after.length}`);
        } catch (e) {
            editOrSend(ctx, `❌ Gagal: ${e.message}`);
        }
    }
};
