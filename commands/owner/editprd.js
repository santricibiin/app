const { editOrSend } = require('../../utils/editMessage');
const { updateProduct, getProductByCode } = require('../../utils/productService');

module.exports = {
    command: 'editprd',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 3) return editOrSend(ctx, '❌ Format: /editprd <code> <field> <value>\nField: name, price, description, snk');

        const [code, field, ...valueParts] = args;
        const value = valueParts.join(' ');

        try {
            const prd = await getProductByCode(code);
            if (!prd) return editOrSend(ctx, `❌ Produk "${code}" tidak ditemukan`);

            const updated = await updateProduct(code, field, value);
            if (updated) {
                editOrSend(ctx, `✏️ ${field} produk "${code}" diubah ke: ${value}`);
            } else {
                editOrSend(ctx, `❌ Field tidak valid. Gunakan: name, price, description, snk`);
            }
        } catch (e) {
            editOrSend(ctx, `❌ Gagal: ${e.message}`);
        }
    }
};
