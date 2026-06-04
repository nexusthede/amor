module.exports = (client) => {
    setInterval(async () => {

        const GuildLB = require("../models/GuildLB");
        const guilds = await GuildLB.find();

        for (const data of guilds) {
            if (!data.vcLive?.channelId) continue;

            const channel = await client.channels.fetch(data.vcLive.channelId).catch(() => null);
            if (!channel) continue;

            const msg = await channel.messages.fetch(data.vcLive.messageId).catch(() => null);
            if (!msg) continue;

            const guild = channel.guild;
            const vcs = guild.channels.cache.filter(c => c.type === 2);

            let total = 0;
            const list = [];

            vcs.forEach(vc => {
                total += vc.members.size;

                list.push({
                    name: vc.name,
                    count: vc.members.size
                });
            });

            list.sort((a, b) => b.count - a.count);

            let text = `# 🎙️ ${total} in voice\n\n`;

            list.slice(0, 5).forEach(v => {
                text += `> **${v.name}** · ${v.count} in VC\n`;
            });

            await msg.edit({
                embeds: [{
                    color: 0x2b2d31,
                    description: text,
                    thumbnail: { url: guild.iconURL() }
                }]
            }).catch(() => null);
        }

    }, 60000);
};
