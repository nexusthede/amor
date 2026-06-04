const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    guildId: String,

    chatLB: {
        channelId: String,
        messageId: String,
        logs: { type: Array, default: [] }
    },

    vcLB: {
        channelId: String,
        messageId: String,
        logs: { type: Array, default: [] }
    },

    vcSessions: {
        type: Object,
        default: {}
    },

    vcLive: {
        channelId: String,
        messageId: String
    }
});

module.exports = mongoose.model("GuildLB", schema);
