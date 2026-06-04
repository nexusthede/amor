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

    if (!data.vcSessions) data.vcSessions = {};
    if (!data.vcLB) data.vcLB = { logs: [] };
    if (!Array.isArray(data.vcLB.logs)) data.vcLB.logs = [];

    const oldVC = oldState.channel;
    const newVC = newState.channel;

    const now = Date.now();

    // =========================
    // 🎤 JOIN VC
    // =========================
    if (!oldVC && newVC) {
        data.vcSessions[userId] = now;
    }

    // =========================
    // 🔁 SWITCH VC (IMPORTANT FIX)
    // =========================
    if (oldVC && newVC && oldVC.id !== newVC.id) {
        // reset session cleanly (prevents time stacking)
        data.vcSessions[userId] = now;
    }

    // =========================
    // 🎤 LEAVE VC
    // =========================
    if (oldVC && !newVC) {
        const start = data.vcSessions[userId];

        // safety check
        if (!start || start > now) {
            delete data.vcSessions[userId];
            return;
        }

        const durationMs = now - start;

        // ignore invalid sessions
        if (durationMs <= 0) {
            delete data.vcSessions[userId];
            return;
        }

        data.vcLB.logs.push({
            userId,
            start,
            end: now
        });

        delete data.vcSessions[userId];
    }

    // =========================
    // 💾 SAVE
    // =========================
    await data.save().catch(() => null);
};
