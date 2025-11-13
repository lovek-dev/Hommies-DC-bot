const client = require('../../index');
const config = require('../../config/config.json');

module.exports = {
    name: "messageCreate"
};

client.on('messageCreate', async (message) => {
    if (message.channel.type !== 0) return;
    if (message.author.bot) return;
    if (!message.content.startsWith(config.PREFIX)) return;
    if (!message.guild) return;
    if (!message.member) message.member = await message.guild.fetchMember(message);

    const args = message.content.slice(config.PREFIX.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd.length == 0) return;

    let command = client.commands.get(cmd);
    if (!command) command = client.commands.get(client.aliases.get(cmd));
    if (!command) return;

    // Owner-only restriction
    if (command.ownerOnly && !config.OWNER.includes(message.member.id)) {
        return message.reply({
            content: `**${message.member}** You can't access community owner commands.`,
        });
    }

    try {
        // Prefer .run(), but fall back to .execute() if that's what the file defines
        if (typeof command.run === 'function') {
            await command.run(client, message, args);
        } else if (typeof command.execute === 'function') {
            // Wrap to behave like prefix command
            await command.execute({
                reply: (msg) => message.reply(msg),
                user: message.author,
                channel: message.channel,
                guild: message.guild
            });
        } else {
            console.warn(`[WARN] Command '${cmd}' has no run() or execute() function.`);
        }
    } catch (err) {
        console.error(err);
        message.reply('❌ Error executing this command.');
    }
});
