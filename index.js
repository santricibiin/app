require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { isOwner, isAdmin, isUser } = require('./middleware/role');
const { loadCommands } = require('./utils/loader');
const { migrate } = require('./database/migrate');
const { registerUser } = require('./utils/userService');
const { ownerPanel, welcome, notifyOwner } = require('./utils/messages');
const { sendStart, goBack } = require('./utils/editMessage');
const { getSession, setSession } = require('./utils/sessionService');
const { getProductById, getStockCount, takeStock } = require('./utils/productService');
const { getSaldo, updateSaldo } = require('./utils/saldoService');
const { createDeposit, getDeposit, updateDepositStatus } = require('./utils/depositService');
const { createQrisPayment, generateOrderId } = require('./utils/pakasirService');
const font = require('./utils/font');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.catch(() => { });

loadCommands(bot, 'owner', isOwner);
loadCommands(bot, 'admin', isAdmin);
loadCommands(bot, 'user', isUser);

const produkModule = require('./commands/user/produk');
const saldoModule = require('./commands/user/saldo');

bot.action('back_history', goBack);
bot.action('show_saldo', async (ctx) => {
    await saldoModule.showSaldo(ctx);
    await ctx.answerCbQuery().catch(() => { });
});
bot.action('show_categories', async (ctx) => {
    await produkModule.showCategories(ctx);
    await ctx.answerCbQuery().catch(() => { });
});

bot.action(/^dep_(\d+)$/, async (ctx) => {
    const amount = parseInt(ctx.match[1]);
    const QRCode = require('qrcode');
    const { setQrisMessage } = require('./webhook');

    const orderId = `DEP${generateOrderId()}`;

    try {
        const payment = await createQrisPayment(orderId, amount);
        await createDeposit(orderId, ctx.from.id, amount);

        const qrBuffer = await QRCode.toBuffer(payment.payment_number, { width: 400, margin: 2 });

        const formatPrice = (p) => p.toLocaleString('id-ID');
        let msg = `💳 𝐃𝐄𝐏𝐎𝐒𝐈𝐓 𝐒𝐀𝐋𝐃𝐎\n\n`;
        msg += `📋 Detail\n`;
        msg += `└ Nominal: Rp ${formatPrice(amount)}\n`;
        msg += `└ Fee: Rp ${formatPrice(payment.fee)}\n`;
        msg += `└ Total: Rp ${formatPrice(payment.total_payment)}\n`;
        msg += `└ Order: ${orderId}\n\n`;
        msg += `⏰ Expired: ${new Date(payment.expired_at).toLocaleString('id-ID')}\n\n`;
        msg += `📱 Scan QRIS diatas untuk bayar`;

        const { getSettings } = require('./utils/settingsService');
        const settings = await getSettings();
        const paymentUrl = `https://app.pakasir.com/pay/${settings.pakasir_slug}/${payment.total_payment}?order_id=${orderId}&qris_only=1`;

        const qrisMsg = await ctx.replyWithPhoto(
            { source: qrBuffer },
            {
                caption: font.convert(msg),
                ...Markup.inlineKeyboard([
                    [Markup.button.url('💳 Bayar via Link', paymentUrl)],
                    [Markup.button.callback('🔙', 'show_saldo')]
                ])
            }
        );

        setQrisMessage(orderId, ctx.chat.id, qrisMsg.message_id);
        await ctx.answerCbQuery().catch(() => { });
    } catch (e) {
        console.error('Deposit Error:', e.message);
        await ctx.answerCbQuery(`❌ ${e.message}`).catch(() => { });
    }
});

bot.action(/^cat_(\d+)$/, async (ctx) => {
    const catId = parseInt(ctx.match[1]);
    await produkModule.showProducts(ctx, catId);
    await ctx.answerCbQuery().catch(() => { });
});

bot.action(/^prd_(\d+)$/, async (ctx) => {
    const prdId = parseInt(ctx.match[1]);
    await produkModule.showProductDetail(ctx, prdId, 1);
    await ctx.answerCbQuery().catch(() => { });
});

bot.action(/^qty_inc_(\d+)$/, async (ctx) => {
    const prdId = parseInt(ctx.match[1]);
    const session = getSession(ctx.from.id);
    const stock = await getStockCount(prdId);
    const newQty = Math.min((session?.qty || 1) + 1, stock);
    await produkModule.showProductDetail(ctx, prdId, newQty);
    await ctx.answerCbQuery().catch(() => { });
});

bot.action(/^qty_dec_(\d+)$/, async (ctx) => {
    const prdId = parseInt(ctx.match[1]);
    const session = getSession(ctx.from.id);
    const newQty = Math.max((session?.qty || 1) - 1, 1);
    await produkModule.showProductDetail(ctx, prdId, newQty);
    await ctx.answerCbQuery().catch(() => { });
});

bot.action(/^qty_edit_(\d+)$/, async (ctx) => {
    const prdId = parseInt(ctx.match[1]);
    setSession(ctx.from.id, { waitingQty: true, productId: prdId });
    await ctx.answerCbQuery('Kirim jumlah yang diinginkan').catch(() => { });
});

bot.action(/^buy_saldo_(\d+)$/, async (ctx) => {
    const prdId = parseInt(ctx.match[1]);
    const session = getSession(ctx.from.id);
    const qty = session?.qty || 1;
    const product = await getProductById(prdId);
    const total = product.price * qty;
    const saldo = await getSaldo(ctx.from.id);
    const stock = await getStockCount(prdId);

    if (qty > stock) return ctx.answerCbQuery('❌ Stok tidak cukup').catch(() => { });
    if (saldo < total) return ctx.answerCbQuery('❌ Saldo tidak cukup').catch(() => { });

    const stocks = await takeStock(prdId, qty);
    if (!stocks) return ctx.answerCbQuery('❌ Gagal mengambil stok').catch(() => { });

    await updateSaldo(ctx.from.id, -total);

    // Animated sticker before success message
    const stickerMsg = await ctx.replyWithSticker(stickers.purchase);
    await new Promise(r => setTimeout(r, 1500));
    try { await ctx.deleteMessage(stickerMsg.message_id); } catch (e) { }

    const { purchaseSuccess } = require('./utils/messages');
    await ctx.reply(font.convert(purchaseSuccess(product, qty, total, 'Saldo')), {
        message_effect_id: stickers.effects.heart
    });

    const fileContent = stocks.join('\n');
    const fileName = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    await ctx.replyWithDocument(
        { source: Buffer.from(fileContent), filename: fileName },
        { caption: '📦 Produk kamu' }
    );

    if (product.snk) await ctx.reply(font.convert(`📜 𝐒𝐍𝐊\n${product.snk}`));

    const u = ctx.from;
    const userName = u.first_name + (u.last_name ? ' ' + u.last_name : '');
    let notifMsg = `💰 𝐏𝐄𝐌𝐁𝐄𝐋𝐈𝐀𝐍 𝐒𝐀𝐋𝐃𝐎\n\n`;
    notifMsg += `👤 User\n`;
    notifMsg += `└ Nama: ${userName}\n`;
    notifMsg += `└ Username: @${u.username || '-'}\n`;
    notifMsg += `└ ID: ${u.id}\n\n`;
    notifMsg += `📦 Produk\n`;
    notifMsg += `└ ${product.name} x${qty}\n`;
    notifMsg += `└ Total: Rp ${total.toLocaleString('id-ID')}`;
    notifyOwner(bot, notifMsg);

    await produkModule.showCategories(ctx);
    await ctx.answerCbQuery('✅ Pembelian berhasil!').catch(() => { });
});

bot.action(/^buy_qris_(\d+)$/, async (ctx) => {
    const prdId = parseInt(ctx.match[1]);
    const session = getSession(ctx.from.id);
    const qty = session?.qty || 1;
    const product = await getProductById(prdId);
    const total = product.price * qty;
    const stock = await getStockCount(prdId);

    if (qty > stock) return ctx.answerCbQuery('❌ Stok tidak cukup').catch(() => { });

    await ctx.answerCbQuery('⏳ Sedang membuat invoice pembayaran...', { show_alert: false }).catch(() => { });

    const { createQrisPayment, generateOrderId } = require('./utils/pakasirService');
    const { createTransaction } = require('./utils/transactionService');
    const { getSettings } = require('./utils/settingsService');
    const { setQrisMessage } = require('./webhook');
    const QRCode = require('qrcode');

    const orderId = generateOrderId();

    try {
        const payment = await createQrisPayment(orderId, total);
        await createTransaction(orderId, ctx.from.id, prdId, qty, total);

        const settings = await getSettings();
        const paymentUrl = `https://app.pakasir.com/pay/${settings.pakasir_slug}/${payment.total_payment}?order_id=${orderId}&qris_only=1`;

        const qrBuffer = await QRCode.toBuffer(payment.payment_number, {
            width: 400,
            margin: 2
        });

        const formatPrice = (p) => p.toLocaleString('id-ID');
        let msg = `💵 𝐏𝐄𝐌𝐁𝐀𝐘𝐀𝐑𝐀𝐍 𝐐𝐑𝐈𝐒\n\n`;
        msg += `📦 Produk\n`;
        msg += `└ ${product.name}\n\n`;
        msg += `📋 Detail\n`;
        msg += `└ Qty: ${qty}\n`;
        msg += `└ Harga: Rp ${formatPrice(payment.amount)}\n`;
        msg += `└ Fee: Rp ${formatPrice(payment.fee)}\n`;
        msg += `└ Total: Rp ${formatPrice(payment.total_payment)}\n`;
        msg += `└ Order: ${payment.order_id}\n\n`;
        msg += `⏰ Expired: ${new Date(payment.expired_at).toLocaleString('id-ID')}\n\n`;
        msg += `📱 Scan QRIS diatas untuk bayar`;

        const { Markup } = require('telegraf');
        const qrisMsg = await ctx.replyWithPhoto(
            { source: qrBuffer },
            {
                caption: font.convert(msg),
                ...Markup.inlineKeyboard([
                    [Markup.button.url('💳 Bayar via Link', paymentUrl)],
                    [Markup.button.callback('🔙', 'show_categories')]
                ])
            }
        );

        setQrisMessage(orderId, ctx.chat.id, qrisMsg.message_id);
    } catch (e) {
        console.error('QRIS Error:', e.message);
        await ctx.answerCbQuery(`❌ ${e.message}`).catch(() => { });
    }
});

bot.on('text', async (ctx, next) => {
    const session = getSession(ctx.from.id);
    if (session?.waitingQty) {
        const qty = parseInt(ctx.message.text);
        if (!isNaN(qty) && qty > 0) {
            const stock = await getStockCount(session.productId);
            const finalQty = Math.min(qty, stock);
            setSession(ctx.from.id, { waitingQty: false });
            try { await ctx.deleteMessage(ctx.message.message_id); } catch (e) { }
            await produkModule.showProductDetail(ctx, session.productId, finalQty);
            return;
        }
    }
    return next();
});

const stickers = require('./stickers.json');

bot.start(async (ctx) => {
    await registerUser(ctx);
    let msgToDelete;
    try {
        msgToDelete = await ctx.replyWithSticker(stickers.welcome);
    } catch (e) {
        console.error('Sticker error:', e.message);
        msgToDelete = await ctx.reply('👋');
    }
    await new Promise(r => setTimeout(r, 1500));
    try { await ctx.deleteMessage(msgToDelete.message_id); } catch (e) { }
    const isOwnerUser = ctx.from.id.toString() === process.env.OWNER_ID;
    const msg = isOwnerUser ? ownerPanel() : await welcome(ctx);
    await sendStart(ctx, msg, {}, stickers.effects.fire);
    if (!isOwnerUser) {
        const u = ctx.from;
        const userName = u.first_name + (u.last_name ? ' ' + u.last_name : '');
        let notifMsg = `🆕 𝐀𝐊𝐒𝐄𝐒 𝐁𝐀𝐑𝐔\n\n`;
        notifMsg += `👤 User\n`;
        notifMsg += `└ Nama: ${userName}\n`;
        notifMsg += `└ Username: @${u.username || '-'}\n`;
        notifMsg += `└ ID: ${u.id}`;
        notifyOwner(bot, notifMsg);
    }
});

(async () => {
    try {
        font.log('STARTING...');
        await migrate();
        font.log('DATABASE READY');

        const { startWebhook, setBotInstance } = require('./webhook');
        const { startBackupService } = require('./utils/backupService');
        const { startWeb } = require('./web/server');

        setBotInstance(bot);
        startWebhook();
        startWeb();
        await startBackupService(bot);

        await bot.launch();
        font.log('BOT CONNECTED');
    } catch (e) {
        font.log(`ERROR: ${e.message}`);
    }
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
