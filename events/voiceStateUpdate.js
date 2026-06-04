const GuildLB = require("../models/GuildLB");

module.exports = (client) => {

    if (!client || !client.on) {
        console.error("voiceStateUpdate: client is not passed correctly");
        return;
    }

    client.on("voiceStateUpdate", async (oldState, newState) => {

        const guildId = newState.guild?.id || oldState.guild?.id;
        if (!guildId) return;

        const userId = newState.member?.id || oldState.member?.id;
        if (!userId) return;

        const oldChannel = oldState.channelId;
        const newChannel = newState.channelId;

        const data = await GuildLB.findOne({ guildId });
        if (!data) return;

        if (!data.vcLB) data.vcLB = {};
        if (!Array.isArray(data.vcLB.logs)) data.vcLB.logs = [];

        // 🟢 JOIN VC
        if (!oldChannel && newChannel) {

            const active = data.vcLB.logs.find(
                l => l.userId === userId && !l.end
            );

            if (active) return;

            data.vcLB.logs.push({
                userId,
                start: Date.now(),
                end: null,
                minutes: 0
            });

            await data.save().catch(() => null);
            return;
        }

        // 🔁 SWITCH VC (no reset)
        if (oldChannel && newChannel && oldChannel !== newChannel) return;

        // 🔴 LEAVE VC
        if (oldChannel && !newChannel) {

            const session = data.vcLB.logs.find(
                l => l.userId === userId && !l.end
            );

            if (!session) return;

            const end = Date.now();
            const minutes = Math.floor((end - session.start) / 60000);

            if (minutes <= 0 || minutes > 720) return; // max 12 hours

            session.end = end;
            session.minutes = minutes;

            await data.save().catch(() => null);
        }
    });
};
