const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    time: {
      type: String, // Because toLocaleTimeString() returns a string
    },
    date: {
      type: String, // Because toLocaleDateString() returns a string
    },
    media:{
      type: String,
    },
    mediaType:{
      type:String,
    },
  },
  {
    timestamps: true,
  }
);
const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [messageSchema],
});

const Chat = mongoose.model("Chat", chatSchema);
module.exports = { Chat };
