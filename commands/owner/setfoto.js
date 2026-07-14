const { setPhoto } = require('../../utils/settingsService');
const { editOrSend } = require('../../utils/editMessage');

module.exports = {
    command: 'setfoto',
    handler: async (ctx) => {
        try {
            const args = ctx.message.text.split(' ')[1];

            if (args === 'off') {
                await setPhoto(false, null);
                return editOrSend(ctx, 'Foto dinonaktifkan');
            }

            if (args === 'on') {
                if (!ctx.message.reply_to_message?.photo) {
                    return editOrSend(ctx, 'Reply foto dengan /setfoto on');
                }
                const photoId = ctx.message.reply_to_message.photo.pop().file_id;
                await setPhoto(true, photoId);
                return editOrSend(ctx, 'Foto diaktifkan');
            }

            editOrSend(ctx, 'Gunakan: /setfoto on (reply foto) atau /setfoto off');
        } catch (e) {
            editOrSend(ctx, `Error: ${e.message}`);
        }
    }
};
