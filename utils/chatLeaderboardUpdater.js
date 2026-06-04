const GuildLB = require("../models/GuildLB");
const { weekMs, embedColor, updateInterval } = require("../config");

module.exports = (client) => {
    setInterval(async () => {

        const guilds = await GuildLB.find();

        for (const data of guilds) {
            if (!data.vcLB?.channelId || !data.vcLB?.messageId) continue;

            const channel = await client.channels.fetch(data.vcLB.channelId).catch(() => null);
            if (!channel) continue;

            const msg = await channel.messages.fetch(data.vcLB.messageId).catch(() => null);
            if (!msg) continue;

            const map = {};

            for (const s of data.vcLB.logs || []) {
                if (Date.now() - s.end > weekMs) continue;

                const seconds = (s.end - s.start) / 1000;
                map[s.userId] = (map[s.userId] || 0) + seconds;
            }

            const top = Object.entries(map)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            let text = `🏆 Top VC Champions - 7 Day Window\n\n`;

            top.forEach((u, i) => {
                const h = Math.floor(u[1] / 3600);
                const m = Math.floor((u[1] % 3600) / 60);

                text += `${i === 0 ? "👑" : `\`${i + 1}.\``} <@${u[0]}> - ${h}h ${m}m\n`;
            });

            await msg.edit({
                embeds: [{
                    color: embedColor,
                    description: text
                }]
            }).catch(() => null);
        }

    }, updateInterval);
};
