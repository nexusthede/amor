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
    if (!data.vcSessions[userId]) {
        data.vcSessions[userId] = now;
        data.markModified("vcSessions");
    }
}

// =========================
// 🔁 SWITCH VC
// =========================
if (oldVC && newVC && oldVC.id !== newVC.id) {
    if (!data.vcSessions[userId]) {
        data.vcSessions[userId] = now;
        data.markModified("vcSessions");
    }
}

// =========================
// 🎤 LEAVE VC
// =========================
if (oldVC && !newVC) {
    const start = data.vcSessions[userId];

    if (!start || start > now) {
        delete data.vcSessions[userId];
        data.markModified("vcSessions");
        await data.save().catch(() => null);
        return;
    }

    const durationMs = now - start;

    if (
        durationMs <= 0 ||
        durationMs > 12 * 60 * 60 * 1000
    ) {
        delete data.vcSessions[userId];
        data.markModified("vcSessions");
        await data.save().catch(() => null);
        return;
    }

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
    data.markModified("vcSessions");
}

await data.save().catch(() => null);

};
