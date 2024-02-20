const mongoose = require("mongoose");

const chat = new mongoose.Schema({
  message: { type: String, required: true },
  answer: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId },
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", chat);

module.exports = Chat;