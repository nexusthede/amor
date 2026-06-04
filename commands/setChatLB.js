const GuildLB = require("../models/GuildLB");

module.exports = {
    name: "setchatlb",

    async execute(client, message, args, config) {
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply("Mention a channel");

        let data = await GuildLB.findOne({ guildId: message.guild.id });
        if (!data) data = await GuildLB.create({ guildId: message.guild.id });

        const msg = await channel.send({
            embeds: [{
                color: config.embedColor,
                description: "💬 Top Chatters - 7 Day Window"
            }]
        });

        data.chatLB.channelId = channel.id;
        data.chatLB.messageId = msg.id;

        await data.save();

        message.reply("Chat LB set");
    }
};
