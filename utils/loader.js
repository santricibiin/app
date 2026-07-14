const fs = require('fs');
const path = require('path');

const loadCommands = (bot, folder, middleware) => {
    const dir = path.join(__dirname, '..', 'commands', folder);
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(file => {
        const cmd = require(path.join(dir, file));
        if (cmd.command && cmd.handler) {
            bot.command(cmd.command, middleware, cmd.handler);
        }
    });
};

module.exports = { loadCommands };
