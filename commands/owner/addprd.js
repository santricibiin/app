const { editOrSend } = require('../../utils/editMessage');
const { addProduct, getCategoryByName } = require('../../utils/productService');

module.exports = {
    command: 'addprd',
    handler: async (ctx) => {
        const text = ctx.message.text;
        const match = text.match(/\/addprd\s+(\S+)\s+(\S+)\s+"([^"]+)"\s+(\d+)\s+(.+?)(?:\s+\|snk\s+(.+))?$/i);
        if (!match) return editOrSend(ctx, '❌ Format: /addprd <kategori> <code> "<nama>" <harga> <desk> |snk <snk>');

        const [, catName, code, name, price, desc, snk] = match;
        try {
            const cat = await getCategoryByName(catName);
            if (!cat) return editOrSend(ctx, `❌ Kategori "${catName}" tidak ditemukan`);

            await addProduct(cat.id, code, name, parseInt(price), desc, snk || null);
            editOrSend(ctx, `📦 Produk "${name}" [${code}] berhasil ditambahkan ke ${catName}`);
        } catch (e) {
            editOrSend(ctx, `❌ Gagal: ${e.message}`);
        }
    }
};
