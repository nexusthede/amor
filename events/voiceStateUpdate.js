const GuildLB = require("../models/GuildLB");

module.exports = async (oldState, newState) => {
    if (!newState.guild) return;

    const guildId = newState.guild.id;
    const userId = newState.id;

    let data = await GuildLB.findOne({ guildId });

    if (!data) {
        data = await GuildLB.create({
            guildId,
            chatLB: { logs: [] },
            vcLB: { logs: [] },
            vcSessions: {},
            vcLive: {}
        });
    }

    // 🔥 SAFETY FIXES
    if (!data.vcLB) data.vcLB = { logs: [] };
    if (!data.vcLB.logs) data.vcLB.logs = [];

    if (!data.vcSessions) data.vcSessions = {};

    // =========================
    // 🎤 JOIN VC
    // =========================
    if (!oldState.channel && newState.channel) {
        data.vcSessions[userId] = Date.now();
    }

    // =========================
    // 🎤 LEAVE VC
    // =========================
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
