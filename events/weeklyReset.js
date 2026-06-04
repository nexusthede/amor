const GuildLB = require("../models/GuildLB");

let lastResetWeek = null;

module.exports = () => {
    setInterval(async () => {
        try {
            const now = new Date();

            const weekKey = `${now.getUTCFullYear()}-W${getWeekNumber(now)}`;

            // prevent double reset
            if (lastResetWeek === weekKey) return;

            // ONLY allow reset on/after Monday 00:00 UTC (safe window)
            const isResetDay = now.getUTCDay() === 1;
            const isAfterResetTime = now.getUTCHours() >= 0;

            if (!isResetDay || !isAfterResetTime) return;

            const guilds = await GuildLB.find();

            for (const data of guilds) {
                if (!data) continue;

                data.chatLB = data.chatLB || {};
                data.vcLB = data.vcLB || {};

                data.chatLB.logs = [];
                data.vcLB.logs = [];

                await data.save().catch(() => null);
            }

            lastResetWeek = weekKey;

            console.log("✅ Weekly leaderboard reset completed.");
        } catch (err) {
            console.error("Weekly Reset Error:", err);
        }
    }, 60000);
};

// ISO week number
function getWeekNumber(date) {
    const temp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = temp.getUTCDay() || 7;
    temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    return Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
}
