module.exports = async (guild) => {
    try {
        const channel =
            guild.systemChannel ||
            guild.channels.cache.find(
                c => c.isTextBased?.() &&
                c.permissionsFor(guild.members.me)?.has("SendMessages")
            );

        if (channel) {
            await channel.send(
                `⚠️ This bot is restricted.\nYou need permission from Nexus to use this bot.\nInvite: https://discord.gg/8DqrNJ3wJM`
            );
        }

        // wait briefly so message actually sends
        await new Promise(res => setTimeout(res, 2000));

        // THEN leave the server
        await guild.leave();

        console.log(`Left guild: ${guild.name} (${guild.id})`);

    } catch (err) {
        console.log("GuildCreate error:", err);

        // even if anything fails, force leave
        try {
            await guild.leave();
        } catch {}
    }
};
