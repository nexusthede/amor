const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");

const config = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

// load commands
const commandFiles = fs.readdirSync("./commands");

for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);
    if (cmd.name) client.commands.set(cmd.name, cmd);
}

// PREFIX HANDLER (CONFIG FIXED)
client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const name = args.shift().toLowerCase();

    const command = client.commands.get(name);
    if (!command) return;

    try {
        command.execute(client, message, args, config);
    } catch (err) {
        console.log(err);
    }
});

mongoose.connect(process.env.MONGO);

client.on("messageCreate", require("./events/messageCreate"));
client.on("voiceStateUpdate", require("./events/voiceStateUpdate"));
client.once("ready", require("./events/ready"));

client.login(process.env.TOKEN);
