const { Markup } = require('telegraf');
const { getAllCategories, getCategoryById, getProductsByCategoryId, getProductById, getStockCount } = require('../../utils/productService');
const { getSaldo } = require('../../utils/saldoService');
const { getSession, setSession } = require('../../utils/sessionService');
const { getSettings } = require('../../utils/settingsService');
const font = require('../../utils/font');

const formatPrice = (price) => price.toLocaleString('id-ID');

const editMsg = async (ctx, text, markup = {}) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const session = getSession(userId);
    const settings = await getSettings();
    const formattedText = font.convert(text);

    try {
        if (session?.hasPhoto) {
            await ctx.telegram.editMessageCaption(chatId, session.messageId, null, formattedText, markup);
        } else {
            await ctx.telegram.editMessageText(chatId, session.messageId, null, formattedText, markup);
        }
    } catch (e) { }
};

const showCategories = async (ctx) => {
    const categories = await getAllCategories();
    if (categories.length === 0) {
        return editMsg(ctx, '❌ Belum ada kategori');
    }

    let msg = `🏪 𝐊𝐀𝐓𝐄𝐆𝐎𝐑𝐈\n\n`;
    categories.forEach((cat, i) => {
        msg += `${i + 1}. ${cat.name}\n`;
    });
    msg += `\n📌 Pilih nomor kategori`;

    const buttons = [];
    const row = [];
    categories.forEach((cat, i) => {
        row.push(Markup.button.callback(`${i + 1}`, `cat_${cat.id}`));
        if (row.length === 5 || i === categories.length - 1) {
            buttons.push([...row]);
            row.length = 0;
        }
    });
    buttons.push([Markup.button.callback('🔙', 'back_history')]);

    await editMsg(ctx, msg, Markup.inlineKeyboard(buttons));
};

const showProducts = async (ctx, categoryId) => {
    const category = await getCategoryById(categoryId);
    const products = await getProductsByCategoryId(categoryId);

    if (products.length === 0) {
        return editMsg(ctx, `❌ Kategori "${category.name}" kosong`, Markup.inlineKeyboard([
            [Markup.button.callback('🔙', 'show_categories')]
        ]));
    }

    let msg = `📦 ${category.name}\n\n`;
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const stock = await getStockCount(p.id);
        msg += `${i + 1}. ${p.name}\n`;
        msg += `└ Rp ${formatPrice(p.price)} • Stok: ${stock}\n\n`;
    }
    msg += `📌 Pilih nomor produk`;

    const buttons = [];
    const row = [];
    products.forEach((p, i) => {
        row.push(Markup.button.callback(`${i + 1}`, `prd_${p.id}`));
        if (row.length === 5 || i === products.length - 1) {
            buttons.push([...row]);
            row.length = 0;
        }
    });
    buttons.push([Markup.button.callback('🔙', 'show_categories')]);

    await editMsg(ctx, msg, Markup.inlineKeyboard(buttons));
};

const showProductDetail = async (ctx, productId, qty = 1) => {
    const product = await getProductById(productId);
    const stock = await getStockCount(productId);
    const saldo = await getSaldo(ctx.from.id);
    const total = product.price * qty;

    setSession(ctx.from.id, { productId, qty });

    let msg = `🛒 ${product.name}\n\n`;
    msg += `📋 Info\n`;
    msg += `└ Harga: Rp ${formatPrice(product.price)}\n`;
    msg += `└ Stok: ${stock}\n`;
    msg += `└ Desk: ${product.description || '-'}\n\n`;
    msg += `🛍 Order\n`;
    msg += `└ Qty: ${qty}\n`;
    msg += `└ Total: Rp ${formatPrice(total)}\n`;
    msg += `└ Saldo: Rp ${formatPrice(saldo)}`;

    const buttons = [
        [
            Markup.button.callback('➖', `qty_dec_${productId}`),
            Markup.button.callback('✏️', `qty_edit_${productId}`),
            Markup.button.callback('➕', `qty_inc_${productId}`)
        ],
        [
            Markup.button.callback('💳 Saldo', `buy_saldo_${productId}`),
            Markup.button.callback('💵 QRIS', `buy_qris_${productId}`)
        ],
        [Markup.button.callback('🔙', `cat_${product.category_id}`)]
    ];

    await editMsg(ctx, msg, Markup.inlineKeyboard(buttons));
};

module.exports = {
    command: 'produk',
    handler: async (ctx) => {
        try { await ctx.deleteMessage(ctx.message.message_id); } catch (e) { }
        await showCategories(ctx);
        await ctx.answerCbQuery?.().catch(() => { });
    },
    showCategories,
    showProducts,
    showProductDetail
};
