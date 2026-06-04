const chatUpdater = require("../utils/chatLeaderboardUpdater");
const vcUpdater = require("../utils/vcLeaderboardUpdater");
const vcLiveUpdater = require("../utils/vcLiveUpdater");

module.exports = async (client) => {
    console.log(`${client.user.tag} is online`);

    // 🔥 START ALL SYSTEMS
    chatUpdater(client);
    vcUpdater(client);
    vcLiveUpdater(client);

    console.log("✅ All leaderboard updaters started");
};
