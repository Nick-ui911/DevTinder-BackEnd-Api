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

  // ✅ Maintain a global array of online users
  let onlineUsers = [];

  io.on("connection", (socket) => {
    // console.log("New user connected");

    // ✅ When user comes online
    socket.on("userOnline", (userId) => {
      if (!onlineUsers.includes(userId)) {
        onlineUsers.push(userId);
      }
      io.emit("updateOnlineUsers", onlineUsers); // Send online users to all clients
      // console.log("Online Users:", onlineUsers);
    });

    // ✅ When user goes offline
    socket.on("userOffline", (userId) => {
      onlineUsers = onlineUsers.filter((id) => id !== userId);
      io.emit("updateOnlineUsers", onlineUsers); // Send updated list to all clients
    });

    // ✅ Joining chat room
    socket.on("joinChat", ({ name, userId, connectionUserId, time, date }) => {
      const roomId = getSecretRoomId(userId, connectionUserId);
      socket.join(roomId);
    });

    // ✅ Sending message
    socket.on(
      "sendMessage",
      async ({ name, userId, connectionUserId, text, time, date }) => {
        try {
          const roomId = getSecretRoomId(userId, connectionUserId);

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

          if (!connectionExists) {
            console.log("You are not connected with this user.");
            return;
          }

          // ✅ Save message to DB
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

          // ✅ Emit message to specific room
          io.to(roomId).emit("messageReceived", {
            name,
            text,
            time,
            date,
            senderId: userId,
          });

          // ✅ Fetch FCM token of recipient
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
          console.log(error);
        }
      }
    );

    // ✅ When user disconnects
    socket.on("disconnect", () => {
      // console.log("User disconnected");
    });
  });
};

// Function to send push notifications
const sendPushNotification = async (fcmToken, senderName, messageText, connectionUserId) => {
  if (!fcmToken) {
    console.error("❌ No FCM Token found. Notification not sent.");
    return;
  }


  const message = {
    token: fcmToken,
    notification: { // ✅ Used for Background Notifications
      title: `New message from ${senderName}`,
      body: messageText,
    },
    data: { // ✅ Used for Foreground Notifications (Handled Manually)
      title: `New message from ${senderName}`,
      body: messageText,
      click_action: `https://devworld.in/chat/${connectionUserId}`,
      messageId: new Date().getTime().toString(),
    },
    webpush: { // ✅ Ensures proper click action in background
      notification: {
        title: `New message from ${senderName}`,
        body: messageText,
        icon: "https://devworld.in/logodevworld.png", // ✅ Ensure this is a valid URL
        click_action: `https://devworld.in/chat/${connectionUserId}`, // ✅ Clicking notification opens this URL
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    // console.log("✅ Push notification sent successfully:", response);
  } catch (error) {
    console.error("❌ Error sending push notification:", error);

    if (error.code === "messaging/registration-token-not-registered") {
      console.warn("⚠️ Removing expired FCM token:", fcmToken);
      await User.updateOne({ fcmToken }, { $unset: { fcmToken: 1 } });
    }
  }
};


module.exports = initializeSocket;
