const express = require("express");
const { authUser } = require("../middleware/authuser");
const { Chat } = require("../models/chat");
const chatRouter = express.Router();

chatRouter.get("/chat/:connectionUserId", authUser, async (req, res) => {
  try {
    const { connectionUserId } = req.params;
    const userId = req.user._id;
    const chat = await Chat.findOne({
      participants: { $all: [userId, connectionUserId] },
    }).populate({
      path: "messages.senderId",
      select: "name",
    }).populate({
      path: "participants",
      select: "name",
    });
    if (!chat) {
      const chat = new Chat({
        participants: [userId, connectionUserId],
        messages: [],
      });
      await chat.save();
      return res.json(chat);
    }
    res.json(chat);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error fetching chats" });
  }
});
module.exports = chatRouter;
