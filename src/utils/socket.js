require("dotenv").config();
const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

var admin = require("./firebaseAdmin");

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

  let onlineUsers = [];

  io.on("connection", (socket) => {
    console.log(`🔵 New user connected: ${socket.id}`);

    socket.on("userOnline", (userId) => {
      if (!onlineUsers.includes(userId)) {
        onlineUsers.push(userId);
      }
      io.emit("updateOnlineUsers", onlineUsers);
      console.log("✅ Online Users:", onlineUsers);
    });

    socket.on("userOffline", (userId) => {
      onlineUsers = onlineUsers.filter((id) => id !== userId);
      io.emit("updateOnlineUsers", onlineUsers);
      console.log("❌ User went offline:", userId);
    });

    // ✅ Joining chat room
    socket.on("joinChat", ({ name, userId, connectionUserId, time, date }) => {
      const roomId = getSecretRoomId(userId, connectionUserId);
      socket.join(roomId);
      console.log(`✅ ${userId} joined chat room: ${roomId}`);
      console.log(`📢 Rooms user ${userId} is in:`, socket.rooms);
    });

    // ✅ Sending message
    socket.on(
      "sendMessage",
      async ({ name, userId, connectionUserId, text, time, date }) => {
        try {
          const roomId = getSecretRoomId(userId, connectionUserId);

          console.log(`📩 User ${userId} is sending message to room: ${roomId}`);
          console.log(`📢 Active rooms for user ${userId}:`, socket.rooms);

          if (!socket.rooms.has(roomId)) {
            console.log(`❌ User ${userId} is not in chat room: ${roomId}`);
            return;
          }

          // ✅ Check if connection exists
          const connectionExists = await ConnectionRequest.findOne({
            $or: [
              {
                fromUserId: userId,
                toUserId: connectionUserId,
                status: "accepted",
              },
              {
                fromUserId: connectionUserId,
                toUserId: userId,
                status: "accepted",
              },
            ],
          });

          console.log("🔍 Checking connection between:", userId, connectionUserId);
          console.log("🔗 Connection Exists:", connectionExists ? "YES" : "NO");

          if (!connectionExists) {
            console.log("❌ You are not connected with this user.");
            return;
          }

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

          io.to(roomId).emit("messageReceived", {
            name,
            text,
            time,
            date,
            senderId: userId,
          });

          console.log(`✅ Message sent successfully in room: ${roomId}`);

          const recipient = await User.findById(connectionUserId);
          if (recipient && recipient.fcmToken) {
            sendPushNotification(
              recipient.fcmToken,
              name,
              text,
              connectionUserId
            );
          }
        } catch (error) {
          console.log("❌ Error sending message:", error);
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
    });
  });
};

const sendPushNotification = async (fcmToken, senderName, messageText, connectionUserId) => {
  if (!fcmToken) {
    console.error("❌ No FCM Token found. Notification not sent.");
    return;
  }

  const message = {
    token: fcmToken,
    notification: {
      title: `New message from ${senderName}`,
      body: messageText,
    },
    data: {
      title: `New message from ${senderName}`,
      body: messageText,
      click_action: `https://devworld.in/chat/${connectionUserId}`,
      messageId: new Date().getTime().toString(),
    },
    webpush: {
      notification: {
        title: `New message from ${senderName}`,
        body: messageText,
        icon: "https://devworld.in/logodevworld.png",
        click_action: `https://devworld.in/chat/${connectionUserId}`,
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Push notification sent successfully:", response);
  } catch (error) {
    console.error("❌ Error sending push notification:", error);

    if (error.code === "messaging/registration-token-not-registered") {
      console.warn("⚠️ Removing expired FCM token:", fcmToken);
      await User.updateOne({ fcmToken }, { $unset: { fcmToken: 1 } });
    }
  }
};

module.exports = initializeSocket;
