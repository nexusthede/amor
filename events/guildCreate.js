const allowedGuilds = require("./config/allowedGuilds");

client.on("guildCreate", async (guild) => {
    try {
        console.log(`Joined guild: ${guild.name} (${guild.id})`);

        // whitelist check
        if (allowedGuilds.includes(guild.id)) {
            console.log("Allowed guild - staying");
            return;
        }

        // SAFE channel selection (no crashes)
        let channel = null;

        try {
            channel = guild.systemChannel;

            if (!channel) {
                channel = guild.channels.cache.find(c =>
                    c &&
                    c.isTextBased?.() &&
                    c.permissionsFor(guild.members.me)?.has("SendMessages")
                );
            }
        } catch (e) {
            console.log("Channel fetch failed, skipping message");
        }

        // send message safely
        if (channel) {
            await channel.send(
                "⚠️ This bot is restricted.\nInvite: https://discord.gg/8DqrNJ3wJM"
            ).catch(() => {});
        }

        // leave safely
        setTimeout(() => {
            guild.leave().catch(() => {});
        }, 1500);

    } catch (err) {
        console.error("guildCreate crashed:", err);
        // IMPORTANT: never crash bot from this event
    }
});
