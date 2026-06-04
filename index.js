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
            vcSessions: {}
        });
    }

    if (!data.vcSessions) data.vcSessions = {};
    if (!data.vcLB) data.vcLB = { logs: [] };
    if (!Array.isArray(data.vcLB.logs)) data.vcLB.logs = [];

    const oldVC = oldState.channel;
    const newVC = newState.channel;

    const now = Date.now();

    const MAX_SESSION = 60 * 60 * 1000; // 1 hour cap (prevents fake long time)

    // =========================
    // 🎤 JOIN VC
    // =========================
    if (!oldVC && newVC) {
        data.vcSessions[userId] = now;
    }

    // =========================
    // 🔁 SWITCH VC
    // =========================
    if (oldVC && newVC && oldVC.id !== newVC.id) {
        data.vcSessions[userId] = now;
    }

    // =========================
    // 🎤 LEAVE VC
    // =========================
    if (oldVC && !newVC) {
        const start = data.vcSessions[userId];

        if (!start || start > now) {
            delete data.vcSessions[userId];
            return;
        }

        let durationMs = now - start;

        // ❌ block weird/AFK inflated sessions
        if (durationMs <= 0) {
            delete data.vcSessions[userId];
            return;
        }

        // ✅ cap session so it can’t give insane time
        if (durationMs > MAX_SESSION) {
            durationMs = MAX_SESSION;
        }

        const minutes = Math.floor(durationMs / 60000);

        if (minutes <= 0) {
            delete data.vcSessions[userId];
            return;
        }

        const existing = data.vcLB.logs.find(l => l.userId === userId);

        if (existing) {
            existing.minutes = (existing.minutes || 0) + minutes;
        } else {
            data.vcLB.logs.push({
                userId,
                minutes
            });
        }

        delete data.vcSessions[userId];
    }

    await data.save().catch(() => null);
};
