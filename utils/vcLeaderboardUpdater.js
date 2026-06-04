const GuildLB = require("../models/GuildLB");

const WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = (client) => {
    setInterval(async () => {

        const guilds = await GuildLB.find();

        for (const data of guilds) {
            if (!data.vcLB?.channelId || !data.vcLB?.messageId) continue;
            if (!Array.isArray(data.vcLB.logs)) continue;

            const channel = await client.channels.fetch(data.vcLB.channelId).catch(() => null);
            if (!channel) continue;

            const msg = await channel.messages.fetch(data.vcLB.messageId).catch(() => null);
            if (!msg) continue;

            const map = {};

            // FIXED: now uses minutes instead of start/end
            for (const s of data.vcLB.logs) {
                if (!s?.userId || !s?.minutes) continue;

                map[s.userId] = (map[s.userId] || 0) + (s.minutes * 60);
            }

            const top = Object.entries(map)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            let text = `🏆 **Top VC Champions - 7 Day Window**\n\n`;

            top.forEach((u, i) => {
                const totalSeconds = Math.floor(u[1]);

                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;

                text += `${i === 0 ? "👑" : `\`${i + 1}.\``} <@${u[0]}> - **${h}h ${m}m ${s}s**\n`;
            });

            const now = Date.now();
            const start = new Date(now - WEEK);
            const end = new Date(now);

            const footerText =
                `${start.toISOString().slice(0,16).replace("T"," ")} → ` +
                `${end.toISOString().slice(0,16).replace("T"," ")} • 7d window • Updates every 60s (UTC)`;

            await msg.edit({
                embeds: [{
                    color: require("../config").embedColor,
                    description: text,
                    footer: { text: footerText }
                }]
            }).catch(() => null);
        }

    }, 60000);
};
