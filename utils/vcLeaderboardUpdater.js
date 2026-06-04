const GuildLB = require("../models/GuildLB");

const WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = (client) => {
    setInterval(async () => {

        const guilds = await GuildLB.find();

        for (const data of guilds) {
            if (!data.vcLB?.channelId) continue;

            const channel = await client.channels.fetch(data.vcLB.channelId).catch(() => null);
            if (!channel) continue;

            const msg = await channel.messages.fetch(data.vcLB.messageId).catch(() => null);
            if (!msg) continue;

            const map = {};

            for (const s of data.vcLB.logs) {
                if (Date.now() - s.end > WEEK) continue;

                const time = (s.end - s.start) / 1000;
                map[s.userId] = (map[s.userId] || 0) + time;
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
                embeds: [{ color: 0x2b2d31, description: text }]
            }).catch(() => null);
        }

    }, 60000);
};
