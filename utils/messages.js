const { getRandom } = require('./motivation');
const { getSettings } = require('./settingsService');

const formatPrice = (p) => p.toLocaleString('id-ID');

const ownerPanel = () => `
🌟━━━━━━━━━━━━━━━━🌟
      ✨ 𝐎𝐖𝐍𝐄𝐑 𝐏𝐀𝐍𝐄𝐋 ✨
🌟━━━━━━━━━━━━━━━━🌟

� "${getRandom()}"

⚡ 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦
┃ 🖼 /setfoto ┃ 🔤 /font
┃ 🏓 /ping ┃ 💾 /backup

📣 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧
┃ 📢 /bc ┃ 💬 /setwelc ┃ ⭐ /setrat

🛒 𝗣𝗥𝗢𝗗𝗨𝗞
┃ 🗂 /addc • /delc
┃ 📦 /addprd • /editprd
┃ 📋 /addstok • /liststok • /delstok

🔮━━━━━━━━━━━━━━━━🔮`;

const notifyOwner = async (bot, message) => {
    try { await bot.telegram.sendMessage(process.env.OWNER_ID, message); } catch (e) { }
};

const welcome = async (ctx) => {
    const settings = await getSettings();
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const { getSaldo } = require('./saldoService');
    const { getUserTrxCount, getTotalTrx, getTotalUsers } = require('./depositService');

    if (!settings.welcome_message) return 'Selamat datang!';

    const saldo = await getSaldo(ctx.from.id);
    const trx = await getUserTrxCount(ctx.from.id);
    const trxall = settings.trxall || await getTotalTrx();
    const alluser = settings.alluser || await getTotalUsers();

    return settings.welcome_message
        .replace(/{name}/g, ctx.from.first_name || 'User')
        .replace(/{tanggal}/g, date)
        .replace(/{rating}/g, settings.rating || '5.0')
        .replace(/{ulasan}/g, settings.reviews || '0')
        .replace(/{saldo}/g, saldo.toLocaleString('id-ID'))
        .replace(/{id}/g, ctx.from.id)
        .replace(/{username}/g, ctx.from.username ? `@${ctx.from.username}` : '-')
        .replace(/{trx}/g, trx)
        .replace(/{trxall}/g, trxall.toLocaleString('id-ID'))
        .replace(/{alluser}/g, alluser.toLocaleString('id-ID'))
        .replace(/{motiv}/g, getRandom());
};

const purchaseSuccess = (product, qty, total, method) => {
    let msg = `✅ 𝐏𝐄𝐌𝐁𝐄𝐋𝐈𝐀𝐍 𝐁𝐄𝐑𝐇𝐀𝐒𝐈𝐋\n\n`;
    msg += `📦 Produk\n`;
    msg += `└ ${product.name}\n\n`;
    msg += `📋 Detail\n`;
    msg += `└ Qty: ${qty}\n`;
    msg += `└ Total: Rp ${formatPrice(total)}\n`;
    msg += `└ Metode: ${method}`;
    return msg;
};

module.exports = { ownerPanel, welcome, purchaseSuccess, notifyOwner };



