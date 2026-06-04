const GuildLB = require("../models/GuildLB");

const activeLocks = new Set(); // prevents double triggers

module.exports = async (oldState, newState) => {

    const guildId = newState.guild?.id || oldState.guild?.id;
    if (!guildId) return;

    const userId = newState.id;
    const key = `${guildId}:${userId}`;

    if (activeLocks.has(key)) return;
    activeLocks.add(key);

    setTimeout(() => activeLocks.delete(key), 2000);

    const now = Date.now();
    const MAX = 60 * 60 * 1000;

    let data = await GuildLB.findOne({ guildId });
    if (!data) return;

    if (!data.vcSessions) data.vcSessions = {};
    if (!data.vcLB) data.vcLB = { logs: [] };

    const start = data.vcSessions[userId];

    const addTime = (ms) => {
        if (!ms || ms <= 0) return;

        if (ms > MAX) ms = MAX;

        const mins = Math.floor(ms / 60000);
        if (mins <= 0) return;

        let user = data.vcLB.logs.find(x => x.userId === userId);

        if (user) user.minutes += mins;
        else data.vcLB.logs.push({ userId, minutes: mins });
    };

    // JOIN
    if (!oldState.channel && newState.channel) {
        data.vcSessions[userId] = now;
    }

    // SWITCH (IMPORTANT: only count ONCE)
    else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {

        if (start) addTime(now - start);

        data.vcSessions[userId] = now;
    }

    // LEAVE
    else if (oldState.channel && !newState.channel) {

        if (start) addTime(now - start);

        delete data.vcSessions[userId];
    }

    await data.save().catch(() => null);
};
