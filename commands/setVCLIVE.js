const GuildLB = require("../models/GuildLB");

module.exports = {
    name: "setvclive",

    async execute(client, message, args, config) {
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply("Mention a channel");

        let data = await GuildLB.findOne({ guildId: message.guild.id });
        if (!data) data = await GuildLB.create({ guildId: message.guild.id });

        const msg = await channel.send({
            embeds: [{
                color: config.embedColor,
                description: "# 🎙️ Loading voice stats..."
            }]
        });

        data.vcLive.channelId = channel.id;
        data.vcLive.messageId = msg.id;

        await data.save();

        message.reply("VC Live set");
    }
};
