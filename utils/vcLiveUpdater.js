const GuildLB = require("../models/GuildLB");
const { updateInterval, embedColor } = require("../config");

module.exports = (client) => {
    setInterval(async () => {

        const guilds = await GuildLB.find();

        if (!guilds || guilds.length === 0) return;

        for (const data of guilds) {

            // -------------------------
            // FALLBACK SAFETY (IMPORTANT)
            // -------------------------
            if (!data) continue;
            if (!data.vcLive) continue;
            if (!data.vcLive.channelId || !data.vcLive.messageId) continue;

            const channel = await client.channels.fetch(data.vcLive.channelId).catch(() => null);
            if (!channel) continue;

            const msg = await channel.messages.fetch(data.vcLive.messageId).catch(() => null);
            if (!msg) continue;

            const guild = channel.guild;
            if (!guild) continue;

            const vcs = guild.channels.cache.filter(c => c.type === 2);

            let total = 0;
            const list = [];

            vcs.forEach(vc => {
                const count = vc.members.size;

                // remove empty VCs
                if (count === 0) return;

                total += count;

                list.push({
                    name: vc.name,
                    count
                });
            });

            list.sort((a, b) => b.count - a.count);

            // -------------------------
            // FALLBACK TEXT
            // -------------------------
            let text;

            if (total === 0) {
                text = `# 🎙️ 0 in voice\n\n*No active voice channels right now*`;
            } else {
                text = `# 🎙️ ${total} in voice\n\n`;

                list.slice(0, 5).forEach(v => {
                    text += `> **${v.name}** · ${v.count} in VC\n`;
                });

                if (list.length > 5) {
                    text += `\n**+ ${list.length - 5} more channels active**\n`;
                }

                const time = new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC"
                });

                text += `\n🔴 · **updates every minute** · ||${time}||`;
            }

            // -------------------------
            // SAFE EMBED UPDATE
            // -------------------------
            await msg.edit({
                embeds: [{
                    color: embedColor || 0x2b2d31,
                    description: text,
                    thumbnail: {
                        url: guild.iconURL({ dynamic: true }) || null
                    }
                }]
            }).catch(() => null);

        }

    }, updateInterval || 60000);
};
