const { editOrSend } = require('../../utils/editMessage');
const { setRating } = require('../../utils/settingsService');

module.exports = {
    command: 'setrat',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 4) return editOrSend(ctx, '❌ Format: /setrat <rating> <ulasan> <trxall> <alluser>\nContoh: /setrat 4.5 129 100000 200');

        const [rating, reviews, trxall, alluser] = args;
        const r = parseFloat(rating);
        const rev = parseInt(reviews);
        const trx = parseInt(trxall);
        const users = parseInt(alluser);

        if (isNaN(r) || r < 0 || r > 5) return editOrSend(ctx, '❌ Rating harus 0-5');
        if (isNaN(rev) || rev < 0) return editOrSend(ctx, '❌ Ulasan harus angka positif');
        if (isNaN(trx) || trx < 0) return editOrSend(ctx, '❌ Trxall harus angka positif');
        if (isNaN(users) || users < 0) return editOrSend(ctx, '❌ Alluser harus angka positif');

        await setRating(r, rev, trx, users);
        editOrSend(ctx, `⭐ Rating: ${r}\n💬 Ulasan: ${rev}\n📊 TrxAll: ${trx}\n👥 AllUser: ${users}`);
    }
};

