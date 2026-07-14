const font = require('../../utils/font');
const { editOrSend } = require('../../utils/editMessage');

module.exports = {
    command: 'font',
    handler: async (ctx) => {
        const args = ctx.message.text.split(' ')[1];
        if (args === 'on') {
            font.setFont(true);
            return editOrSend(ctx, 'Font aktif');
        }
        if (args === 'off') {
            font.setFont(false);
            return editOrSend(ctx, 'Font nonaktif');
        }
        return editOrSend(ctx, 'Gunakan: /font on atau /font off');
    }
};
