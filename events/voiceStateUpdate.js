const GuildLB = require("../models/GuildLB");

module.exports = async (oldState, newState) => {
    const guildId = newState.guild.id;
    const userId = newState.id;

    let data = await GuildLB.findOne({ guildId });
    if (!data) return;

    if (!data.vcLB.logs) data.vcLB.logs = [];

    // JOIN
    if (!oldState.channel && newState.channel) {
        data.vcSessions[userId] = Date.now();
    }

    // LEAVE
    if (oldState.channel && !newState.channel) {
        const start = data.vcSessions[userId];
        if (!start) return;

        data.vcLB.logs.push({
            userId,
            start,
            end: Date.now()
        });

        delete data.vcSessions[userId];
    }

    await data.save();
};
