const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'active',
    description: 'Replies with a message to activate the Active Developer badge!',

    data: new SlashCommandBuilder()
        .setName('active')
        .setDescription('Replies with a message to activate the Active Developer badge!'),

    async execute(interaction) {
        await interaction.reply('✅ You just used the `/active` command! This can qualify you for the Active Developer badge.');
    },

    async run(client, message, args) {
        await message.reply('✅ You just used the `+active` command! This can qualify you for the Active Developer badge.');
    }
};

