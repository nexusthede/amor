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
        if (!Array.isArray(data.vcLB.users)) data.vcLB.users = [];

        // helper: get or create user entry
        const getUser = () => {
            let user = data.vcLB.users.find(u => u.userId === userId);
            if (!user) {
                user = { userId, minutes: 0 };
                data.vcLB.users.push(user);
            }
            return user;
        };

        // 🟢 JOIN VC
        if (!oldChannel && newChannel) {

            const active = data.vcLB.logs.find(
                l => l.userId === userId && !l.end
            );

            if (active) return;

            data.vcLB.logs.push({
                userId,
                start: Date.now()
            });

            await data.save().catch(() => null);
            return;
        }

        // 🔁 SWITCH VC (treat as leave + join)
        if (oldChannel && newChannel && oldChannel !== newChannel) {

            const session = data.vcLB.logs.find(
                l => l.userId === userId && !l.end
            );

            if (session) {
                const end = Date.now();
                let minutes = Math.floor((end - session.start) / 60000);
                if (minutes > 720) minutes = 720;

                const user = getUser();
                user.minutes += minutes;

                session.end = end;
                session.minutes = minutes;
            }

            // start new session
            data.vcLB.logs.push({
                userId,
                start: Date.now()
            });

            await data.save().catch(() => null);
            return;
        }

        // 🔴 LEAVE VC
        if (oldChannel && !newChannel) {

            const session = data.vcLB.logs.find(
                l => l.userId === userId && !l.end
            );

            if (!session) return;

            const end = Date.now();
            let minutes = Math.floor((end - session.start) / 60000);

            if (minutes <= 0) return;
            if (minutes > 720) minutes = 720;

            const user = getUser();
            user.minutes += minutes;

            session.end = end;
            session.minutes = minutes;

            await data.save().catch(() => null);
        }
    });
};
