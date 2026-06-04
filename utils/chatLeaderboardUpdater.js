const GuildLB = require("../models/GuildLB");

const WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = (client) => {
    setInterval(async () => {

        const guilds = await GuildLB.find();

        for (const data of guilds) {
            if (!data.chatLB?.channelId) continue;

            const channel = await client.channels.fetch(data.chatLB.channelId).catch(() => null);
            if (!channel) continue;

            const msg = await channel.messages.fetch(data.chatLB.messageId).catch(() => null);
            if (!msg) continue;

            const map = {};

            for (const l of data.chatLB.logs) {
                if (Date.now() - l.time > WEEK) continue;
                map[l.userId] = (map[l.userId] || 0) + 1;
            }

            const top = Object.entries(map)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            let text = `💬 Top Chatters - 7 Day Window\n\n`;

            top.forEach((u, i) => {
                text += `${i === 0 ? "👑" : `\`${i + 1}.\``} <@${u[0]}> - ${u[1]} messages\n`;
            });

            await msg.edit({
                embeds: [{ color: 0x2b2d31, description: text }]
            }).catch(() => null);
        }

    }, 60000);
};
