const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const express = require("express");

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

// Better Stack / Uptime endpoint
const app = express();

app.get("/", (req, res) => {
    res.status(200).send("Bot Online");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Uptime server running on port ${PORT}`);
});

// Load commands
const commandFiles = fs.readdirSync("./commands");

for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);
    if (cmd.name) client.commands.set(cmd.name, cmd);
}

// Prefix handler
client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content
        .slice(config.prefix.length)
        .trim()
        .split(/ +/);

    const name = args.shift().toLowerCase();

    const command = client.commands.get(name);
    if (!command) return;

    try {
        command.execute(client, message, args, config);
    } catch (err) {
        console.error(err);
    }
});

// MongoDB
mongoose.connect(process.env.MONGO)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// Events
client.on("messageCreate", require("./events/messageCreate"));
client.on("voiceStateUpdate", require("./events/voiceStateUpdate"));
client.once("ready", require("./events/ready"));

// Login
client.login(process.env.TOKEN);
