const GuildLB = require("../models/GuildLB");

const WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = async (message) => {
    if (!message.guild || message.author.bot) return;

    let data = await GuildLB.findOne({ guildId: message.guild.id });
    if (!data) data = await GuildLB.create({ guildId: message.guild.id });

    data.chatLB.logs.push({
        userId: message.author.id,
        time: Date.now()
    });

    // cleanup
    data.chatLB.logs = data.chatLB.logs.filter(l => Date.now() - l.time < WEEK);

    await data.save();
};
