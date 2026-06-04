const GuildLB = require("../models/GuildLB");

module.exports = (client) => {
    client.on("voiceStateUpdate", async (oldState, newState) => {
        const guildId = newState.guild?.id || oldState.guild?.id;
        if (!guildId) return;

        const userId = newState.member?.id;
        if (!userId) return;

        const oldChannel = oldState.channelId;
        const newChannel = newState.channelId;

        const data = await GuildLB.findOne({ guildId });
        if (!data) return;

        if (!data.vcLB) data.vcLB = {};
        if (!Array.isArray(data.vcLB.logs)) data.vcLB.logs = [];

        // 🟢 JOIN VC
        if (!oldChannel && newChannel) {

            // 🚨 FIX 1: prevent duplicate active sessions
            const alreadyActive = data.vcLB.logs.find(
                l => l.userId === userId && !l.end
            );

            if (alreadyActive) return;

            data.vcLB.logs.push({
                userId,
                start: Date.now(),
                end: null
            });

            await data.save().catch(() => null);
            return;
        }

        // 🔁 SWITCH VC (no reset, no duplicate session)
        if (oldChannel && newChannel && oldChannel !== newChannel) {
            return;
        }

        // 🔴 LEAVE VC
        if (oldChannel && !newChannel) {

            // 🚨 FIX 2: only close ONE valid session
            const session = data.vcLB.logs.find(
                l => l.userId === userId && !l.end
            );

            if (!session) return;

            const end = Date.now();
            const duration = end - session.start;

            // 🚨 FIX 3: block broken / inflated sessions
            if (
                duration <= 0 ||
                duration > 12 * 60 * 60 * 1000
            ) return;

            session.end = end;

            await data.save().catch(() => null);
        }
    });
};
