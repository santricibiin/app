const { getSession, setSession, pushHistory, popHistory } = require('./sessionService');
const { getSettings } = require('./settingsService');
const font = require('./font');
const { Markup } = require('telegraf');

const MAX_CAPTION_LENGTH = 1024;
const backEmojis = ['🔙', '⬅️', '↩️', '◀️', '🔄', '⏪', '🔃'];
const randomEmoji = () => backEmojis[Math.floor(Math.random() * backEmojis.length)];

const backButton = () => Markup.inlineKeyboard([
    [Markup.button.callback(`${randomEmoji()} `, 'back_history')]
]);

const isCaptionTooLong = (text) => text.length > MAX_CAPTION_LENGTH;

const editOrSend = async (ctx, text, extra = {}) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const session = getSession(userId);
    const settings = await getSettings();
    const formattedText = font.convert(text);
    const textTooLong = isCaptionTooLong(formattedText);

    if (session && session.currentText) {
        pushHistory(userId, session.currentText);
    }
    setSession(userId, { currentText: text });

    const opts = { ...extra, ...backButton() };

    try {
        try {
            await ctx.deleteMessage(ctx.message.message_id);
        } catch (e) { }

        if (session && session.messageId) {
            if (session.hasPhoto && !textTooLong) {
                await ctx.telegram.editMessageCaption(chatId, session.messageId, null, formattedText, opts);
            } else if (session.hasPhoto && textTooLong) {
                try { await ctx.telegram.deleteMessage(chatId, session.messageId); } catch (e) { }
                const sentMsg = await ctx.reply(formattedText, opts);
                setSession(userId, { messageId: sentMsg.message_id, hasPhoto: false, currentText: text });
            } else {
                await ctx.telegram.editMessageText(chatId, session.messageId, null, formattedText, opts);
            }
        } else {
            let sentMsg;
            if (settings.photo_enabled && settings.photo_id && !textTooLong) {
                sentMsg = await ctx.replyWithPhoto(settings.photo_id, { caption: formattedText, ...opts });
                setSession(userId, { messageId: sentMsg.message_id, hasPhoto: true, currentText: text });
            } else {
                sentMsg = await ctx.reply(formattedText, opts);
                setSession(userId, { messageId: sentMsg.message_id, hasPhoto: false, currentText: text });
            }
        }
    } catch (e) {
        let sentMsg;
        if (settings.photo_enabled && settings.photo_id && !textTooLong) {
            sentMsg = await ctx.replyWithPhoto(settings.photo_id, { caption: formattedText, ...opts });
            setSession(userId, { messageId: sentMsg.message_id, hasPhoto: true, currentText: text });
        } else {
            sentMsg = await ctx.reply(formattedText, opts);
            setSession(userId, { messageId: sentMsg.message_id, hasPhoto: false, currentText: text });
        }
    }
};

const sendStart = async (ctx, text, extra = {}, effectId = null) => {
    const userId = ctx.from.id;
    const settings = await getSettings();
    const formattedText = font.convert(text);

    setSession(userId, { currentText: text, history: [] });

    const opts = { ...extra };
    if (effectId) opts.message_effect_id = effectId;

    let sentMsg;
    if (settings.photo_enabled && settings.photo_id) {
        sentMsg = await ctx.replyWithPhoto(settings.photo_id, { caption: formattedText, ...opts });
        setSession(userId, { messageId: sentMsg.message_id, hasPhoto: true, currentText: text });
    } else {
        sentMsg = await ctx.reply(formattedText, opts);
        setSession(userId, { messageId: sentMsg.message_id, hasPhoto: false, currentText: text });
    }

    return sentMsg;
};

const goBack = async (ctx) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const session = getSession(userId);
    const prevText = popHistory(userId);

    if (!prevText) {
        return ctx.answerCbQuery('Tidak ada history').catch(() => { });
    }

    const formattedText = font.convert(prevText);
    setSession(userId, { currentText: prevText });

    const currentSession = getSession(userId);
    const history = currentSession.history || [];
    const opts = history.length > 0 ? backButton() : {};

    try {
        if (session.hasPhoto) {
            await ctx.telegram.editMessageCaption(chatId, session.messageId, null, formattedText, opts);
        } else {
            await ctx.telegram.editMessageText(chatId, session.messageId, null, formattedText, opts);
        }
        await ctx.answerCbQuery().catch(() => { });
    } catch (e) {
        await ctx.answerCbQuery('Gagal kembali').catch(() => { });
    }
};

module.exports = { editOrSend, sendStart, goBack };
