const { Markup } = require('telegraf');
const { getSaldo } = require('../../utils/saldoService');
const { getSession, setSession } = require('../../utils/sessionService');
const { getSettings } = require('../../utils/settingsService');
const font = require('../../utils/font');

const formatPrice = (p) => p.toLocaleString('id-ID');

const editMsg = async (ctx, text, markup = {}) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const session = getSession(userId);
    const formattedText = font.convert(text);

    try {
        if (session?.hasPhoto) {
            await ctx.telegram.editMessageCaption(chatId, session.messageId, null, formattedText, markup);
        } else {
            await ctx.telegram.editMessageText(chatId, session.messageId, null, formattedText, markup);
        }
    } catch (e) { }
};

const showSaldo = async (ctx) => {
    const saldo = await getSaldo(ctx.from.id);

    let msg = `💰 𝐒𝐀𝐋𝐃𝐎 𝐊𝐀𝐌𝐔\n\n`;
    msg += `📋 Info\n`;
    msg += `└ ID: ${ctx.from.id}\n`;
    msg += `└ Username: ${ctx.from.username ? `@${ctx.from.username}` : '-'}\n`;
    msg += `└ Saldo: Rp ${formatPrice(saldo)}\n\n`;
    msg += `💳 Pilih nominal deposit`;

    const buttons = [
        [Markup.button.callback('Rp 500', 'dep_500'), Markup.button.callback('Rp 5.000', 'dep_5000')],
        [Markup.button.callback('Rp 10.000', 'dep_10000'), Markup.button.callback('Rp 20.000', 'dep_20000')],
        [Markup.button.callback('Rp 50.000', 'dep_50000'), Markup.button.callback('Rp 100.000', 'dep_100000')],
        [Markup.button.callback('🔙', 'back_history')]
    ];

    await editMsg(ctx, msg, Markup.inlineKeyboard(buttons));
};

module.exports = {
    command: 'saldo',
    handler: async (ctx) => {
        try { await ctx.deleteMessage(ctx.message.message_id); } catch (e) { }
        await showSaldo(ctx);
    },
    showSaldo
};
