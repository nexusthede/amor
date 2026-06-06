const {
    Client,
    GatewayIntentBits,
    Collection,
    DefaultWebSocketManagerOptions
} = require("discord.js");

const mongoose = require("mongoose");
const fs = require("fs");
const express = require("express");

const config = require("./config");

// Mobile Status
DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord Android";

// =========================
// GUILD WHITELIST (YOUR SERVER ONLY)
// =========================
const ALLOWED_GUILD = "1449708401050259457";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

// =========================
// EXPRESS UPTIME SERVER
// =========================
const app = express();

app.get("/", (req, res) => {
    res.status(200).send("Bot Online");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Uptime server running on port ${PORT}`);
});

// =========================
// LOAD COMMANDS
// =========================
const commandFiles = fs.readdirSync("./commands");

for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);
    if (cmd.name) client.commands.set(cmd.name, cmd);
}

// =========================
// PREFIX HANDLER
// =========================
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

// =========================
// GUILD ANTI-INVITE / WHITELIST GUARD
// =========================
client.on("guildCreate", async (guild) => {
    if (guild.id === ALLOWED_GUILD) return;

    try {
        const owner = await guild.fetchOwner();

        await owner.send(
            `🚫 This bot is private.\n\nYour server **${guild.name}** is not authorized.\nThe bot will now leave.`
        ).catch(() => null);
    } catch {}

    setTimeout(() => {
        guild.leave().catch(() => null);
    }, 5000);
});

// =========================
// MONGO DB
// =========================
mongoose.connect(process.env.MONGO)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// =========================
// EVENTS
// =========================
client.on("messageCreate", require("./events/messageCreate"));
client.on("voiceStateUpdate", require("./events/voiceStateUpdate"));
client.once("ready", require("./events/ready"));

// =========================
// WEEKLY RESET
// =========================
require("./events/weeklyReset")(client);

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
