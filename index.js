const { Client, GatewayIntentBits } = require("discord.js");
const mongoose = require("mongoose");

const chat = require("./utils/chatLeaderboardUpdater");
const vc = require("./utils/vcLeaderboardUpdater");
const live = require("./utils/vcLiveUpdater");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

mongoose.connect(process.env.MONGO);

client.on("messageCreate", require("./events/messageCreate"));
client.on("voiceStateUpdate", require("./events/voiceStateUpdate"));
client.once("ready", require("./events/ready"));

client.login(process.env.TOKEN);

client.once("ready", async () => {
    chat(client);
    vc(client);
    live(client);
});
