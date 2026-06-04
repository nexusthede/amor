const GuildLB = require("../models/GuildLB");

const WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = async (client) => {
    setInterval(async () => {

        const guilds = await GuildLB.find();

        for (const data of guilds) {
            if (!data.chatLB?.logs) continue;
            if (!data.chatLB.channelId || !data.chatLB.messageId) continue;

            const channel = await client.channels.fetch(data.chatLB.channelId).catch(() => null);
            if (!channel) continue;

            const msg = await channel.messages.fetch(data.chatLB.messageId).catch(() => null);
            if (!msg) continue;

            // -------------------------
            // BUILD LEADERBOARD (UNCHANGED LOGIC)
            // -------------------------
            const map = {};

            for (const l of data.chatLB.logs) {
                if (!l?.time || !l?.userId) continue;
                if (Date.now() - l.time > WEEK) continue;

                map[l.userId] = (map[l.userId] || 0) + 1;
            }

            const sorted = Object.entries(map)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            // -------------------------
            // FORMAT (YOUR STYLE)
            // -------------------------
            let text = `💬 **Top Chatters - 7 Day Window**\n\n`;

            sorted.forEach((u, i) => {
                text += `${i === 0 ? "👑" : `\`${i + 1}.\``} <@${u[0]}> - **${u[1]} messages**\n`;
            });

            // -------------------------
            // DYNAMIC FOOTER (FIXED)
            // -------------------------
            const now = Date.now();
            const end = new Date(now);
            const start = new Date(now - WEEK);

            const footerText =
                `${start.toISOString().slice(0,16).replace("T"," ")} → ` +
                `${end.toISOString().slice(0,16).replace("T"," ")} • 7d window • Updates every 60s (UTC)`;

            // -------------------------
            // UPDATE EMBED
            // -------------------------
            await msg.edit({
                embeds: [{
                    description: text,
                    footer: { text: footerText }
                }]
            }).catch(() => null);
        }

    }, 60000);
};
