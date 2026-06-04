const GuildLB = require("../models/GuildLB");

module.exports = {
    name: "setvclb",

    async execute(client, message, args, config) {
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply("Mention a channel");

        let data = await GuildLB.findOne({ guildId: message.guild.id });
        if (!data) data = await GuildLB.create({ guildId: message.guild.id });

        const msg = await channel.send({
            embeds: [{
                color: config.embedColor,
                description: "🏆 Top VC Champions - 7 Day Window"
            }]
        });

        data.vcLB.channelId = channel.id;
        data.vcLB.messageId = msg.id;

        await data.save();

        message.reply("VC LB set");
    }
};
