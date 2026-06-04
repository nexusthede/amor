const GuildLB = require("../models/GuildLB");
const { weekMs, embedColor, updateInterval } = require("../config");

module.exports = (client) => {
    setInterval(async () => {

        const guilds = await GuildLB.find();

        for (const data of guilds) {
            if (!data.chatLB?.channelId || !data.chatLB?.messageId) continue;

            const channel = await client.channels.fetch(data.chatLB.channelId).catch(() => null);
            if (!channel) continue;

            const msg = await channel.messages.fetch(data.chatLB.messageId).catch(() => null);
            if (!msg) continue;

            const map = {};

            for (const log of data.chatLB.logs || []) {
                if (Date.now() - log.time > weekMs) continue;
                map[log.userId] = (map[log.userId] || 0) + 1;
            }

            const top = Object.entries(map)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            let text = `💬 Top Chatters - 7 Day Window\n\n`;

            top.forEach((u, i) => {
                text += `${i === 0 ? "👑" : `\`${i + 1}.\``} <@${u[0]}> - ${u[1]} messages\n`;
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
