require('./console/watermark');
const { Client, Partials, Collection, REST, Routes } = require('discord.js');
const colors = require('colors');
const config = require('./config/config.json');
const path = require('path');
const fs = require('fs');
const ms = require('ms');

// Create Discord client
const client = new Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "GuildPresences",
    "GuildMessageReactions",
    "DirectMessages",
    "MessageContent",
    "GuildVoiceStates",
    "GuildMembers",
    "DirectMessageTyping"
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
});

client.config = config;
client.commands = new Collection();
client.events = new Collection();
client.aliases = new Collection();

module.exports = client;

// Handlers
["command", "event"].forEach(file => {
  require(`./handlers/${file}`)(client);
});

// Web server for Replit uptime
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("✅ Bot is alive and running!"));
app.listen(5000, () => console.log("🌐 Web server running on port 5000"));

// Anti-crash / auto restart if bot disconnects
setInterval(() => {
  if (!client || !client.user) {
    console.log("Client not logged in, process killing...");
    process.kill(1);
  }
}, ms("1m"));

process.on("unhandledRejection", async (err) => {
  console.log(`[ANTI-CRASH] Unhandled Rejection: ${err}`.red.bold);
  console.log(err);
});

// LOGIN BOT
console.log("🔑 TOKEN loaded:", process.env.TOKEN ? "Yes" : "No");
client.login(process.env.TOKEN)
  .catch(err => {
    console.log("[CRUSH] Something went wrong while connecting to your bot\n");
    console.log("[CRUSH] Error from DiscordAPI :" + err);
    process.exit();
  });

// ✅ Register slash commands *after* bot is ready
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Load commands
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  const commands = [];

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }

  // Register slash commands globally
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('🔄 Refreshing slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

// ✅ Slash command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '❌ There was an error executing this command!',
      ephemeral: true
    });
  }
});

