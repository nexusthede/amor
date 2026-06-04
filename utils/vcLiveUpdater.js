const GuildLB = require("../models/GuildLB");
const { updateInterval, embedColor } = require("../config");

module.exports = (client) => {
    setInterval(async () => {

        const guilds = await GuildLB.find();

        for (const data of guilds) {
            if (!data.vcLive?.channelId || !data.vcLive?.messageId) continue;

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
                total += count;

                list.push({
                    name: vc.name,
                    count
                });
            });

            list.sort((a, b) => b.count - a.count);

            let text = `# 🎙️ ${total} in voice\n\n`;

            list.slice(0, 5).forEach(v => {
                text += `> **${v.name}** · ${v.count} in VC\n`;
            });

            await msg.edit({
                embeds: [{
                    color: embedColor,
                    description: text,
                    thumbnail: { url: guild.iconURL({ dynamic: true }) }
                }]
            }).catch(() => null);

        }

    }, updateInterval);
};
