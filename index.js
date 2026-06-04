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

// =========================
// EXPRESS UPTIME SERVER
// =========================
const app = express();

app.get("/", (req, res) => res.send("Bot Online"));

app.listen(process.env.PORT || 3000, () => {
    console.log("Uptime server running");
});

// =========================
// COMMANDS
// =========================
for (const file of fs.readdirSync("./commands")) {
    const cmd = require(`./commands/${file}`);
    if (cmd?.name) client.commands.set(cmd.name, cmd);
}

// =========================
// PREFIX COMMAND HANDLER
// =========================
client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const name = args.shift().toLowerCase();

    const command = client.commands.get(name);
    if (!command) return;

    try {
        await command.execute(client, message, args, config);
    } catch (err) {
        console.error("Command error:", err);
    }
});

// =========================
// GUILD WHITELIST AUTO-LEAVE (SAFE)
// =========================
const allowedGuilds = require("./config/allowedGuilds");

client.on("guildCreate", async (guild) => {
    try {
        console.log(`Joined guild: ${guild.name} (${guild.id})`);

        if (allowedGuilds.includes(guild.id)) {
            console.log("Allowed guild - staying");
            return;
        }

        // find safe channel
        let channel = guild.systemChannel;

        if (!channel) {
            channel = guild.channels.cache.find(c =>
                c?.isTextBased?.() &&
                c.permissionsFor(guild.members.me)?.has("SendMessages")
            );
        }

        if (channel) {
            await channel.send(
                "⚠️ This bot is restricted.\nYou need permission from Nexus.\nInvite: https://discord.gg/8DqrNJ3wJM"
            ).catch(() => {});
        }

        setTimeout(() => {
            guild.leave().catch(() => {});
        }, 1500);

    } catch (err) {
        console.error("guildCreate error:", err);

        try {
            await guild.leave();
        } catch {}
    }
});

// =========================
// EVENTS
// =========================
client.on("messageCreate", require("./events/messageCreate"));
client.on("voiceStateUpdate", require("./events/voiceStateUpdate"));
client.once("ready", require("./events/ready"));

// =========================
// MONGO
// =========================
mongoose.connect(process.env.MONGO)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Error:", err));

// =========================
// WEEKLY RESET
// =========================
require("./events/weeklyReset")(client);

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
