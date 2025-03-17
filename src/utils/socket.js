const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");

const getSecretRoomId = (userId, connectionUserId) => {
  const secretRoomId = crypto
    .createHash("sha256")
    .update([userId, connectionUserId].sort().join("_"))
    .digest("hex");
  return secretRoomId;
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });
  io.on("connection", (socket) => {

    socket.on("joinChat", ({ name, userId, connectionUserId, time, date }) => {
      const roomId = getSecretRoomId(userId, connectionUserId);
      //   console.log(name + "join the chat" + roomId + "-" + time + "-" + date);
      socket.join(roomId);
    });

    // here in this event we have to save mesage in database when someone sends a message
    socket.on(
      "sendMessage",
      async ({ name, userId, connectionUserId, text, time, date }) => {
        try {
          const roomId = getSecretRoomId(userId, connectionUserId);
          // console.log(name + "  " + text + "_" + time + " " + date);

                // ✅ Check if connection exists in either direction
      const connectionExists = await ConnectionRequest.findOne({
        $or: [
          { fromUserId: userId, toUserId: connectionUserId, status: "accepted" },
          { fromUserId: connectionUserId, toUserId: userId, status: "accepted" }
        ]
      });

      if (!connectionExists) {
        console.log("You are not connected with this user.");
        return; // Don't allow message sending if not connected
      }

          //   saving from here, a message in database
          let chat = await Chat.findOne({
            participants: { $all: [userId, connectionUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userId, connectionUserId],
              messages: [],
            });
          }
          chat.messages.push({
            senderId: userId,
            text,
            time,
            date,
          });
          await chat.save();
          io.to(roomId).emit("messageReceived", { name, text, time, date,senderId: userId,  });
        } catch (error) {
          console.log(error);
        }
      }
    );
    socket.on("typing", ({ roomId }) => {
      socket.to(roomId).emit("userTyping", { typing: true });
      console.log("User is typing in room:", roomId);
    });
    
    socket.on("stopTyping", ({ roomId }) => {
      socket.to(roomId).emit("userTyping", { typing: false });
    });
    
    socket.on("disconnect", () => {});
  });
};
module.exports = initializeSocket;
