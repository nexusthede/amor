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

        // 🔥 FIX 1: prevent duplicate session overwrite
        if (!data.vcSessions[userId]) {
            data.vcSessions[userId] = now;
        }
    }

    // =========================
    // 🔁 SWITCH VC (IMPORTANT FIX)
    // =========================
    if (oldVC && newVC && oldVC.id !== newVC.id) {

        // 🔥 FIX 2: DO NOT reset time (this was causing inflation)
        // Instead, keep original start time (prevents stacking bug)

        if (!data.vcSessions[userId]) {
            data.vcSessions[userId] = now;
        }
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

        // 🔥 FIX 3: hard cap prevents inflated/bug sessions
        if (
            durationMs <= 0 ||
            durationMs > 12 * 60 * 60 * 1000
        ) {
            delete data.vcSessions[userId];
            return;
        }

        // 🔥 FIX 4: prevent duplicate log writes
        const exists = data.vcLB.logs.find(
            l => l.userId === userId && l.start === start && !l.end
        );

        if (!exists) {
            data.vcLB.logs.push({
                userId,
                start,
                end: now
            });
        }

        delete data.vcSessions[userId];
    }

    // =========================
    // 💾 SAVE
    // =========================
    await data.save().catch(() => null);
};
