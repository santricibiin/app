const { editOrSend } = require('../../utils/editMessage');

module.exports = {
    command: 'ping',
    handler: async (ctx) => editOrSend(ctx, 'Pong!')
};
